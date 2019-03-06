#!/usr/bin/env node
'use strict';
const Cesium = require('cesium');
const fsExtra = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const yargs = require('yargs');
const compressDracoMeshes = require('../lib/compressDracoMeshes');
const glbToGltf = require('../lib/glbToGltf');
const gltfToGlb = require('../lib/gltfToGlb');
const processGlb = require('../lib/processGlb');
const processGltf = require('../lib/processGltf');

const defaultValue = Cesium.defaultValue;
const defined = Cesium.defined;

const defaults = processGltf.defaults;
const dracoDefaults = compressDracoMeshes.defaults;

const args = process.argv;

const argv = yargs
    .usage('Usage: node $0 -i inputPath -o outputPath')
    .example('node $0 -i model.gltf')
    .example('node $0 -i model.gltf -b')
    .example('node $0 -i model.glb -o model.gltf')
    .help('h')
    .alias('h', 'help')
    .options({
        input: {
            alias: 'i',
            describe: 'Path to the glTF or glb file.',
            type: 'string',
            normalize: true,
            demandOption: true
        },
        output: {
            alias: 'o',
            describe: 'Output path of the glTF or glb file. Separate resources will be saved to the same directory.',
            type: 'string',
            normalize: true
        },
        binary: {
            alias: 'b',
            describe: 'Convert the input glTF to glb.',
            type: 'boolean',
            default: false
        },
        json: {
            alias: 'j',
            describe: 'Convert the input glb to glTF.',
            type: 'boolean',
            default: false
        },
        separate: {
            alias: 's',
            describe: 'Write separate buffers, shaders, and textures instead of embedding them in the glTF.',
            type: 'boolean',
            default: defaults.separate
        },
        separateTextures: {
            alias: 't',
            describe: 'Write out separate textures only.',
            type: 'boolean',
            default: defaults.separateTextures
        },
        secure: {
            describe: 'Prevent the source model from referencing paths outside of its directory.',
            type: 'boolean',
            default: defaults.secure
        },
        stats: {
            describe: 'Print statistics to console for output glTF file.',
            type: 'boolean',
            default: defaults.stats
        },
        'draco.compressMeshes': {
            alias: 'd',
            describe: 'Compress the meshes using Draco. Adds the KHR_draco_mesh_compression extension.',
            type: 'boolean',
            default: defaults.compressDracoMeshes
        },
        'draco.compressionLevel': {
            describe: 'Draco compression level [0-10], most is 10, least is 0. A value of 0 will apply sequential encoding and preserve face order.',
            type: 'number',
            default: dracoDefaults.compressionLevel
        },
        'draco.quantizePositionBits': {
            describe: 'Quantization bits for position attribute when using Draco compression.',
            type: 'number',
            default: dracoDefaults.quantizePositionBits
        },
        'draco.quantizeNormalBits': {
            describe: 'Quantization bits for normal attribute when using Draco compression.',
            type: 'number',
            default: dracoDefaults.quantizeNormalBits
        },
        'draco.quantizeTexcoordBits': {
            describe: 'Quantization bits for texture coordinate attribute when using Draco compression.',
            type: 'number',
            default: dracoDefaults.quantizeTexcoordBits
        },
        'draco.quantizeColorBits': {
            describe: 'Quantization bits for color attribute when using Draco compression.',
            type: 'number',
            default: dracoDefaults.quantizeColorBits
        },
        'draco.quantizeGenericBits': {
            describe: 'Quantization bits for skinning attribute (joint indices and joint weights) ad custom attributes when using Draco compression.',
            type: 'number',
            default: dracoDefaults.quantizeGenericBits
        },
        'draco.uncompressedFallback': {
            describe: 'Adds uncompressed fallback versions of the compressed meshes.',
            type: 'boolean',
            default: dracoDefaults.uncompressedFallback
        },
        'draco.unifiedQuantization': {
            describe: 'Quantize positions of all primitives using the same quantization grid defined by the unified bounding box of all primitives. If this option is not set, quantization is applied on each primitive separately which can result in gaps appearing between different primitives.',
            type: 'boolean',
            default: dracoDefaults.unifiedQuantization
        },
        'texcomp.<format>.enable': {
            choices: ['pvrtc1', 'pvrtc2', 'etc1', 'etc2', 'astc', 'dxt1', 'dxt3', 'dxt5', 'crunch-dxt1', 'crunch-dxt5'],
            describe: 'Whether to compress textures with the given compressed texture format. If other texcomp.<format> flags are enabled, this is implicitly true. Multiple formats may be supplied by repeating this flag. <format> must be replaced with one of the choices below. Compressed textures are saved as Cesium and 3D Tiles specific metadata inside image.extras.compressedImage3DTiles. More details about texture compression in glTF here: https://github.com/KhronosGroup/glTF/issues/739',
            group: 'Options: Texture Compression',
            type: 'string'
        },
        'texcomp.<format>.quality': {
            choices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            default : 5,
            describe: 'A value between 0 and 10 specifying the quality of the compressed textures. Higher values produce better quality compression but take longer to compute. Different texture formats and compress tools may treat this value differently.',
            group: 'Options: Texture Compression',
            type: 'number'
        },
        'texcomp.<format>.bitrate': {
            default : 2.0,
            describe: 'The bitrate when using the pvrtc or astc formats. For pvrtc supported values are 2.0 and 4.0.',
            group: 'Options: Texture Compression',
            type: 'number'
        },
        'texcomp.<format>.blockSize': {
            choices: ['4x4', '5x4', '5x5', '6x5', '6x6', '8x5', '8x6', '8x8', '10x5', '10x6', '10x8', '10x10', '12x10', '12x12'],
            default : '8x8',
            describe: 'The block size for astc compression. Smaller block sizes result in higher bitrates. This value is ignored if options.bitrate is also set.',
            group: 'Options: Texture Compression',
            type: 'string'
        },
        'texcomp.<format>.alphaBit': {
            default : false,
            describe: 'Store a single bit for alpha. Only supported for etc2.',
            group: 'Options: Texture Compression',
            type: 'boolean'
        }
    }).parse(args);

const inputPath = argv.input;
let outputPath = argv.output;

const inputDirectory = path.dirname(inputPath);
const inputName = path.basename(inputPath, path.extname(inputPath));
const inputExtension = path.extname(inputPath).toLowerCase();
if (inputExtension !== '.gltf' && inputExtension !== '.glb') {
    console.log('Error: unrecognized file extension "' + inputExtension + '".');
    return;
}

let outputExtension;
if (!defined(outputPath)) {
    if (argv.binary) {
        outputExtension = '.glb';
    } else if (argv.json) {
        outputExtension = '.gltf';
    } else {
        outputExtension = inputExtension;
    }
    outputPath = path.join(inputDirectory, inputName + '-processed' + outputExtension);
}

const outputDirectory = path.dirname(outputPath);
const outputName = path.basename(outputPath, path.extname(outputPath));
outputExtension = path.extname(outputPath).toLowerCase();
if (outputExtension !== '.gltf' && outputExtension !== '.glb') {
    console.log('Error: unrecognized file extension "' + outputExtension + '".');
    return;
}

let i;
let dracoOptions;
let texcompOptions;
const length = args.length;
for (i = 0; i < length; ++i) {
    const arg = args[i];
    if (arg.indexOf('--draco.') === 0 || arg === '-d') {
        dracoOptions = defaultValue(argv.draco, {});
    }
    if (arg.indexOf('texcomp') >= 0) {
        texcompOptions = argv.texcomp;
    }
}

// Handle texture compression options
let textureCompressionOptions;
if (defined(texcompOptions)) {
    textureCompressionOptions = [];
    delete texcompOptions['<format>'];
    for (const format in texcompOptions) {
        if (texcompOptions.hasOwnProperty(format)) {
            const formatOptions = texcompOptions[format];
            delete formatOptions.enable;
            formatOptions.format = format;
            textureCompressionOptions.push(formatOptions);
        }
    }
}

const options = {
    resourceDirectory: inputDirectory,
    separate: argv.separate,
    separateTextures: argv.separateTextures,
    secure: argv.secure,
    stats: argv.stats,
    name: outputName,
    dracoOptions: dracoOptions,
    textureCompressionOptions: textureCompressionOptions
};

const inputIsBinary = inputExtension === '.glb';
const outputIsBinary = outputExtension === '.glb';

const jsonOptions = {
    spaces: 2
};

const read = inputIsBinary ? fsExtra.readFile : fsExtra.readJson;
const write = outputIsBinary ? fsExtra.outputFile : fsExtra.outputJson;
const writeOptions = outputIsBinary ? undefined : jsonOptions;
const run = inputIsBinary ? (outputIsBinary ? processGlb : glbToGltf) : (outputIsBinary ? gltfToGlb : processGltf);

function saveSeparateResources(separateResources) {
    const resourcePromises = [];
    for (const relativePath in separateResources) {
        if (separateResources.hasOwnProperty(relativePath)) {
            const resource = separateResources[relativePath];
            const resourcePath = path.join(outputDirectory, relativePath);
            resourcePromises.push(fsExtra.outputFile(resourcePath, resource));
        }
    }
    return resourcePromises;
}

console.time('Total');

read(inputPath)
    .then(function(gltf) {
        return run(gltf, options);
    })
    .then(function(results) {
        const gltf = defaultValue(results.gltf, results.glb);
        const separateResources = results.separateResources;
        return Promise.all([
            write(outputPath, gltf, writeOptions),
            saveSeparateResources(separateResources)
        ]);
    })
    .then(function() {
        console.timeEnd('Total');
    })
    .catch(function(error) {
        console.log(error);
        process.exit(1);
    });
