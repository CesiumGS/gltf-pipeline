'use strict';
var gltfPrimitiveToCesiumGeometry = require('../../lib/gltfPrimitiveToCesiumGeometry');
var readGltf = require('../../lib/readGltf');
var addDefaults = require('../../lib/addDefaults');
var readAccessor = require('../../lib/readAccessor');
var Cesium = require('cesium');
var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var primitiveType = 4;

describe('gltfPrimitiveToCesiumGeometry', function() {
    it('returns a geometry', function(done) {
        var options = {};
        var i;
        readGltf(gltfPath, options, function(gltf) {
            addDefaults(gltf);
            var primitive = gltf.meshes[Object.keys(gltf.meshes)[0]].primitives[0];
            var geometry = gltfPrimitiveToCesiumGeometry(gltf, primitive);

            var indicesAccessor = gltf.accessors[primitive.indices];
            var indices = readAccessor(gltf, indicesAccessor).data;
            
            var positionAccessor = gltf.accessors[primitive.attributes.POSITION];
            var positions = readAccessor(gltf, positionAccessor).data;
            var positionLength = positions.length;
            var packedPositions = new Array(positionLength * 3);
            for (i = 0; i < positionLength; ++i) {
                Cartesian3.pack(positions[i], packedPositions, i * 3);
            }

            var normalAccessor = gltf.accessors[primitive.attributes.NORMAL];
            var normals = readAccessor(gltf, normalAccessor).data;
            var normalLength = normals.length;
            var packedNormals = new Array(positionLength * 3);
            for (i = 0; i < normalLength; ++i) {
                Cartesian3.pack(normals[i], packedNormals, i * 3);
            }

            var textureAccessor = gltf.accessors[primitive.attributes.TEXCOORD_0];
            var coordinates = readAccessor(gltf, textureAccessor).data;
            var textureLength = coordinates.length;
            var packedCoordinates = new Array(textureLength * 2);
            for (i = 0; i < positionLength; ++i) {
                Cartesian2.pack(coordinates[i], packedCoordinates, i * 2);
            }
            
            expect(geometry.attributes.position.values).toEqual(new Float64Array(packedPositions));
            expect(geometry.attributes.normal.values).toEqual(new Float32Array(packedNormals));
            expect(geometry.attributes.st.values).toEqual(new Float32Array(packedCoordinates));
            expect(geometry.indices).toEqual(new Uint32Array(indices));
            expect(geometry.primitiveType).toEqual(primitiveType);
            done();
        });
    });
});
