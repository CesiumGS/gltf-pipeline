'use strict';
var readAccessor = require('../../lib/readAccessor');
var readGltf = require('../../lib/readGltf');
var addDefaults = require('../../lib/addDefaults');
var cesiumGeometryToGltfPrimitive = require('../../lib/cesiumGeometryToGltfPrimitive');
var Cesium = require('cesium');
var GeometryAttribute = Cesium.GeometryAttribute;
var Geometry = Cesium.Geometry;
var Cartesian3 = Cesium.Cartesian3;
var Cartesian2 = Cesium.Cartesian2;

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var positionValues = [ -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 
    0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 
    -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5, -0.5, 0.5, 
    -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5,  0.5, -0.5, -0.5, 0.5, 0.5, -0.5 ];
var normalValues = [ 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 
    0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0, -1, 0, 0,
    -1, 0, 0, -1 ];
var stValues = [ 6, 0, 5, 0, 6, 0, 5, 0, 4, 0, 5, 0, 4, 1, 5, 1, 2, 0, 1, 0, 2, 1, 1, 1, 3, 0, 4, 0, 3,
    1, 4, 1, 3, 0, 2, 0, 3, 1, 2, 1, 0, 0, 0, 0, 1, 0, 1, 0 ];
var indices = [2, 0, 1, 1, 3, 2, 4, 5, 6, 7, 6, 5, 8, 9, 10, 11, 10, 9, 12, 
    13, 14, 15, 14, 13, 16, 17, 18, 19, 18, 17, 20, 21, 22, 23, 22, 21 ];
var position = new GeometryAttribute({
    componentDatatype : 5126,
    componentsPerAttribute : 3,
    values : positionValues
});
var normal = new GeometryAttribute({
    componentDatatype : 5126,
    componentsPerAttribute : 3,
    values : normalValues
});
var st = new GeometryAttribute({
    componentDatatype : 5126,
    componentsPerAttribute : 2,
    values : stValues
});

var geometry = new Geometry({
    attributes : {
        position : position,
        normal : normal,
        st : st
    },
    indices : new Uint16Array(indices),
    primitiveType : 4
});

describe('cesiumGeometryToGltfPrimitive', function() {
   it('writes geometry data to a glTF', function(done) {
       var options = {};
       var i;
       readGltf(gltfPath, options, function(gltf) {
           addDefaults(gltf);
           var primitive = gltf.meshes[Object.keys(gltf.meshes)[0]].primitives[0];

           var indicesAccessor = gltf.accessors[primitive.indices];
           var initialIndices = readAccessor(gltf, indicesAccessor).data;

           var positionAccessor = gltf.accessors[primitive.attributes.POSITION];
           var initialPositions = readAccessor(gltf, positionAccessor).data;

           var normalAccessor = gltf.accessors[primitive.attributes.NORMAL];
           var initialNormals = readAccessor(gltf, normalAccessor).data;
           
           var textureAccessor = gltf.accessors[primitive.attributes.TEXCOORD_0];
           var initialCoordinates = readAccessor(gltf, textureAccessor).data;

           cesiumGeometryToGltfPrimitive(gltf, primitive, geometry);

           var newIndices = readAccessor(gltf, indicesAccessor).data;
           var newPositions = readAccessor(gltf, positionAccessor).data;
           var newNormals = readAccessor(gltf, normalAccessor).data;
           var newCoordinates = readAccessor(gltf, textureAccessor).data;
           
           var positionLength = newPositions.length;
           var packedPositions = new Array(positionLength * 3);
           for (i = 0; i < positionLength; ++i) {
               Cartesian3.pack(newPositions[i], packedPositions, i * 3);
           }

           var normalLength = newNormals.length;
           var packedNormals = new Array(positionLength * 3);
           for (i = 0; i < normalLength; ++i) {
               Cartesian3.pack(newNormals[i], packedNormals, i * 3);
           }

           var textureLength = newCoordinates.length;
           var packedCoordinates = new Array(textureLength * 2);
           for (i = 0; i < positionLength; ++i) {
               Cartesian2.pack(newCoordinates[i], packedCoordinates, i * 2);
           }
           
           expect(initialIndices).not.toEqual(indices);
           expect(initialPositions).not.toEqual(positionValues);
           expect(initialNormals).not.toEqual(normalValues);
           expect(initialCoordinates).not.toEqual(stValues);
           
           expect(newIndices).toEqual(indices);
           expect(packedPositions).toEqual(positionValues);
           expect(packedNormals).toEqual(normalValues);
           expect(packedCoordinates).toEqual(stValues);
           done();
       });
    });
});
