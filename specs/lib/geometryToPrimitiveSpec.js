'use strict';
var readAccessor = require('../../lib/readAccessor');
var readGltf = require('../../lib/readGltf');
var addDefaults = require('../../lib/addDefaults');
var geometryToPrimitive = require('../../lib/geometryToPrimitive');
var Cesium = require('cesium');
var GeometryAttribute = Cesium.GeometryAttribute;
var Geometry = Cesium.Geometry;

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var values = [ -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5,
    -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5,
    0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5,
    -0.5, -0.5, -0.5, 0.5, -0.5,  0.5, -0.5, -0.5, 0.5, 0.5, -0.5 ];
var indices = [2, 0, 1, 1, 3, 2, 4, 5, 6, 7, 6, 5, 8, 9, 10, 11, 10, 9, 12, 
    13, 14, 15, 14, 13, 16, 17, 18, 19, 18, 17, 20, 21, 22, 23, 22, 21 ];
var position = new GeometryAttribute({
    componentDatatype : 5126,
    componentsPerAttribute : 3,
    values : values
});
var geometry = new Geometry({
    attributes : {
        position : position
    },
    indices : new Uint16Array(indices),
    primitiveType : 4
});

describe('geometryToPrimitive', function() {
   it('writes geometry data to a glTF', function(done) {
       readGltf(gltfPath, function(gltf) {
           addDefaults(gltf);
           var primitive = gltf.meshes[Object.keys(gltf.meshes)[0]].primitives[0];
           var accessor = gltf.accessors[primitive.indices];
           
           var initialIndices = readAccessor(gltf, accessor).data;
           geometryToPrimitive(gltf, primitive, geometry);
           var writtenIndices = readAccessor(gltf, accessor).data;
           
           expect(initialIndices).not.toEqual(indices);
           expect(writtenIndices).toEqual(indices);
           done();
       });
    });
});
