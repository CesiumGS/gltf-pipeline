'use strict';
var Cesium = require('cesium');
var child_process = require('child_process');
var fsExtra = require('fs-extra');
var Jimp = require('jimp');
var os = require('os');
var path = require('path');
var Promise = require('bluebird');
var uuid = require('uuid');
var getTempDirectory = require('./getTempDirectory');

var jimpGetBuffer = Promise.promisify(Jimp.prototype.getBuffer);

var CesiumMath = Cesium.Math;
var combine = Cesium.combine;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;
var WebGLConstants = Cesium.WebGLConstants;

module.exports = compressTexture;

var pvrTexToolExtensions = ['.jpeg', '.jpg', '.png', '.bmp'];
var etc2compExtensions = ['.png'];
var crunchExtensions = ['.jpeg', '.jpg', '.png', '.bmp'];
var astcencExtensions = ['.jpeg', '.jpg', '.png', '.bmp', '.gif'];

var compressToolDirectory = path.join(__dirname, '../bin/', os.platform());
var pvrTexToolPath = path.join(compressToolDirectory, 'PVRTexToolCLI');
var etc2compPath = path.join(compressToolDirectory, 'EtcTool');
var crunchPath = path.join(compressToolDirectory, 'crunch');
var astcencPath = path.join(compressToolDirectory, 'astcenc');

var formats = ['pvrtc1', 'pvrtc2', 'etc1', 'etc2', 'astc', 'dxt1', 'dxt3', 'dxt5', 'crunch-dxt1', 'crunch-dxt5'];
var astcBlockSizes = ['4x4', '5x4', '5x5', '6x5', '6x6', '8x5', '8x6', '8x8', '10x5', '10x6', '10x8', '10x10', '12x10', '12x12'];

/**
 * Compress a texture in the glTF model.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {String} imageId The id of the image to compress.
 * @param {Object} options Options defining compressed texture setting. See {@link compressTextures}.
 * @returns {Promise} A promise that resolves to an object containing a buffer and extension of the compressed texture.
 *
 * @see compressTextures
 *
 * @private
 */
function compressTexture(gltf, imageId, options) {
    options = defaultValue(options, {});

    if (!defined(gltf)) {
        throw new DeveloperError('gltf must be defined');
    }

    if (!defined(imageId)) {
        throw new DeveloperError('imageId must be defined');
    }

    var format = options.format;
    if (!defined(format)) {
        throw new DeveloperError('options.format must be defined.');
    }

    if (formats.indexOf(format) === -1) {
        throw new DeveloperError('format "' + format + '" is not a supported format. Supported formats are ' + formats.join(', ') + '.');
    }

    // Set defaults
    options.quality = defaultValue(options.quality, 5);
    options.bitrate = defaultValue(options.bitrate, 2.0);
    options.blockSize = defaultValue(options.blockSize, '8x8'); // 8x8 corresponds to 2.0 bpp for astc
    options.alphaBit = defaultValue(options.alphaBit, false);

    if (options.quality < 0 || options.quality > 10) {
        throw new DeveloperError('Quality must be between 0 and 10.');
    }

    if ((format === 'pvrtc1' || format === 'pvrtc2') && options.bitrate !== 2 && options.bitrate !== 4) {
        throw new DeveloperError('bitrate (bits-per-pixel) must be 2 or 4 when using pvrtc.');
    }

    if (format === 'astc' && (astcBlockSizes.indexOf(options.blockSize) === -1)) {
        throw new DeveloperError('Block size "' + options.blockSize + '" is not supported. Supported values are ' + astcBlockSizes.join(', ') + '.');
    }

    // Choose the compress tool to use
    var inputExtensions;
    var compressFunction;
    var resizeToPowerOfTwo = false;
    var flipY = false;

    if (format === 'pvrtc1' || format === 'pvrtc2') {
        // PVRTC hardware support rectangular power-of-two, but iOS software requires square power-of-two.
        // PVRTexTool has a CLI option for resizing to square power-of-two.
        inputExtensions = pvrTexToolExtensions;
        compressFunction = compressWithPVRTexTool;
    } else if (format === 'etc1' || format === 'etc2') {
        // https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_etc/
        // According to the WEBGL_compressed_texture_etc extension, the size of the image data must be equivalent to
        // floor((width + 3) / 4) * floor((height + 3) / 4) * 8
        // For simplicity just round to the lower power-of-two. etc2comp does not have a resize option so resize with Jimp.
        inputExtensions = etc2compExtensions;
        compressFunction = compressWithEtc2comp;
        resizeToPowerOfTwo = true;
    } else if (format === 'dxt1' || format === 'dxt3' || format === 'dxt5' || format === 'crunch-dxt1' || format === 'crunch-dxt5') {
        // DXT has a multiple-of-four requirement. Crunch has a CLI option for resizing to power-of-two.
        inputExtensions = crunchExtensions;
        compressFunction = compressWithCrunch;
    } else if (format === 'astc') {
        // https://www.opengl.org/registry/specs/KHR/texture_compression_astc_hdr.txt
        // According to KHR_texture_compression_astc_hdr extension, width and height of each sub-image must be a
        // multiple of the block size. Astcenc does not have a resize option so resize with Jimp.
        // Image also needs to be flipped vertically.
        inputExtensions = astcencExtensions;
        compressFunction = compressWithAstcenc;
        resizeToPowerOfTwo = true;
        flipY = true;
    }

    // Save images to a temp directory. The compressed image will be read into the pipeline extras.
    var tempDirectory = getTempDirectory();

    var image = gltf.images[imageId];
    var pipelineExtras = image.extras._pipeline;
    var absolutePath = pipelineExtras.absolutePath;
    var jimpImage = pipelineExtras.jimpImage;
    var source = pipelineExtras.source;
    var transparent = pipelineExtras.transparent;
    var extension = pipelineExtras.extension;
    var imageChanged = pipelineExtras.imageChanged;
    var compressOptions = combine(options, {
        transparent : transparent
    });

    // Check if the image needs to be resized with Jimp
    var width;
    var height;
    var resize = resizeToPowerOfTwo;
    if (defined(jimpImage)) {
        width = jimpImage.bitmap.width;
        height = jimpImage.bitmap.height;
        var isPowerOfTwo = CesiumMath.isPowerOfTwo(width) && CesiumMath.isPowerOfTwo(height);
        var isSquare = (width === height);
        resize = resizeToPowerOfTwo && !isPowerOfTwo;

        // Log warnings if the image will be resized. This applies to all compression formats.
        if ((format === 'pvrtc1' || format === 'pvrtc2') && (!isSquare || !isPowerOfTwo)) {
            console.log('Warning: ' + imageId + ' will be resized to the lower square power-of-two for pvrtc texture compression. To prevent this warning in the future resize any images beforehand.');
        } else if (!isPowerOfTwo) {
            console.log('Warning: ' + imageId + ' will be resized to the lower power-of-two for texture compression. To prevent this warning in the future resize any images beforehand.');
        }
    }

    var compressRaw = resize || flipY || imageChanged || (inputExtensions.indexOf(extension) === -1);
    if (compressRaw) {
        // Several cases where the raw image data is needed:
        // * If the image needs to be resized or flipped
        // * If the image has changed since the gltf was loaded. (e.g. when baking AO into a texture)
        // * If the original image is not a supported extension for the compress tool
        // If the raw image data does not exist then it means the original image is not a
        // supported format - for example gif, ktx, dds, and others.
        if (!defined(jimpImage)) {
            throw new DeveloperError('The input image extension "' + extension + '" is not supported for texture compression.');
        }
        if (flipY) {
            jimpImage.flip(false, true);
        }
        if (resize) {
            width = previousPowerOfTwo(width);
            height = previousPowerOfTwo(height);
            jimpImage.resize(width, height);
        }
    }

    return Promise.resolve(fsExtra.ensureDir(tempDirectory))
        .then(function() {
            if (compressRaw) {
                // Save the raw image as a png and then send to the compression tool
                return compressJimpImage(jimpImage, tempDirectory, compressFunction, compressOptions);
            } else if (defined(absolutePath)) {
                // The external image can be sent directly to the compression tool
                return compressFile(absolutePath, tempDirectory, compressFunction, compressOptions);
            }
            // The embedded image can be saved as-is and then sent to the compression tool
            return compressBuffer(source, extension, tempDirectory, compressFunction, compressOptions);
        })
        .finally(function() {
            return fsExtra.remove(tempDirectory);
        });
}

function previousPowerOfTwo(n) {
    n = n | (n >> 1);
    n = n | (n >> 2);
    n = n | (n >> 4);
    n = n | (n >> 8);
    n = n | (n >> 16);
    return n - (n >> 1);
}

function getTempImagePath(tempDirectory, extension) {
    var randomId = uuid.v4();
    return path.join(tempDirectory, randomId + extension);
}

function createProcess(compressToolPath, options) {
    return new Promise(function (resolve, reject) {
        var child = child_process.spawn(compressToolPath, options);
        child.once('error', function (e) {
            reject(e);
        });
        child.once('exit', function (code) {
            if (code !== 0) {
                reject(new DeveloperError('Converter tool exited with an error code of ' + code));
            } else {
                resolve();
            }
        });
    });
}

function compressJimpImage(jimpImage, tempDirectory, compressFunction, options) {
    // Encode image as png since this is supported by all the compress tools
    return jimpGetBuffer.call(jimpImage, Jimp.MIME_PNG)
        .then(function(buffer) {
            return compressBuffer(buffer, '.png', tempDirectory, compressFunction, options);
        });
}

function compressBuffer(buffer, extension, tempDirectory, compressFunction, options) {
    // Save temporary image file off to a temp directory
    var inputPath = getTempImagePath(tempDirectory, extension);
    return fsExtra.writeFile(inputPath, buffer)
        .then(function() {
            return compressFile(inputPath, tempDirectory, compressFunction, options);
        });
}

function compressFile(inputPath, tempDirectory, compressFunction, options) {
    return compressFunction(inputPath, tempDirectory, options);
}

function runCompressTool(path, options, outputPath) {
    return createProcess(path, options)
        .then(function () {
            return fsExtra.readFile(outputPath);
        });
}

function compressWithEtc2comp(inputPath, tempDirectory, options) {
    var extension = '.ktx';
    var outputPath = getTempImagePath(tempDirectory, extension);

    var quality = options.quality * 10.0; // Map quality to a 0-100 range
    var format = options.format;
    var transparent = options.transparent;
    var alphaBit = options.alphaBit;

    var cliFormat;
    if (format === 'etc1') {
        cliFormat = 'ETC1';
    } else if (format === 'etc2') {
        if (transparent && alphaBit) {
            cliFormat = 'RGB8A1';
        } else if (transparent && !alphaBit) {
            cliFormat = 'RGBA8';
        } else if (!transparent) {
            cliFormat = 'RGB8';
        }
    }

    var cpuCount = os.cpus().length;
    var cliOptions = [inputPath, '-format', cliFormat, '-effort', quality, '-jobs', cpuCount, '-output', outputPath];

    return runCompressTool(etc2compPath, cliOptions, outputPath)
        .then(function(buffer) {
            return {
                buffer : buffer,
                extension : extension
            };
        });
}

function compressWithPVRTexTool(inputPath, tempDirectory, options) {
    var extension = '.ktx';
    var outputPath = getTempImagePath(tempDirectory, extension);

    var format = options.format;
    var quality = Math.floor(options.quality / 2.1); // Map quality to a 0-4 scale
    var bitrate = options.bitrate;
    var transparent = options.transparent;

    var qualityOptions = ['pvrtcfastest', 'pvrtcfast', 'pvrtcnormal', 'pvrtchigh', 'pvrtcbest'];
    var cliQuality = qualityOptions[quality];
    var cliFormat;

    if (format === 'pvrtc1') {
        if (transparent && bitrate === 2) {
            cliFormat = 'PVRTC1_2';
        } else if (transparent && bitrate === 4) {
            cliFormat ='PVRTC1_4';
        } else if (!transparent && bitrate === 2) {
            cliFormat = 'PVRTC1_2_RGB';
        } else if (!transparent && bitrate === 4) {
            cliFormat = 'PVRTC1_4_RGB';
        }
    } else if (format === 'pvrtc2') {
        if (bitrate === 2) {
            cliFormat = 'PVRTC2_2';
        } else if (bitrate === 4) {
            cliFormat = 'PVRTC2_4';
        }
    }

    // No CPU count - this tool is single-threaded
    var cliOptions = ['-i', inputPath, '-o', outputPath, '-f', cliFormat, '-q', cliQuality, '-square', '-', '-pot', '-'];

    return runCompressTool(pvrTexToolPath, cliOptions, outputPath)
        .then(function(buffer) {
            return {
                buffer : buffer,
                extension : extension
            };
        });
}

function compressWithCrunch(inputPath, tempDirectory, options) {
    var format = options.format;
    var transparent = options.transparent;

    var extension;
    var cliFormat;
    var fileFormat;

    if (format.indexOf('crunch') >= 0) {
        extension = '.crn';
        fileFormat = 'crn';
        format = format.slice(7);
    } else {
        extension = '.ktx';
        fileFormat = 'ktx';
    }

    if (format === 'dxt1') {
        if (transparent && (fileFormat === 'crn')) {
            console.log('Crunch compressor does not support dxt1 with alpha, the alpha channel will be ignored.');
            cliFormat = '-DXT1';
        } else if (transparent) {
            cliFormat = '-DXT1A';
        } else {
            cliFormat = '-DXT1';
        }
    } else if (format === 'dxt3') {
        cliFormat = '-DXT3';
    } else if (format === 'dxt5') {
        cliFormat = '-DXT5';
    }

    var outputPath = getTempImagePath(tempDirectory, extension);
    var cpuCount = os.cpus().length;
    var cliOptions = ['-file', inputPath, '-out', outputPath, '-fileformat', fileFormat, '-helperThreads', cpuCount, '-rescalemode', 'lo', '-mipMode', 'None', cliFormat];

    if (fileFormat === 'crn') {
        // -dxtQuality flag has no effect here. Use -quality instead.
        var crnQuality = options.quality * 25.5; // Map quality to 0-255 range
        cliOptions.push('-quality', crnQuality);
    } else {
        // Clustered DXTc compression is not supported for .ktx files. Until then ignore the -quality and -bitrate flags here.
        var quality = Math.floor(options.quality / 2.1); // Map quality to a 0-4 scale
        var dxtQualityOptions = ['superfast', 'fast', 'normal', 'better', 'uber'];
        var dxtQuality = dxtQualityOptions[quality];
        cliOptions.push('-dxtQuality', dxtQuality);
    }

    return runCompressTool(crunchPath, cliOptions, outputPath)
        .then(function(buffer) {
            // Crunch sets glTypeSize to 0 but it should be 1
            if (extension === '.ktx') {
                buffer.writeUInt32LE(1, 20);
            }
            return {
                buffer : buffer,
                extension : extension
            };
        });
}

function numberToString(number) {
    if (number % 1 === 0) {
        // Add a .0 to whole numbers
        return number.toFixed(1);
    }
    return number.toString();
}

function compressWithAstcenc(inputPath, tempDirectory, options) {
    var outputPath = getTempImagePath(tempDirectory, '.astc');

    // This tool has many low-level adjustment controls, but probably not worth exposing unless needed.
    var quality = Math.floor(options.quality / 2.1); // Map quality to a 0-4 scale
    var bitrate = options.bitrate;
    var blockSize = options.blockSize;
    var transparent = options.transparent;

    var qualityOptions = ['-veryfast', '-fast', '-medium', '-thorough', '-exhaustive'];
    var cliQuality = qualityOptions[quality];

    var cliRate;
    if (bitrate !== 2.0) {
        // The CLI tool accepts either a bitrate or a block-size. If the provided bitrate is not the default (2.0)
        // then use the bitrate rather than the block size.
        // astcenc requires bitrates to have at least one actual decimal
        cliRate = numberToString(bitrate);
    } else {
        cliRate = blockSize;
    }

    var cpuCount = os.cpus().length;
    var cliOptions = ['-cl', inputPath, outputPath, cliRate, '-j', cpuCount, cliQuality];

    if (transparent) {
        cliOptions.push('-alphablend');
    }

    return runCompressTool(astcencPath, cliOptions, outputPath)
        .then(function(buffer) {
            buffer = astcToKtx(buffer, blockSize);
            return {
                buffer : buffer,
                extension : '.ktx'
            };
        });
}

function astcToKtx(astcBuffer) {
    // Extract block size and image size from the astc header
    var blockWidth = astcBuffer.readUInt8(4);
    var blockHeight = astcBuffer.readUInt8(5);
    var xsize = [
        astcBuffer.readUInt8(7),
        astcBuffer.readUInt8(8),
        astcBuffer.readUInt8(9)
    ];
    var ysize = [
        astcBuffer.readUInt8(10),
        astcBuffer.readUInt8(11),
        astcBuffer.readUInt8(12)
    ];

    var pixelHeight = xsize[0] + 256 * xsize[1] + 65536 * xsize[2];
    var pixelWidth = ysize[0] + 256 * ysize[1] + 65536 * ysize[2];

    // glInternalFormat ranges from COMPRESSED_RGBA_ASTC_4x4_KHR to COMPRESSED_RGBA_ASTC_12x12_KHR
    var blockSize = blockWidth + 'x' + blockHeight;
    var glInternalFormat = 0x93B0 + astcBlockSizes.indexOf(blockSize);
    var glBaseInternalFormat = WebGLConstants.RGBA;

    var imageData = astcBuffer.slice(16);
    var imageSize = imageData.length;

    var ktxHeader = Buffer.allocUnsafe(68);

    var indentifier = [0xAB, 0x4B, 0x54, 0x58, 0x20, 0x31, 0x31, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A];
    for (var i = 0; i < 12; ++i) {
        ktxHeader.writeUInt8(indentifier[i], i);
    }

    ktxHeader.writeUInt32LE(0x04030201, 12); // endianness
    ktxHeader.writeUInt32LE(0, 16); // glType
    ktxHeader.writeUInt32LE(1, 20); // glTypeSize
    ktxHeader.writeUInt32LE(0, 24); // glFormat
    ktxHeader.writeUInt32LE(glInternalFormat, 28); // glInternalFormat
    ktxHeader.writeUInt32LE(glBaseInternalFormat, 32); // glBaseInternalFormat
    ktxHeader.writeUInt32LE(pixelWidth, 36); // pixelWidth
    ktxHeader.writeUInt32LE(pixelHeight, 40); // pixelHeight
    ktxHeader.writeUInt32LE(0, 44); // pixelDepth
    ktxHeader.writeUInt32LE(0, 48); // numberOfArrayElements
    ktxHeader.writeUInt32LE(1, 52); // numberOfFaces
    ktxHeader.writeUInt32LE(1, 56); // numberOfMipmapLevels
    ktxHeader.writeUInt32LE(0, 60); // bytesOfKeyValueData
    ktxHeader.writeUInt32LE(imageSize, 64); // imageSize

    return Buffer.concat([ktxHeader, imageData]);
}
