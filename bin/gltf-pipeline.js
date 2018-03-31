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
        stats : {
            describe : 'Print statistics to console for input and output glTF files.',
            type : 'boolean',
            default : defaults.stats
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

var options = {
    resourceDirectory : inputDirectory,
    separate : argv.separate,
    separateTextures : argv.separateTextures,
    secure : argv.secure,
    checkTransparency : argv.checkTransparency,
    stats : argv.stats
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
