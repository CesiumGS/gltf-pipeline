'use strict';
var Cesium = require('cesium');
var path = require('path');
var yargs = require('yargs');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

module.exports = parseArguments;

/**
 * Exposes parsing an array of command line arguments into an options object as a function.
 * Uses yargs and will produce perhaps undesired console output if used incorrectly.
 *
 * @param [Array] args An array of command line arguments to process into an options object.
 * @returns {Object} An options object usable with pipeline function calls.
 */
function parseArguments(args) {
    var argv = yargs
        .usage('Usage: node $0 -i inputPath -o outputPath')
        .example('node $0 -i ./specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf -o output.gltf')
        .help('h')
        .alias('h', 'help')
        .options({
            'input': {
                alias: 'i',
                describe: 'input=PATH, Read unoptimized glTF from the specified file.',
                group: 'Options:', // make sure 'Options:' is listed first
                normalize: true,
                type: 'string'
            },
            'output': {
                alias: 'o',
                describe: 'output=PATH, Write optimized glTF to the specified file.',
                normalize: true,
                type: 'string'
            },
            'binary': {
                alias: 'b',
                describe: 'Write binary glTF file using KHR_binary_glTF extension.',
                type: 'boolean'
            },
            'separate': {
                alias: 's',
                describe: 'Write separate geometry/animation data files, shader files, and textures instead of embedding them in the glTF asset.',
                type: 'boolean'
            },
            'separateImage': {
                alias: 't',
                describe: 'Write out separate textures, but embeds geometry/animation data files and shader files in the glTF asset.',
                type: 'boolean'
            },
            'quantize': {
                alias: 'q',
                describe: 'Quantize the attributes of this glTF asset using the WEB3D_quantized_attributes extension.',
                type: 'boolean'
            },
            'encodeNormals': {
                alias: 'n',
                describe: 'Oct-encode the normals of this glTF asset.',
                type: 'boolean'
            },
            'compressTextureCoordinates': {
                alias: 'c',
                describe: 'Compress the testure coordinates of this glTF asset.',
                type: 'boolean'
            },
            'removeNormals': {
                alias: 'r',
                describe: 'Strips off existing normals, allowing them to be regenerated.',
                type: 'boolean'
            },
            'faceNormals': {
                alias: 'f',
                describe: 'If normals are missing, they should be generated using the face normal.',
                type: 'boolean'
            },
            'cesium': {
                describe: 'Optimize the glTF for Cesium by using the sun as a default light source.',
                type: 'boolean'
            },
            'kmc.enable': {
                default: false,
                describe: 'Materials should be expressed using the KHR_materials_common extension. If other `kmc` flags are enabled, this is implictly true.',
                group: 'Options: KHR_materials_common',
                type: 'boolean'
            },
            'kmc.doubleSided': {
                default: false,
                describe: 'Declares whether backface culling should be disabled.',
                group: 'Options: KHR_materials_common',
                type: 'boolean'
            },
            'kmc.technique': {
                choices: ['CONSTANT', 'BLINN', 'PHONG', 'LAMBERT'],
                default: 'PHONG',
                describe: 'The lighting model to use.',
                group: 'Options: KHR_materials_common',
                type: 'string'
            },
            'ao.enable': {
                default: false,
                describe: 'Bake ambient occlusion (to vertex data by default). If other `ao` flags are enabled, this is implicitly true.',
                group: 'Options: Ambient Occlusion',
                type: 'boolean'
            },
            'ao.toTexture': {
                default: false,
                describe: 'Bake AO to existing diffuse textures instead of vertices. Does not modify shaders.',
                group: 'Options: Ambient Occlusion',
                type: 'boolean'
            },
            'ao.groundPlane': {
                default: false,
                describe: 'Simulate a ground plane at the lowest point of the model when baking AO.',
                group: 'Options: Ambient Occlusion',
                type: 'boolean'
            },
            'ao.ambientShadowContribution': {
                default: 0.5,
                describe: 'Amount of AO to show when blending shader computed lighting and AO. 1.0 is full AO, 0.5 is a 50/50 blend.',
                group: 'Options: Ambient Occlusion',
                nargs: 1,
                type: 'number'
            },
            'ao.quality': {
                choices: ['high', 'medium', 'low'],
                default: 'low',
                describe: 'Quality to use when baking AO. Valid settings are high, medium, and low.',
                group: 'Options: Ambient Occlusion',
                nargs: 1,
                type: 'string'
            },
            'texcomp.enable': {
                default : false,
                describe: 'Compress textures.',
                group: 'Options: Texture Compression',
                type: 'boolean'
            },
            'texcomp.format': {
                choices: ['pvrtc1', 'pvrtc2', 'etc1', 'etc2', 'astc', 'dxt1', 'dxt3', 'dxt5', 'crunch-dxt1', 'crunch-dxt3', 'crunch-dxt5'],
                describe: 'The compressed texture format.',
                group: 'Options: Texture Compression',
                type: 'string'
            },
            'texcomp.quality': {
                choices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                default : 5,
                describe: 'A value between 0 and 10 specifying the quality of the compressed textures. Higher values produce better quality compression but take longer to compute. Different texture formats and compress tools may treat this value differently.',
                group: 'Options: Texture Compression',
                type: 'number'
            },
            'texcomp.bitrate': {
                default : 2.0,
                describe: 'The bitrate when using the pvrtc or astc formats. For pvrtc supported values are 2.0 and 4.0.',
                group: 'Options: Texture Compression',
                type: 'number'
            },
            'texcomp.blockSize': {
                choices: ['4x4', '5x4', '5x5', '6x5', '6x6', '8x5', '8x6', '8x8', '10x5', '10x6', '10x8', '10x10', '12x10', '12x12'],
                default : '8x8',
                describe: 'The block size for astc compression. Smaller block sizes result in higher bitrates. This value is ignored if options.bitrate is also set.',
                group: 'Options: Texture Compression',
                type: 'string'
            },
            'texcomp.alphaBit': {
                default : false,
                describe: 'Store a single bit for alpha. Not supported for all formats or compress tools.',
                group: 'Options: Texture Compression',
                type: 'boolean'
            }
        }).parse(args);

    // If any raw ao, kmc, or texcomp parameters were specified, they are enabled
    var nargs = process.argv.length;
    for (var i = 0; i < nargs; i++) {
        var arg = process.argv[i];
        if (arg.indexOf('ao') >= 0) {
            argv.ao.enable = true;
        }
        if (arg.indexOf('kmc') >= 0) {
            argv.kmc.enable = true;
        }
        if (arg.indexOf('texcomp') >= 0) {
            argv.texcomp.enable = true;
        }
    }

    var gltfPath = defaultValue(argv.i, argv._[0]);
    var outputPath = defaultValue(argv.o, argv._[1]);

    if (!defined(gltfPath)) {
        yargs.showHelp();
        return;
    }

    if (!defined(outputPath)) {
        var outputFileExtension;
        if (argv.b) {
            outputFileExtension = '.glb';
        } else {
            outputFileExtension = '.gltf';
        }
        var fileExtension = path.extname(gltfPath);
        var fileName = path.basename(gltfPath, fileExtension);
        var filePath = path.dirname(gltfPath);
        // Default output.  For example, path/asset.gltf becomes path/asset-optimized.gltf
        outputPath = path.join(filePath, fileName + '-optimized' + outputFileExtension);
    }

    return {
        aoOptions: argv.ao,
        binary: argv.b,
        compressTextureCoordinates: argv.c,
        embed: !argv.s,
        embedImage: !argv.t,
        encodeNormals: argv.n,
        faceNormals: argv.f,
        inputPath: gltfPath,
        kmcOptions: argv.kmc,
        optimizeForCesium: argv.cesium,
        outputPath: outputPath,
        quantize: argv.q,
        removeNormals: argv.r,
        textureCompressionOptions: argv.texcomp
    };
}