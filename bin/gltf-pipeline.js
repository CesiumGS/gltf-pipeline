#!/usr/bin/env node
'use strict';
var Cesium = require('cesium');
var Promise = require('bluebird');
var argv = require('yargs').argv;
var fs = require('fs-extra');
var path = require('path');
var zlib = require('zlib');

var Pipeline = require('../lib/Pipeline');
var addCesiumRTC = require('../lib/addCesiumRTC');
var getBinaryGltf = require('../lib/getBinaryGltf');
var loadGltfUris = require('../lib/loadGltfUris');
var parseBinaryGltf = require('../lib/parseBinaryGltf');

var Cartesian3 = Cesium.Cartesian3;
var DeveloperError = Cesium.DeveloperError;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

var processFileToDisk = Pipeline.processFileToDisk;
var processJSONWithExtras = Pipeline.processJSONWithExtras;

var fsReadFile = Promise.promisify(fs.readFile);
var fsWriteFile = Promise.promisify(fs.writeFile);
var zlibGunzip = Promise.promisify(zlib.gunzip);
var zlibGzip = Promise.promisify(zlib.gzip);

if (process.argv.length < 3 || defined(argv.h) || defined(argv.help)) {
    var help =
        'Usage: node ' + path.basename(__filename) + ' [path-to.gltf or path-to.bgltf] [OPTIONS]\n' +
        '  -i --input, input=PATH Read unoptimized glTF from the specified file.\n' +
        '  -o --output, output=PATH write optimized glTF to the specified file.\n' +
        '  -b --binary, write binary glTF file.\n' +
        '  -s --separate, writes out separate geometry/animation data files, shader files and textures instead of embedding them in the glTF file.\n' +
        '  -t --separateImage, write out separate textures, but embed geometry/animation data files, and shader files.\n' +
        '  -q --quantize, quantize the attributes of this model.\n' +
        '  -n --encodeNormals, oct-encode the normals of this model.\n' +
        '  -c --compressTextureCoordinates, compress the texture coordinates of this model.\n' +
        '  -r --removeNormals, strips off existing normals, allowing them to be regenerated.\n' +
        '  -f --faceNormals, if normals are missing, they should be generated using the face normal\n' +
        '  -z --gzip, the output file should be gzipped\n' +
        '     --ao: Bake ambient occlusion to vertex data using default settings ONLY. When specifying other settings, do not use `--ao` on its own. Default: inactive.\n' +
        '     --ao.toTexture: Bake AO to existing diffuse textures instead of to vertices. Does not modify shaders. Default: inactive.\n' +
        '     --ao.groundPlane: Simulate a ground plane at the lowest point of the model when baking AO. Default: inactive.\n' +
        '     --ao.ambientShadowContribution: Amount of AO to show when blending between shader computed lighting and AO. 1.0 is full AO, 0.5 is a 50/50 blend. Default: 0.5\n' +
        '     --ao.quality: Valid settings are high, medium, and low. Default: low\n' +
        '     --cesium, optimize the glTF for Cesium by using the sun as a default light source. \n';
    process.stdout.write(help);
    return;
}

var inputPath = defaultValue(argv._[0], defaultValue(argv.i, argv.input));
var outputPath = defaultValue(argv._[1], defaultValue(argv.o, argv.output));
var binary = defaultValue(defaultValue(argv.b, argv.binary), false);
var separate = defaultValue(defaultValue(argv.s, argv.separate), false);
var separateImage = defaultValue(defaultValue(argv.t, argv.separateImage), false);
var quantize = defaultValue(defaultValue(argv.q, argv.quantize), false);
var encodeNormals = defaultValue(defaultValue(argv.n, argv.encodeNormals), false);
var compressTextureCoordinates = defaultValue(defaultValue(argv.c, argv.compressTextureCoordinates), false);
var removeNormals = defaultValue(defaultValue(argv.r, argv.removeNormals), false);
var faceNormals = defaultValue(defaultValue(argv.f, argv.faceNormals), false);
var gzip = defaultValue(defaultValue(argv.z, argv.gzip), false);
var aoOptions = argv.ao;
var typeofAoOptions = typeof(aoOptions);
if (typeofAoOptions === 'boolean' || typeofAoOptions === 'string') {
    aoOptions = {};
}
var optimizeForCesium = defaultValue(argv.cesium, false);

var fileExtension = path.extname(inputPath);
if (!defined(outputPath)) {
    var outputFileExtension;
    if (fileExtension === '.b3dm') {
        outputFileExtension = '.b3dm';
    } else if (binary) {
        outputFileExtension = '.glb';
    } else {
        outputFileExtension = '.gltf';
    }
    var fileName = path.basename(inputPath, fileExtension);
    var filePath = path.dirname(inputPath);
    // Default output.  For example, path/asset.gltf becomes path/asset-optimized.gltf
    outputPath = path.join(filePath, fileName + '-optimized' + outputFileExtension);
}

var options = {
    aoOptions : aoOptions,
    basePath : path.dirname(inputPath),
    binary : binary,
    compressTextureCoordinates : compressTextureCoordinates,
    embed : !separate,
    embedImage : !separateImage,
    encodeNormals : encodeNormals,
    removeNormals : removeNormals,
    faceNormals : faceNormals,
    optimizeForCesium : optimizeForCesium,
    quantize : quantize
};

function readB3dm(b3dmPath) {
    return fsReadFile(b3dmPath)
        .then(function(buffer) {
            var magic = buffer.toString('utf8', 0, 4);
            if (magic !== 'b3dm') {
                // If the magic isn't b3dm, it could be gzipped
                return zlibGunzip(buffer);
            }
            return buffer;
        });
}

console.time('optimize');
if (fileExtension === '.b3dm') {
    // extract the binary gltf portion of the b3dm
    var batchTableJSONByteLength;
    var batchTableBinaryByteLength;
    var batchLength;
    var batchTable;
    readB3dm(inputPath)
        .then(function(buffer) {
            var magic = buffer.toString('utf8', 0, 4);
            if (magic !== 'b3dm') {
                throw new DeveloperError('magic must be \'b3dm\', not ' + magic);
            }
            var version = buffer.readUInt32LE(4);
            if (version !== 1) {
                throw new DeveloperError('version must be 1, not ' + version);
            }
            var byteLength = buffer.readUInt32LE(8);
            batchTableJSONByteLength = buffer.readUInt32LE(12);
            batchTableBinaryByteLength = buffer.readUInt32LE(16);
            batchLength = buffer.readUInt32LE(20);

            var headerSize = 24;
            batchTable = buffer.slice(headerSize, headerSize + batchTableJSONByteLength + batchTableBinaryByteLength);
            var glbBuffer = buffer.slice(headerSize + batchTable.length, byteLength);
            var gltf = parseBinaryGltf(glbBuffer);
            return loadGltfUris(gltf, options)
                .then(function(gltf) {
                    return processJSONWithExtras(gltf, options);
                });
        })
        .then(function(gltf) {
            var rtcCenter = Cartesian3.unpack(gltf.extensions.CESIUM_RTC.center);
            addCesiumRTC(gltf, {
                position : rtcCenter
            });
            var glb = getBinaryGltf(gltf, !separate, !separateImage).glb;
            var header = new Buffer(24);
            header.write('b3dm');
            header.writeUInt32LE(1, 4);                                                 // version
            header.writeUInt32LE(header.length + batchTable.length + glb.length, 8);    // byteLength
            header.writeUInt32LE(batchTableJSONByteLength, 12);                         // batchTableJSONByteLength
            header.writeUInt32LE(batchTableBinaryByteLength, 16);                       // batchTableBinaryByteLength
            header.writeUInt32LE(batchLength, 20);                                      // batchLength
            var outputBuffer = Buffer.concat([header, batchTable, glb]);
            if (gzip) {
                return zlibGzip(outputBuffer);
            }
            return outputBuffer;
        })
        .then(function(buffer) {
            return fsWriteFile(outputPath, buffer);
        })
        .then(function() {
            console.timeEnd('optimize');
        });
} else {
    processFileToDisk(path, outputPath, options)
        .then(function() {
            console.timeEnd('optimize');
        });
}




