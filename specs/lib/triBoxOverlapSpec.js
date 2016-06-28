'use strict';
var Cesium = require('cesium');
var Cartesian3 = Cesium.Cartesian3;
var triBoxOverlap = require('../../lib/triBoxOverlap');

describe('triBoxOverlap', function() {
    var triangle = [
        new Cartesian3(0.0, 0.0, 0.0),
        new Cartesian3(1.0, 0.0, 0.0),
        new Cartesian3(1.0, 1.0, 0.0)
    ];

    var boxCenter = new Cartesian3();
    var halfSize = new Cartesian3();

    it('correctly detects no intersection for a completely separate triangle and box', function() {
        boxCenter.x = 2.0;
        boxCenter.y = 2.0;
        boxCenter.z = 2.0;
        halfSize.x = 0.5;
        halfSize.y = 0.5;
        halfSize.z = 0.5;

        expect(triBoxOverlap(boxCenter, halfSize, triangle)).toEqual(false);
    });

    it('correctly detects an intersection when the triangle is entirely inside the box', function() {
        boxCenter.x = 0.5;
        boxCenter.y = 0.5;
        boxCenter.z = 0.0;
        halfSize.x = 1.0;
        halfSize.y = 1.0;
        halfSize.z = 1.0;

        expect(triBoxOverlap(boxCenter, halfSize, triangle)).toEqual(true);
    });

    it('correctly detects an intersection when the box is entirely in the triangle plane', function() {
        boxCenter.x = 0.5;
        boxCenter.y = 0.5;
        boxCenter.z = 0.0;
        halfSize.x = 0.1;
        halfSize.y = 0.1;
        halfSize.z = 0.1;

        expect(triBoxOverlap(boxCenter, halfSize, triangle)).toEqual(true);
    });

    it('correctly detects an intersection when a triangle vertex is in the box', function() {
        boxCenter.x = 1.0;
        boxCenter.y = 1.0;
        boxCenter.z = 0.0;
        halfSize.x = 0.5;
        halfSize.y = 0.5;
        halfSize.z = 0.5;

        expect(triBoxOverlap(boxCenter, halfSize, triangle)).toEqual(true);
    });

    it('correctly detects an intersection when the intersection is on an edge of the triangle', function() {
        boxCenter.x = 0.0;
        boxCenter.y = 1.0;
        boxCenter.z = 0.0;
        halfSize.x = 1.1;
        halfSize.y = 1.1;
        halfSize.z = 1.1;

        expect(triBoxOverlap(boxCenter, halfSize, triangle)).toEqual(true);
    });
});