'use strict';
var readAccessor = require('../../lib/readAccessor');
var readGltf = require('../../lib/readGltf');
var addDefaults = require('../../lib/addDefaults');
var geometryToPrimitive = require('../../lib/geometryToPrimitive');
var Cesium = require('cesium');
var GeometryAttribute = Cesium.GeometryAttribute;
var Geometry = Cesium.Geometry;
var Cartesian3 = Cesium.Cartesian3;

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var positionValues = [ -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 
    0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 
    -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5, -0.5, 0.5, 
    -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5,  0.5, -0.5, -0.5, 0.5, 0.5, -0.5 ];
var normalValues = [ 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 
    0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0, -1, 0, 0,
    -1, 0, 0, -1 ];
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

var geometry = new Geometry({
    attributes : {
        position : position,
        normal : normal
    },
    indices : new Uint16Array(indices),
    primitiveType : 4
});

describe('geometryToPrimitive', function() {
   it('writes geometry data to a glTF', function(done) {
       var options = {};
       readGltf(gltfPath, options, function(gltf) {
           addDefaults(gltf);
           var primitive = gltf.meshes[Object.keys(gltf.meshes)[0]].primitives[0];

           var indicesAccessor = gltf.accessors[primitive.indices];
           var initialIndices = readAccessor(gltf, indicesAccessor).data;

           var positionAccessor = gltf.accessors[primitive.attributes.POSITION];
           var initialPositions = readAccessor(gltf, positionAccessor);

           var normalAccessor = gltf.accessors[primitive.attributes.NORMAL];
           var initialNormals = readAccessor(gltf, normalAccessor);

           geometryToPrimitive(gltf, primitive, geometry);

           var newIndices = readAccessor(gltf, indicesAccessor).data;
           var newPositions = readAccessor(gltf, positionAccessor).data;
           var newNormals = readAccessor(gltf, normalAccessor).data;
           
           var positionLength = newPositions.length;
           var packedPositions = new Array(positionLength * 3);
           for (var i = 0; i < positionLength; ++i) {
               Cartesian3.pack(newPositions[i], packedPositions, i * 3);
           }
           
           expect(initialIndices).not.toEqual(indices);
           expect(initialPositions).not.toEqual(positionValues);
           expect(initialNormals).not.toEqual(normalValues);
           
           expect(newIndices).toEqual(indices);
           expect(packedPositions).toEqual(positionValues);
           expect(newNormals).toEqual(newNormals);
           done();
       });
    });
});
