'use strict';
var Cesium = require('cesium');
var AxisAlignedBoundingBox = Cesium.AxisAlignedBoundingBox;
var Cartesian3 = Cesium.Cartesian3;
var triangleAxisAlignedBoundingBoxOverlap = require('../../lib/triangleAxisAlignedBoundingBoxOverlap');

describe('triangleAxisAlignedBoundingBoxOverlap', function() {
    var triangle = [
        new Cartesian3(0.0, 0.0, 0.0),
        new Cartesian3(1.0, 0.0, 0.0),
        new Cartesian3(1.0, 1.0, 0.0)
    ];

    var boxCenter = new Cartesian3();
    var halfSize = new Cartesian3();

    var boundingBoxScratch = new AxisAlignedBoundingBox();
    function makeAxisAlignedBoundingBox(center, halfSize) {
        boundingBoxScratch.center = center;
        boundingBoxScratch.maximum = Cartesian3.add(center, halfSize, boundingBoxScratch.maximum);
        boundingBoxScratch.minimum = Cartesian3.subtract(center, halfSize, boundingBoxScratch.minimum);
        return boundingBoxScratch;
    }

    it('correctly detects no intersection for a completely separate triangle and box', function() {
        boxCenter.x = 2.0;
        boxCenter.y = 2.0;
        boxCenter.z = 2.0;
        halfSize.x = 0.5;
        halfSize.y = 0.5;
        halfSize.z = 0.5;

        var boundingBox = makeAxisAlignedBoundingBox(boxCenter, halfSize);

        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, triangle)).toEqual(false);
    });

    it('correctly detects an intersection when the triangle is entirely inside the box', function() {
        boxCenter.x = 0.5;
        boxCenter.y = 0.5;
        boxCenter.z = 0.0;
        halfSize.x = 1.0;
        halfSize.y = 1.0;
        halfSize.z = 1.0;

        var boundingBox = makeAxisAlignedBoundingBox(boxCenter, halfSize);

        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, triangle)).toEqual(true);
    });

    it('correctly detects an intersection when the box is entirely in the triangle plane', function() {
        boxCenter.x = 0.5;
        boxCenter.y = 0.5;
        boxCenter.z = 0.0;
        halfSize.x = 0.1;
        halfSize.y = 0.1;
        halfSize.z = 0.1;

        var boundingBox = makeAxisAlignedBoundingBox(boxCenter, halfSize);

        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, triangle)).toEqual(true);
    });

    it('correctly detects an intersection when a triangle vertex is in the box', function() {
        boxCenter.x = 1.0;
        boxCenter.y = 1.0;
        boxCenter.z = 0.0;
        halfSize.x = 0.5;
        halfSize.y = 0.5;
        halfSize.z = 0.5;

        var boundingBox = makeAxisAlignedBoundingBox(boxCenter, halfSize);

        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, triangle)).toEqual(true);
    });

    it('correctly detects an intersection when the intersection is on an edge of the triangle', function() {
        boxCenter.x = 0.0;
        boxCenter.y = 1.0;
        boxCenter.z = 0.0;
        halfSize.x = 1.1;
        halfSize.y = 1.1;
        halfSize.z = 1.1;

        var boundingBox = makeAxisAlignedBoundingBox(boxCenter, halfSize);

        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, triangle)).toEqual(true);
    });
});