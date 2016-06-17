'use strict';
var Cesium = require('cesium');
var CesiumMath = Cesium.Math;
var defined = Cesium.defined;
var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;
var Cartesian4 = Cesium.Cartesian4;

var fs = require('fs');
var path = require('path');
var clone = require('clone');
var loadGltfUris = require('../../lib/loadGltfUris');
var addPipelineExtras = require('../../lib/addPipelineExtras');
var readAccessor = require('../../lib/readAccessor');
var readGltf = require('../../lib/readGltf');

var gltfPath = './specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf';

describe('readAccessor', function() {
    var boxGltf;
    var options = {};

    beforeAll(function(done) {
        readGltf(gltfPath, options, function(gltf) {
            boxGltf = gltf;
            done();
        });
    });


    function testContainmentAndFit(min, max, attributes) {
        // check if the data in values is bounded by min and max precisely
        var minInValues = new Array(min.length).fill(Number.POSITIVE_INFINITY);
        var maxInValues = new Array(max.length).fill(Number.NEGATIVE_INFINITY);
        var attributeToArray;
        var scratchArray = [];

        switch(attributes.type) {
            case 'number':
                attributeToArray = function(value) {
                    return [value];
                };
                break;
            case 'Cartesian2':
                attributeToArray = function(value) {
                    Cartesian2.pack(value, scratchArray);
                    return scratchArray;
                };
                break;
            case 'Cartesian3':
                attributeToArray = function(value) {
                    Cartesian3.pack(value, scratchArray);
                    return scratchArray;
                };
                break;
            case 'Cartesian4':
                attributeToArray = function(value) {
                    Cartesian4.pack(value, scratchArray);
                    return scratchArray;
                };
                break;
        }

        var data = attributes.data;

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
        var accessorIDtoMinMax = {};

        var allAccessors = testBoxGltf.accessors;
        for (var accessorID in allAccessors) {
            if (allAccessors.hasOwnProperty(accessorID)) {
                var accessor = allAccessors[accessorID];
                accessorIDtoData[accessorID] = readAccessor(testBoxGltf, accessor);
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
                    expect(testContainmentAndFit(minMax.min, minMax.max, accessorIDtoData[accessorID])).toEqual(true);
                }
            }
        }
    });
});
