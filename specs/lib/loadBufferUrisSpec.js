'use strict';
var Promise = require('bluebird');
var fs = require('fs');
var bufferEqual = require('buffer-equal');

var fsReadFile = Promise.promisify(fs.readFile);

var addPipelineExtras = require('../../lib/addPipelineExtras');
var loadGltfUris = require('../../lib/loadGltfUris');

var bufferPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.bin';
var bufferUri = 'data:application/octet-stream;base64,AAABAAIAAwACAAEABAAFAAYABwAGAAUACAAJAAoACwAKAAkADAANAA4ADwAOAA0AEAARABIAEwASABEAFAAVABYAFwAWABUAAAAAvwAAAL8AAAA/AAAAPwAAAL8AAAA/AAAAvwAAAD8AAAA/AAAAPwAAAD8AAAA/AAAAPwAAAD8AAAA/AAAAPwAAAL8AAAA/AAAAPwAAAD8AAAC/AAAAPwAAAL8AAAC/AAAAvwAAAD8AAAA/AAAAPwAAAD8AAAA/AAAAvwAAAD8AAAC/AAAAPwAAAD8AAAC/AAAAPwAAAL8AAAA/AAAAvwAAAL8AAAA/AAAAPwAAAL8AAAC/AAAAvwAAAL8AAAC/AAAAvwAAAL8AAAA/AAAAvwAAAD8AAAA/AAAAvwAAAL8AAAC/AAAAvwAAAD8AAAC/AAAAvwAAAL8AAAC/AAAAvwAAAD8AAAC/AAAAPwAAAL8AAAC/AAAAPwAAAD8AAAC/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AACAPwAAAAAAAAAAAACAPwAAAAAAAAAAAACAPwAAAAAAAAAAAACAPwAAAAAAAAAAAAAAAAAAgD8AAAAAAAAAAAAAgD8AAAAAAAAAAAAAgD8AAAAAAAAAAAAAgD8AAAAAAAAAAAAAgL8AAAAAAAAAAAAAgL8AAAAAAAAAAAAAgL8AAAAAAAAAAAAAgL8AAAAAAACAvwAAAAAAAAAAAACAvwAAAAAAAAAAAACAvwAAAAAAAAAAAACAvwAAAAAAAAAAAAAAAAAAAAAAAIC/AAAAAAAAAAAAAIC/AAAAAAAAAAAAAIC/AAAAAAAAAAAAAIC/AADAQAAAAAAAAKBAAAAAAAAAwED+/38/AACgQP7/fz8AAIBAAAAAAAAAoEAAAAAAAACAQAAAgD8AAKBAAACAPwAAAEAAAAAAAACAPwAAAAAAAABAAACAPwAAgD8AAIA/AABAQAAAAAAAAIBAAAAAAAAAQEAAAIA/AACAQAAAgD8AAEBAAAAAAAAAAEAAAAAAAABAQAAAgD8AAABAAACAPwAAAAAAAAAAAAAAAP7/fz8AAIA/AAAAAAAAgD/+/38/';
var basePath = './specs/data/boxTexturedUnoptimized/';

describe('loadBufferUris', function() {
    var bufferData;
    var options = {
        basePath: basePath
    };

    beforeAll(function(done) {
        fsReadFile(bufferPath)
            .then(function(data) {
                bufferData = data;
                done();
            })
            .catch(function(err) {
                throw err;
            });
    });

    it('loads an external buffer', function(done) {
        var gltf = {
            buffers: [
                {
                    uri: "CesiumTexturedBoxTest.bin"
                }
            ]
        };

        addPipelineExtras(gltf);
        loadGltfUris(gltf, options)
            .then(function() {
                expect(gltf.buffers[0].extras._pipeline.source).toBeDefined();
                expect(bufferEqual(gltf.buffers[0].extras._pipeline.source, bufferData)).toBe(true);
                expect(gltf.buffers[0].extras._pipeline.extension).toEqual('.bin');
                done();
            });
    });

    it('loads an embedded buffer', function(done) {
        var gltf = {
            buffers: [
                {
                    uri: bufferUri
                }
            ]
        };

        addPipelineExtras(gltf);
        loadGltfUris(gltf, options)
            .then(function() {
                expect(gltf.buffers[0].extras._pipeline.source).toBeDefined();
                expect(bufferEqual(gltf.buffers[0].extras._pipeline.source, bufferData)).toBe(true);
                expect(gltf.buffers[0].extras._pipeline.extension).toEqual('.bin');
                done();
            });
    });

    it('loads an external and an embedded buffer', function(done) {
        var gltf = {
            buffers: [
                {
                    uri: bufferUri
                },
                {
                    uri: 'CesiumTexturedBoxTest.bin'
                }
            ]
        };

        addPipelineExtras(gltf);
        loadGltfUris(gltf, options)
            .then(function() {
                expect(gltf.buffers[0].extras._pipeline.source).toBeDefined();
                expect(bufferEqual(gltf.buffers[0].extras._pipeline.source, bufferData)).toBe(true);
                expect(gltf.buffers[1].extras._pipeline.source).toBeDefined();
                expect(gltf.buffers[1].extras._pipeline.extension).toEqual('.bin');
                done();
            });
    });

    it('throws an error', function(done) {
        var gltf = {
            buffers: [
                {
                    uri: 'CesiumTexturedBoxTestError.bin'
                }
            ]
        };

        addPipelineExtras(gltf);
        loadGltfUris(gltf, options)
            .catch(function(err) {
                expect(err).toBeDefined();
                done();
            });
    });
});
