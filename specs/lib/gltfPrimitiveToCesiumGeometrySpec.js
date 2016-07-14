'use strict';
var gltfPrimitiveToCesiumGeometry = require('../../lib/gltfPrimitiveToCesiumGeometry');
var readGltf = require('../../lib/readGltf');
var addDefaults = require('../../lib/addDefaults');
var readAccessor = require('../../lib/readAccessor');
var packArray = require('../../lib/packArray');

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var primitiveType = 4;

describe('gltfPrimitiveToCesiumGeometry', function() {
    it('returns a geometry', function(done) {
        var options = {};
        readGltf(gltfPath, options)
            .then(function(gltf) {
                addDefaults(gltf);
                var primitive = gltf.meshes[Object.keys(gltf.meshes)[0]].primitives[0];
                var geometry = gltfPrimitiveToCesiumGeometry(gltf, primitive);
    
                var indicesAccessor = gltf.accessors[primitive.indices];
                var indices = [];
                readAccessor(gltf, indicesAccessor, indices);
                
                var positionAccessor = gltf.accessors[primitive.attributes.POSITION];
                var positions = [];
                var positionType = readAccessor(gltf, positionAccessor, positions);
                var packedPositions = packArray(positions, positionType);
                
                var normalAccessor = gltf.accessors[primitive.attributes.NORMAL];
                var normals = [];
                var normalType = readAccessor(gltf, normalAccessor, normals);
                var packedNormals = packArray(normals, normalType);
    
                var textureAccessor = gltf.accessors[primitive.attributes.TEXCOORD_0];
                var coordinates = [];
                var coordinateType = readAccessor(gltf, textureAccessor, coordinates);
                var packedCoordinates = packArray(coordinates, coordinateType);
                
                expect(geometry.attributes.position.values).toEqual(new Float64Array(packedPositions));
                expect(geometry.attributes.normal.values).toEqual(new Float32Array(packedNormals));
                expect(geometry.attributes.st.values).toEqual(new Float32Array(packedCoordinates));
                expect(geometry.indices).toEqual(new Uint32Array(indices));
                expect(geometry.primitiveType).toEqual(primitiveType);
                done();
            });
    });
});
