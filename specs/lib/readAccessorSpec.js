'use strict';
var Cesium = require('cesium');
var clone = require('clone');

var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;
var Cartesian4 = Cesium.Cartesian4;
var CesiumMath = Cesium.Math;
var defined = Cesium.defined;
var WebGLConstants = Cesium.WebGLConstants;

var readAccessor = require('../../lib/readAccessor');
var readGltf = require('../../lib/readGltf');

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';

describe('readAccessor', function() {
    var boxGltf;

    beforeAll(function(done) {
        expect(readGltf(gltfPath)
            .then(function(gltf) {
                boxGltf = gltf;
            }), done).toResolve();
    });

    function testContainmentAndFit(min, max, data, type) {
        // check if the data in values is bounded by min and max precisely
        var minInValues = new Array(min.length).fill(Number.POSITIVE_INFINITY);
        var maxInValues = new Array(max.length).fill(Number.NEGATIVE_INFINITY);
        var attributeToArray;
        var scratchArray = [];

        switch(type) {
            case WebGLConstants.FLOAT:
                attributeToArray = function(value) {
                    return [value];
                };
                break;
            case WebGLConstants.FLOAT_VEC2:
                attributeToArray = function(value) {
                    Cartesian2.pack(value, scratchArray);
                    return scratchArray;
                };
                break;
            case WebGLConstants.FLOAT_VEC3:
                attributeToArray = function(value) {
                    Cartesian3.pack(value, scratchArray);
                    return scratchArray;
                };
                break;
            case WebGLConstants.FLOAT_VEC4:
                attributeToArray = function(value) {
                    Cartesian4.pack(value, scratchArray);
                    return scratchArray;
                };
                break;
        }

        for (var i = 0; i < data.length; i++) {
            var values = attributeToArray(data[i]);
            for (var j = 0; j < min.length; j++) {
                if (values[j] > max[j] || values[j] < min[j]) {
                    return false;
                }
                minInValues[j] = Math.min(minInValues[j], values[j]);
                maxInValues[j] = Math.max(maxInValues[j], values[j]);
            }
        }
        for (i = 0; i < min.length; i++) {
            if (!CesiumMath.equalsEpsilon(minInValues[i], min[i], CesiumMath.EPSILON7)) {
                return false;
            }
            if (!CesiumMath.equalsEpsilon(maxInValues[i], max[i], CesiumMath.EPSILON7)) {
                return false;
            }
        }
        return true;
    }

    it('reads all the attributes in an accessor correctly', function() {
        var testBoxGltf = clone(boxGltf);
        var accessorIDtoData = {};
        var accessorIDtoType = {};
        var accessorIDtoMinMax = {};

        var allAccessors = testBoxGltf.accessors;
        for (var accessorID in allAccessors) {
            if (allAccessors.hasOwnProperty(accessorID)) {
                var accessor = allAccessors[accessorID];
                var accessorData = [];
                var type = readAccessor(testBoxGltf, accessor, accessorData);
                accessorIDtoData[accessorID] = accessorData;
                accessorIDtoType[accessorID] = type;
                if (defined(accessor.min) && defined(accessor.max)) {
                    accessorIDtoMinMax[accessorID] = {
                        min : accessor.min,
                        max : accessor.max
                    };
                }
            }
        }

        // check if the data from accessors with min/max information fits the min/max boundary
        for (accessorID in accessorIDtoMinMax) {
            if (accessorIDtoMinMax.hasOwnProperty(accessorID)) {
                if (accessorIDtoData.hasOwnProperty(accessorID)) {
                    var minMax = accessorIDtoMinMax[accessorID];
                    expect(testContainmentAndFit(minMax.min, minMax.max, accessorIDtoData[accessorID], accessorIDtoType[accessorID])).toEqual(true);
                }
            }
        }
    });
});
