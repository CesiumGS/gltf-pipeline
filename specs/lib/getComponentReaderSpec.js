'use strict';
var Cesium = require('cesium');
var getComponentReader = require('../../lib/getComponentReader');

var ComponentDatatype = Cesium.ComponentDatatype;

function testComponentReader(componentType) {
    var typedArray = ComponentDatatype.createTypedArray(componentType, [0, 1, 2]);
    var dataView = new DataView(typedArray.buffer);
    var componentTypeByteLength = ComponentDatatype.getSizeInBytes(componentType);
    var componentReader = getComponentReader(componentType);
    var byteOffset = componentTypeByteLength;
    var numberOfComponents = 2;
    var result = new Array(numberOfComponents);
    componentReader(dataView, byteOffset, numberOfComponents, componentTypeByteLength, result);
    expect(result).toEqual([1, 2]);
}

describe('getComponentReader', function() {
    it('reads values', function() {
        testComponentReader(ComponentDatatype.BYTE);
        testComponentReader(ComponentDatatype.UNSIGNED_BYTE);
        testComponentReader(ComponentDatatype.SHORT);
        testComponentReader(ComponentDatatype.UNSIGNED_SHORT);
        testComponentReader(ComponentDatatype.INT);
        testComponentReader(ComponentDatatype.UNSIGNED_INT);
        testComponentReader(ComponentDatatype.FLOAT);
        testComponentReader(ComponentDatatype.DOUBLE);
    });
});
