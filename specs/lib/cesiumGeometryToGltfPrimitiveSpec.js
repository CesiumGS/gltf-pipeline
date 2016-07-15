'use strict';
var Cesium = require('cesium');

var GeometryAttribute = Cesium.GeometryAttribute;
var Geometry = Cesium.Geometry;

var addDefaults = require('../../lib/addDefaults');
var cesiumGeometryToGltfPrimitive = require('../../lib/cesiumGeometryToGltfPrimitive');
var packArray = require('../../lib/packArray');
var readAccessor = require('../../lib/readAccessor');
var readGltf = require('../../lib/readGltf');

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
       expect(readGltf(gltfPath, options)
           .then(function(gltf) {
               addDefaults(gltf);
               var primitive = gltf.meshes[Object.keys(gltf.meshes)[0]].primitives[0];
    
               var indicesAccessor = gltf.accessors[primitive.indices];
               var initialIndices = [];
               readAccessor(gltf, indicesAccessor, initialIndices);
    
               var positionAccessor = gltf.accessors[primitive.attributes.POSITION];
               var initialPositions = [];
               readAccessor(gltf, positionAccessor, initialPositions);
    
               var normalAccessor = gltf.accessors[primitive.attributes.NORMAL];
               var initialNormals = [];
               readAccessor(gltf, normalAccessor, initialNormals);
               
               var textureAccessor = gltf.accessors[primitive.attributes.TEXCOORD_0];
               var initialCoordinates = [];
               readAccessor(gltf, textureAccessor, initialCoordinates);
    
               cesiumGeometryToGltfPrimitive(gltf, primitive, geometry);
    
               var newIndices = [];
               readAccessor(gltf, indicesAccessor, newIndices);
               
               var newPositions = [];
               var positionType = readAccessor(gltf, positionAccessor, newPositions);
               var packedPositions = packArray(newPositions, positionType);
    
               var newNormals = [];
               var normalType = readAccessor(gltf, normalAccessor, newNormals);
               var packedNormals = packArray(newNormals, normalType);
    
               var newCoordinates = [];
               var coordinateType = readAccessor(gltf, textureAccessor, newCoordinates);
               var packedCoordinates = packArray(newCoordinates, coordinateType);
    
               expect(initialIndices).not.toEqual(indices);
               expect(initialPositions).not.toEqual(positionValues);
               expect(initialNormals).not.toEqual(normalValues);
               expect(initialCoordinates).not.toEqual(stValues);
               
               expect(newIndices).toEqual(indices);
               expect(packedPositions).toEqual(positionValues);
               expect(packedNormals).toEqual(normalValues);
               expect(packedCoordinates).toEqual(stValues);
           }), done).toResolve();
    });
});
