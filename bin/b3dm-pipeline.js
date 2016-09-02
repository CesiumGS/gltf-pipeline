#!/usr/bin/env node
'use strict';
var Cesium = require('cesium');
var Promise = require('bluebird');
var argv = require('yargs').argv;
var fs = require('fs-extra');
var glob = require('glob');
var path = require('path');
var zlib = require('zlib');

var Cartesian3 = Cesium.Cartesian3;
var DeveloperError = Cesium.DeveloperError;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

var Pipeline = require('../lib/Pipeline');
var addCesiumRTC = require('../lib/addCesiumRTC');
var generateNormals = require('../lib/generateNormals');
var getBinaryGltf = require('../lib/getBinaryGltf');
var parseBinaryGltf = require('../lib/parseBinaryGltf');
var patchMaterialsForBatchId = require('../lib/patchMaterialsForBatchId');

var processJSONWithExtras = Pipeline.processJSONWithExtras;

var fsReadFile = Promise.promisify(fs.readFile);
var fsWriteFile = Promise.promisify(fs.writeFile);
var globAsync = Promise.promisify(glob);
var zlibGzip = Promise.promisify(zlib.gzip);
var zlibGunzip = Promise.promisify(zlib.gunzip);

if (process.argv.length < 3 || defined(argv.h) || defined(argv.help)) {
    var help =
        'Usage: node ' + path.basename(__filename) + ' [path-to.b3dm] [OPTIONS]\n' +
        '  -d --directory, directory=PATH Optimize all b3dm in the specified directory in place recursively.\n' +
        '  -s --separate, writes out separate geometry/animation data files, shader files and textures instead of embedding them in the b3dm.\n' +
        '  -t --separateImage, write out separate textures, but embed geometry/animation data files, and shader files.\n' +
        '  -q --quantize, quantize the attributes of this model.\n' +
        '  -n --encodeNormals, oct-encode the normals of this model.\n' +
        '  -c --compressTextureCoordinates, compress the texture coordinates of this model.\n' +
        '  -f --faceNormals, if normals are missing, they should be generated using the face normal\n' +
        '     --deleteNormals, delete the existing normals so that they will be regenerated\n' +
        '     --cleanMaterials, sets default specular and diffuse to reasonable values\n' +
        '  -z --gzip, the output should be gzipped\n' +
        '     --ao: Bake ambient occlusion to vertex data using default settings ONLY. When specifying other settings, do not use `--ao` on its own. Default: inactive.\n' +
        '     --ao.toTexture: Bake AO to existing diffuse textures instead of to vertices. Does not modify shaders. Default: inactive.\n' +
        '     --ao.groundPlane: Simulate a ground plane at the lowest point of the model when baking AO. Default: inactive.\n' +
        '     --ao.ambientShadowContribution: Amount of AO to show when blending between shader computed lighting and AO. 1.0 is full AO, 0.5 is a 50/50 blend. Default: 0.5\n' +
        '     --ao.quality: Valid settings are high, medium, and low. Default: low\n' +
        '     --cesium, optimize the glTF for Cesium by using the sun as a default light source. \n';
    process.stdout.write(help);
    return;
}

var gzip = defaultValue(defaultValue(argv.z, argv.gzip), false);
var directory = defaultValue(argv.d, argv.directory);
var separate = defaultValue(defaultValue(argv.s, argv.separate), false);
var separateImage = defaultValue(defaultValue(argv.t, argv.separateImage), false);
var quantize = defaultValue(defaultValue(argv.q, argv.quantize), false);
var encodeNormals = defaultValue(defaultValue(argv.n, argv.encodeNormals), false);
var compressTextureCoordinates = defaultValue(defaultValue(argv.c, argv.compressTextureCoordinates), false);
var faceNormals = defaultValue(defaultValue(argv.f, argv.faceNormals), false);
var aoOptions = argv.ao;
var typeofAoOptions = typeof(aoOptions);
if (typeofAoOptions === 'boolean' || typeofAoOptions === 'string') {
    aoOptions = {};
}
var optimizeForCesium = defaultValue(argv.cesium, false);

var options = {
    aoOptions : aoOptions,
    compressTextureCoordinates : compressTextureCoordinates,
    embed : !separate,
    embedImage : !separateImage,
    encodeNormals : encodeNormals,
    faceNormals : faceNormals,
    optimizeForCesium : optimizeForCesium,
    quantize : quantize
};

if (defined(directory)) {
    globAsync(path.join(directory, '**/*.b3dm'), undefined)
        .then(function(filePaths) {
            return Promise.map(filePaths, processB3dm);
        });
}

function processB3dm(b3dmPath) {
    var batchLength;
    var batchTableByteLength;
    var batchTableBuffer;
    return readB3dm(b3dmPath)
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
            batchLength = buffer.readUInt32LE(12);
            batchTableByteLength = buffer.readUInt32LE(16);
            batchTableBuffer = buffer.slice(20, 20 + batchTableByteLength);
            var glbBuffer = buffer.slice(20 + batchTableByteLength, byteLength);
            var gltf = parseBinaryGltf(glbBuffer);
            if (argv.deleteNormals) {
                deleteNormals(gltf);
            }
            if (argv.cleanMaterials) {
                cleanMaterials(gltf);
            }
            sanitizeMaterials(gltf);
            generateNormals(gltf, options);
            patchMaterialsForBatchId(gltf);
            var rtcCenter = Cartesian3.unpack(gltf.extensions.CESIUM_RTC.center);
            addCesiumRTC(gltf, {
                position : rtcCenter
            });
            return processJSONWithExtras(gltf, options);
        })
        .then(function(gltf) {
            var glb = getBinaryGltf(gltf, !separate, !separateImage).glb;
            var header = new Buffer(20);
            header.write('b3dm');
            header.writeUInt32LE(1, 4);                                                 // version
            header.writeUInt32LE(header.length + batchTableByteLength + glb.length, 8); // byteLength
            header.writeUInt32LE(batchLength, 12);                                      // batchLength
            header.writeUInt32LE(batchTableByteLength, 16);                             // batchTableByteLength
            var outputBuffer = Buffer.concat([header, batchTableBuffer, glb]);
            if (gzip) {
                return zlibGzip(outputBuffer);
            }
            return outputBuffer;
        })
        .then(function(buffer) {
            return fsWriteFile(b3dmPath, buffer);
        });
}

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

function deleteNormals(gltf) {
    var meshes = gltf.meshes;
    var materials = gltf.materials;
    var techniques = gltf.techniques;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var mesh = meshes[meshId];
            var primitives = mesh.primitives;
            var primitivesLength = primitives.length;
            for (var i = 0; i < primitivesLength; i++) {
                var primitive = primitives[i];
                var attributes = primitive.attributes;
                delete attributes.NORMAL;
                var materialId = primitive.material;
                if (defined(materialId)) {
                    var material = materials[materialId];
                    var techniqueId = material.technique;
                    if (defined(techniqueId)) {
                        var technique = techniques[techniqueId];
                        delete technique.attributes.a_normal;
                        delete technique.parameters.normal;
                    }
                }
            }
        }
    }
}

function sanitizeMaterials(gltf) {
    var materials = gltf.materials;
    for (var materialId in materials) {
        if (materials.hasOwnProperty(materialId)) {
            var material = materials[materialId];
            material.values.specular = [0, 0, 0, 1];
            material.values.diffuse = [1, 1, 0.5, 1];
        }
    }
}
