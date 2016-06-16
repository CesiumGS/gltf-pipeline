'use strict';
var readAccessor = require('../../lib/readAccessor');
var readGltf = require('../../lib/readGltf');
var addDefaults = require('../../lib/addDefaults');
var writeGeometryToGltf = require('../../lib/writeGeometryToGltf');
var Cesium = require('cesium');
var GeometryAttribute = Cesium.GeometryAttribute;
var Geometry = Cesium.Geometry;

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';
var values = {'0': -0.5, '1': -0.5, '2': 0.5, '3': 0.5, '4': -0.5, '5': 0.5, '6': -0.5, '7': 0.5, '8': 0.5,
    '9': 0.5, '10': 0.5, '11': 0.5, '12': 0.5, '13': 0.5, '14': 0.5, '15': 0.5, '16': -0.5, '17': 0.5,
    '18': 0.5, '19': 0.5, '20': -0.5, '21': 0.5, '22': -0.5, '23': -0.5, '24': -0.5, '25': 0.5, '26': 0.5,
    '27': 0.5, '28': 0.5, '29': 0.5, '30': -0.5, '31': 0.5, '32': -0.5, '33': 0.5, '34': 0.5, '35': -0.5,
    '36': 0.5, '37': -0.5, '38': 0.5, '39': -0.5, '40': -0.5, '41': 0.5, '42': 0.5, '43': -0.5, '44': -0.5,
    '45': -0.5, '46': -0.5, '47': -0.5, '48': -0.5, '49': -0.5, '50': 0.5, '51': -0.5, '52': 0.5, '53': 0.5,
    '54': -0.5, '55': -0.5, '56': -0.5, '57': -0.5, '58': 0.5, '59': -0.5, '60': -0.5, '61': -0.5, '62': -0.5,
    '63': -0.5, '64': 0.5, '65': -0.5, '66': 0.5, '67': -0.5, '68': -0.5, '69': 0.5, '70': 0.5, '71': -0.5 };
var indices = [2, 0, 1, 1, 3, 2, 4, 5, 6, 7, 6, 5, 8, 9, 10, 11, 10, 9, 12, 
    13, 14, 15, 14, 13, 16, 17, 18, 19, 18, 17, 20, 21, 22, 23, 22, 21 ];
var position = new GeometryAttribute({
    'componentDatatype' : 5126,
    'componentsPerAttribute' : 3,
    'values' : values
});
var geometry = new Geometry({
    'attributes' : {
        'position' : position
    },
    'indices' : new Uint16Array(indices),
    'primitiveType' : 4
});



describe('writeGeometryToGltfSpec', function() {
   it('writes geometry data to a glTF', function(done) {
       readGltf(gltfPath, function(gltf) {
           addDefaults(gltf);
           var primitive = gltf.meshes[Object.keys(gltf.meshes)[0]].primitives[0];
           var accessor = gltf.accessors[primitive.indices];
           
           var initialIndices = readAccessor(gltf, accessor).data;
           writeGeometryToGltf(gltf, primitive, geometry);
           var writtenIndices = readAccessor(gltf, accessor).data;
           
           expect(initialIndices).not.toEqual(indices);
           expect(writtenIndices).toEqual(indices);
           done();
       });
    });
});