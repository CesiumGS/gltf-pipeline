'use strict';
var path = require('path');
var mkdirp = require('mkdirp');
var writeSource = require('./writeSource');

module.exports = writeBinaryGltf;

function writeBinaryGltf(gltf, outputPath, isEmbedded, createDirectory) {
    //Create the output directory if specified
    if (createDirectory) {
        outputPath = path.join(path.dirname(outputPath), 'output', path.basename(outputPath));
        mkdirp.sync(path.dirname(outputPath));
    }
    var basePath = path.dirname(outputPath);

    var magic = new Buffer('glTF');
    var version = new Buffer(4);
    version.writeUInt32LE(1);
    var sceneFormat = new Buffer(4);
    sceneFormat.fill(0);

    if (isEmbedded) {

    }
    else {
        //Write external resources

    }


    var scene = new Buffer(JSON.stringify(gltf));
    // console.log(scene);
}