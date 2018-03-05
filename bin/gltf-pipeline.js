#!/usr/bin/env node
'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var yargs = require('yargs');
var glbToGltf = require('../lib/glbToGltf');
var gltfToGlb = require('../lib/gltfToGlb');
var processGlb = require('../lib/processGlb');
var processGltf = require('../lib/processGltf');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

var defaults = processGltf.defaults;

var args = process.argv;

var argv = yargs
    .usage('Usage: node $0 -i inputPath -o outputPath')
    .example('node $0 -i ./specs/data/box.gltf')
    .example('node $0 -i ./specs/data/box.gltf -b')
    .example('node $0 -i ./specs/data/box.glb -o box.gltf')
    .example('node $0 -i ./specs/data/box.gltf -o box-processed.gltf --texcomp.dxt1.enable --texcomp.dxt1.quality=10 --texcomp.etc1.enable')
    .help('h')
    .alias('h', 'help')
    .options({
        input : {
            alias : 'i',
            describe : 'Path to the glTF or glb file.',
            type : 'string',
            normalize : true,
            demandOption : true
        },
        output : {
            alias : 'o',
            describe : 'Output path of the glTF or glb file. External resources will be saved to the same directory.',
            type : 'string',
            normalize : true
        },
        binary : {
            alias : 'b',
            describe : 'Convert the input glTF to glb.',
            type : 'boolean',
            default : false
        },
        json : {
            alias : 'j',
            describe : 'Convert the input glb to glTF.',
            type : 'boolean',
            default : false
        },
        separate : {
            alias : 's',
            describe : 'Write separate buffers, shaders, and textures instead of embedding them in the glTF.',
            type : 'boolean',
            default : defaults.separate
        },
        separateTextures : {
            alias : 't',
            describe : 'Write out separate textures only.',
            type : 'boolean',
            default : defaults.separateTextures
        },
        checkTransparency : {
            describe : 'Do a more exhaustive check for texture transparency by looking at the alpha channel of each pixel. By default textures are considered to be opaque.',
            type : 'boolean',
            default : defaults.checkTransparency
        },
        secure : {
            describe : 'Prevent the converter from reading textures or mtl files outside of the input obj directory.',
            type : 'boolean',
            default : defaults.secure
        },
        quantize : {
            describe : 'Quantize the attributes of this glTF asset using the WEB3D_quantized_attributes extension.',
            type : 'boolean',
            default : defaults.quantize
        },
        stats : {
            describe : 'Print statistics to console for input and output glTF files.',
            type : 'boolean',
            default : defaults.stats
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

var inputPath = argv.input;
var outputPath = argv.output;

var inputDirectory = path.dirname(inputPath);
var inputExtension = path.extname(inputPath).toLowerCase();
if (inputExtension !== '.gltf' && inputExtension !== '.glb') {
    console.log('Error: unrecognized file extension "' + inputExtension + '".');
    return;
}

var outputExtension;
if (!defined(outputPath)) {
    if (argv.binary) {
        outputExtension = '.glb';
    } else if (argv.json) {
        outputExtension = '.gltf';
    } else {
        outputExtension = inputExtension;
    }
    var inputName = path.basename(inputPath, inputExtension);
    outputPath = path.join(inputDirectory, inputName + '-processed' + outputExtension);
}

var outputDirectory = path.dirname(outputPath);
outputExtension = path.extname(outputPath).toLowerCase();
if (outputExtension !== '.gltf' && outputExtension !== '.glb') {
    console.log('Error: unrecognized file extension "' + outputExtension + '".');
    return;
}

// If any raw texcomp parameters were specified, they are enabled
var i;
var texcompOptions;
var length = args.length;
for (i = 0; i < length; ++i) {
    var arg = args[i];
    if (arg.indexOf('texcomp') >= 0) {
        texcompOptions = argv.texcomp;
    }
}

// Handle texture compression options
var textureCompressionOptions;
if (defined(texcompOptions)) {
    textureCompressionOptions = [];
    delete texcompOptions['<format>'];
    for (var format in texcompOptions) {
        if (texcompOptions.hasOwnProperty(format)) {
            var formatOptions = texcompOptions[format];
            delete formatOptions.enable;
            formatOptions.format = format;
            textureCompressionOptions.push(formatOptions);
        }
    }
}

var options = {
    resourceDirectory : inputDirectory,
    separate : argv.separate,
    separateTextures : argv.separateTextures,
    secure : argv.secure,
    checkTransparency : argv.checkTransparency,
    quantize : argv.quantize,
    stats : argv.stats,
    textureCompressionOptions : textureCompressionOptions
};

var inputIsBinary = inputExtension === '.glb';
var outputIsBinary = outputExtension === '.glb';

var jsonOptions = {
    spaces : 2
};

var read = inputIsBinary ? fsExtra.readFile : fsExtra.readJson;
var write = outputIsBinary ? fsExtra.outputFile : fsExtra.outputJson;
var writeOptions = outputIsBinary ? undefined : jsonOptions;
var run = inputIsBinary ? (outputIsBinary ? processGlb : glbToGltf) : (outputIsBinary ? gltfToGlb : processGltf);

function saveExternalResources(externalResources) {
    var resourcePromises = [];
    for (var relativePath in externalResources) {
        if (externalResources.hasOwnProperty(relativePath)) {
            var resource = externalResources[relativePath];
            var resourcePath = path.join(outputDirectory, relativePath);
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
        var gltf = defaultValue(results.gltf, results.glb);
        var externalResources = results.externalResources;
        return Promise.all([
            write(outputPath, gltf, writeOptions),
            saveExternalResources(externalResources)
        ]);
    })
    .then(function() {
        console.timeEnd('Total');
    })
    .catch(function(error) {
        console.log(error);
        process.exit(1);
    });
