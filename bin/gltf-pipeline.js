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
        checkTransparency: {
            describe: 'Do a more exhaustive check for texture transparency by looking at the alpha channel of each pixel. By default textures are considered to be opaque.',
            type: 'boolean',
            default: defaults.checkTransparency
        },
        secure: {
            describe: 'Prevent the converter from reading textures or mtl files outside of the input directory.',
            type: 'boolean',
            default: defaults.secure
        },
        stats: {
            describe: 'Print statistics to console for input and output glTF files.',
            type: 'boolean',
            default: defaults.stats
        },
        'draco.compressMeshes': {
            alias: 'd',
            describe: 'Compress the meshes using Draco. Adds the KHR_draco_mesh_compression extension.',
            type: 'boolean'
        },
        'draco.compressionLevel': {
            describe: 'Draco compression level [0-10], most is 10, least is 0, default is 7.',
            type: 'number'
        },
        'draco.quantizePosition': {
            describe: 'Quantization bits for position attribute when using Draco compression. Default is 14.',
            type: 'number'
        },
        'draco.quantizeNormal': {
            describe: 'Quantization bits for normal attribute when using Draco compression. Default is 10.',
            type: 'number'
        },
        'draco.quantizeTexcoord': {
            describe: 'Quantization bits for texture coordinate attribute when using Draco compression. Default is 12.',
            type: 'number'
        },
        'draco.quantizeColor': {
            describe: 'Quantization bits for color attribute when using Draco compression. Default is 8.',
            type: 'number'
        },
        'draco.quantizeSkin': {
            describe: 'Quantization bits for skinning attribute (joint indices and joint weights) when using Draco compression. Default is 12.',
            type: 'number'
        },
        'draco.unifiedQuantization': {
            default: false,
            describe: 'Quantize positions of all primitives using the same quantization grid defined by the unified bounding box of all primitives. If this option is not set, quantization is applied on each primitive separately which can result in gaps appearing between different primitives. Default is false.',
            type: 'boolean'
        }
    }).parse(args);

var inputPath = argv.input;
var outputPath = argv.output;

var inputDirectory = path.dirname(inputPath);
var inputName = path.basename(inputPath, path.extname(inputPath));
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
    outputPath = path.join(inputDirectory, inputName + '-processed' + outputExtension);
}

var outputDirectory = path.dirname(outputPath);
var outputName = path.basename(outputPath, path.extname(outputPath));
outputExtension = path.extname(outputPath).toLowerCase();
if (outputExtension !== '.gltf' && outputExtension !== '.glb') {
    console.log('Error: unrecognized file extension "' + outputExtension + '".');
    return;
}

var i;
var dracoOptions;
var length = args.length;
for (i = 0; i < length; ++i) {
    var arg = args[i];
    if (arg.indexOf('--draco.') === 0 || arg === '-d') {
        dracoOptions = defaultValue(argv.draco, {});
    }
}

var options = {
    resourceDirectory: inputDirectory,
    separate: argv.separate,
    separateTextures: argv.separateTextures,
    secure: argv.secure,
    checkTransparency: argv.checkTransparency,
    stats: argv.stats,
    name: outputName,
    dracoOptions: dracoOptions
};

var inputIsBinary = inputExtension === '.glb';
var outputIsBinary = outputExtension === '.glb';

var jsonOptions = {
    spaces: 2
};

var read = inputIsBinary ? fsExtra.readFile : fsExtra.readJson;
var write = outputIsBinary ? fsExtra.outputFile : fsExtra.outputJson;
var writeOptions = outputIsBinary ? undefined : jsonOptions;
var run = inputIsBinary ? (outputIsBinary ? processGlb : glbToGltf) : (outputIsBinary ? gltfToGlb : processGltf);

function saveSeparateResources(separateResources) {
    var resourcePromises = [];
    for (var relativePath in separateResources) {
        if (separateResources.hasOwnProperty(relativePath)) {
            var resource = separateResources[relativePath];
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
        var separateResources = results.separateResources;
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
