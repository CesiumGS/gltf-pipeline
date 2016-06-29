'use strict';
var Cesium = require('cesium');
var AxisAlignedBoundingBox = Cesium.AxisAlignedBoundingBox;
var Cartesian3 = Cesium.Cartesian3;
var CesiumMath = Cesium.Math;
var Matrix4 = Cesium.Matrix4;
var Quaternion = Cesium.Quaternion;
var triangleAxisAlignedBoundingBoxOverlap = require('../../lib/triangleAxisAlignedBoundingBoxOverlap');

describe('triangleAxisAlignedBoundingBoxOverlap', function() {
    var zPlaneTriangle = [
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

    var translationScratch = new Cartesian3();
    var rotationScratch = new Quaternion();
    var axisScratch = new Cartesian3();
    var scaleScratch = new Cartesian3();
    var triangleScratch = [
        new Cartesian3(),
        new Cartesian3(),
        new Cartesian3()
    ];
    var transformationScratch = new Matrix4();
    function translateTriangle(triangle, x, y, z, triangleScratch) {
        translationScratch.x = x;
        translationScratch.y = y;
        translationScratch.z = z;
        triangleScratch[0] = Cartesian3.add(triangle[0], translationScratch, triangleScratch[0]);
        triangleScratch[1] = Cartesian3.add(triangle[1], translationScratch, triangleScratch[1]);
        triangleScratch[2] = Cartesian3.add(triangle[2], translationScratch, triangleScratch[2]);
        return triangleScratch;
    }

    function rotateTriangle(triangle, x, y, z, rotationAngle, triangleScratch) {
        axisScratch.x = x;
        axisScratch.y = y;
        axisScratch.z = z;
        axisScratch = Cartesian3.normalize(axisScratch, axisScratch);
        rotationScratch = Quaternion.fromAxisAngle(axisScratch, rotationAngle, rotationScratch);
        scaleScratch.x = 1.0;
        scaleScratch.y = 1.0;
        scaleScratch.z = 1.0;
        transformationScratch = Matrix4.fromTranslationQuaternionRotationScale(Cartesian3.ZERO, rotationScratch, scaleScratch, transformationScratch);

        triangleScratch[0] = Matrix4.multiplyByPoint(transformationScratch, triangle[0], triangleScratch[0]);
        triangleScratch[1] = Matrix4.multiplyByPoint(transformationScratch, triangle[1], triangleScratch[1]);
        triangleScratch[2] = Matrix4.multiplyByPoint(transformationScratch, triangle[2], triangleScratch[2]);
        return triangleScratch;
    }

    it('correctly detects an intersection when the triangle is entirely inside the box', function() {
        boxCenter.x = 0.5;
        boxCenter.y = 0.5;
        boxCenter.z = 0.0;
        halfSize.x = 2.0;
        halfSize.y = 2.0;
        halfSize.z = 2.0;

        var boundingBox = makeAxisAlignedBoundingBox(boxCenter, halfSize);

        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, zPlaneTriangle)).toEqual(true);
    });

    it('correctly detects an intersection when the box is entirely in the triangle plane', function() {
        boxCenter.x = 0.5;
        boxCenter.y = 0.5;
        boxCenter.z = 0.0;
        halfSize.x = 0.1;
        halfSize.y = 0.1;
        halfSize.z = 0.1;

        var boundingBox = makeAxisAlignedBoundingBox(boxCenter, halfSize);

        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, zPlaneTriangle)).toEqual(true);
    });

    it('correctly detects an intersection when any triangle vertex is in the box', function() {
        halfSize.x = 0.5;
        halfSize.y = 0.5;
        halfSize.z = 0.5;

        boxCenter.x = 1.0;
        boxCenter.y = 1.0;
        boxCenter.z = 0.0;

        var boundingBox1 = makeAxisAlignedBoundingBox(boxCenter, halfSize);
        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox1, zPlaneTriangle)).toEqual(true);

        boxCenter.x = 1.0;
        boxCenter.y = 0.0;
        boxCenter.z = 0.0;

        var boundingBox2 = makeAxisAlignedBoundingBox(boxCenter, halfSize);
        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox2, zPlaneTriangle)).toEqual(true);

        boxCenter.x = 0.0;
        boxCenter.y = 0.0;
        boxCenter.z = 0.0;

        var boundingBox3 = makeAxisAlignedBoundingBox(boxCenter, halfSize);
        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox3, zPlaneTriangle)).toEqual(true);
    });

    it('correctly detects an intersection when the intersection is on any edge of the triangle', function() {
        halfSize.x = 0.51;
        halfSize.y = 0.51;
        halfSize.z = 0.51;

        boxCenter.x = 0.25;
        boxCenter.y = 0.75;
        boxCenter.z = 0.0;

        var boundingBox1 = makeAxisAlignedBoundingBox(boxCenter, halfSize);
        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox1, zPlaneTriangle)).toEqual(true);

        boxCenter.x = 0.5;
        boxCenter.y = 0.0;
        boxCenter.z = 0.0;

        var boundingBox2 = makeAxisAlignedBoundingBox(boxCenter, halfSize);
        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox2, zPlaneTriangle)).toEqual(true);

        boxCenter.x = 1.0;
        boxCenter.y = 0.5;
        boxCenter.z = 0.0;

        var boundingBox3 = makeAxisAlignedBoundingBox(boxCenter, halfSize);
        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox3, zPlaneTriangle)).toEqual(true);
    });

    it('correctly detects no intersection for a completely separate triangle and box', function() {
        boxCenter.x = 2.0;
        boxCenter.y = 2.0;
        boxCenter.z = 2.0;

        // Cube
        halfSize.x = 0.5;
        halfSize.y = 0.5;
        halfSize.z = 0.5;
        var boundingBox1 = makeAxisAlignedBoundingBox(boxCenter, halfSize);
        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox1, zPlaneTriangle)).toEqual(false);

        // Arbitrary box
        halfSize.x = 0.3;
        halfSize.y = 0.6;
        halfSize.z = 0.9;
        var boundingBox2 = makeAxisAlignedBoundingBox(boxCenter, halfSize);
        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox2, zPlaneTriangle)).toEqual(false);
    });

    it('correctly detects no intersection in each of the 26 voxels around a cube', function() {
        halfSize.x = 0.5;
        halfSize.y = 0.5;
        halfSize.z = 0.5;

        var boundingBox = makeAxisAlignedBoundingBox(Cartesian3.ZERO, halfSize);
        var triangle = triangleScratch;

        for (var x = -1; x < 2; x++) {
            for (var y = -1; y < 2; y++) {
                for (var z = -1; z < 2; z++) {
                    if (x !== 0 || y !== 0 || z !== 0) {
                        triangle = rotateTriangle(zPlaneTriangle, x, y, z, x + y + z, triangle);
                        triangle = translateTriangle(triangle, x * 2, y * 2, z * 2, triangle);
                        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, triangle)).toEqual(false);
                    }
                }
            }
        }
    });

    it('correctly detects intersections with triangles at various orientations', function() {
        var triangle = triangleScratch;

        halfSize.x = 0.5;
        halfSize.y = 0.5;
        halfSize.z = 0.5;
        var boundingBox = makeAxisAlignedBoundingBox(Cartesian3.ZERO, halfSize);

        // Axis aligned orientations
        // in Z plane
        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, zPlaneTriangle)).toEqual(true);
        // in X plane
        Cartesian3.fromArray([0, 0, 0], 0, triangle[0]);
        Cartesian3.fromArray([0, 1, 0], 0, triangle[1]);
        Cartesian3.fromArray([0, 1, 1], 0, triangle[2]);
        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, triangle)).toEqual(true);
        // in Y plane
        Cartesian3.fromArray([0, 0, 0], 0, triangle[0]);
        Cartesian3.fromArray([1, 0, 0], 0, triangle[1]);
        Cartesian3.fromArray([1, 0, 1], 0, triangle[2]);
        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, triangle)).toEqual(true);

        // Varying orientations
        for (var x = 0; x < 360; x += 30) {
            for (var y = 0; y < 360; y += 30) {
                for (var z = 0; z < 360; z += 30) {
                    triangle = zPlaneTriangle;
                    triangle = rotateTriangle(triangle, 1, 0, 0, x, triangleScratch);
                    triangle = rotateTriangle(triangle, 0, 1, 0, y, triangleScratch);
                    triangle = rotateTriangle(triangle, 0, 0, 1, z, triangleScratch);
                    expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, triangle)).toEqual(true);
                }
            }
        }

        halfSize.x = 0.3;
        halfSize.y = 0.6;
        halfSize.z = 0.9;
        boundingBox = makeAxisAlignedBoundingBox(Cartesian3.ZERO, halfSize);

        // Axis aligned orientations
        // in Z plane
        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, zPlaneTriangle)).toEqual(true);
        // in X plane
        Cartesian3.fromArray([0, 0, 0], 0, triangle[0]);
        Cartesian3.fromArray([0, 1, 0], 0, triangle[1]);
        Cartesian3.fromArray([0, 1, 1], 0, triangle[2]);
        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, triangle)).toEqual(true);
        // in Y plane
        Cartesian3.fromArray([0, 0, 0], 0, triangle[0]);
        Cartesian3.fromArray([1, 0, 0], 0, triangle[1]);
        Cartesian3.fromArray([1, 0, 1], 0, triangle[2]);
        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, triangle)).toEqual(true);

        // Varying orientations
        for (x = 0; x < 360; x += 30) {
            for (y = 0; y < 360; y += 30) {
                for (z = 0; z < 360; z += 30) {
                    triangle = zPlaneTriangle;
                    triangle = rotateTriangle(triangle, 1, 0, 0, x, triangleScratch);
                    triangle = rotateTriangle(triangle, 0, 1, 0, y, triangleScratch);
                    triangle = rotateTriangle(triangle, 0, 0, 1, z, triangleScratch);
                    expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, triangle)).toEqual(true);
                }
            }
        }
    });

    it ('detects lack of intersection at various orientations', function() {
        var triangle = triangleScratch;

        halfSize.x = 0.5;
        halfSize.y = 0.5;
        halfSize.z = 0.5;
        var boundingBox = makeAxisAlignedBoundingBox(Cartesian3.ZERO, halfSize);
        // Varying orientations
        for (var x = 0; x < 360; x += 30) {
            for (var y = 0; y < 360; y += 30) {
                for (var z = 0; z < 360; z += 30) {
                    triangle = zPlaneTriangle;
                    triangle = rotateTriangle(triangle, 1, 0, 0, x, triangleScratch);
                    triangle = rotateTriangle(triangle, 0, 1, 0, y, triangleScratch);
                    triangle = rotateTriangle(triangle, 0, 0, 1, z, triangleScratch);

                    var signX = x < 180 ? -1 : 1;
                    var signY = y < 180 ? -1 : 1;
                    var signZ = z < 180 ? -1 : 1;

                    triangle = translateTriangle(triangle, 2.0 * signX, 2.0 * signY, 2.0 * signZ, triangleScratch);
                    expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, triangle)).toEqual(false);
                }
            }
        }
    });

    it ('detects intersections of triangles in the same plane as AABB faces', function() {
        var triangle = triangleScratch;

        var radius = 0.5;
        halfSize.x = radius;
        halfSize.y = radius;
        halfSize.z = radius;
        var boundingBox = makeAxisAlignedBoundingBox(Cartesian3.ZERO, halfSize);

        // in X plane
        Cartesian3.fromArray([-radius, 0, 0], 0, triangle[0]);
        Cartesian3.fromArray([-radius, 1, 0], 0, triangle[1]);
        Cartesian3.fromArray([-radius, 1, 1], 0, triangle[2]);
        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, triangle)).toEqual(true);

        Cartesian3.fromArray([radius, 0, 0], 0, triangle[0]);
        Cartesian3.fromArray([radius, 1, 0], 0, triangle[1]);
        Cartesian3.fromArray([radius, 1, 1], 0, triangle[2]);
        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, triangle)).toEqual(true);

        // in Y plane
        Cartesian3.fromArray([0, radius, 0], 0, triangle[0]);
        Cartesian3.fromArray([1, radius, 0], 0, triangle[1]);
        Cartesian3.fromArray([1, radius, 1], 0, triangle[2]);
        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, triangle)).toEqual(true);

        Cartesian3.fromArray([0, -radius, 0], 0, triangle[0]);
        Cartesian3.fromArray([1, -radius, 0], 0, triangle[1]);
        Cartesian3.fromArray([1, -radius, 1], 0, triangle[2]);
        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, triangle)).toEqual(true);

        // in Z plane
        Cartesian3.fromArray([0, 0, radius], 0, triangle[0]);
        Cartesian3.fromArray([1, 0, radius], 0, triangle[1]);
        Cartesian3.fromArray([1, 1, radius], 0, triangle[2]);
        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, triangle)).toEqual(true);

        Cartesian3.fromArray([0, 0, -radius], 0, triangle[0]);
        Cartesian3.fromArray([1, 0, -radius], 0, triangle[1]);
        Cartesian3.fromArray([1, 1, -radius], 0, triangle[2]);
        expect(triangleAxisAlignedBoundingBoxOverlap(boundingBox, triangle)).toEqual(true);
    });
});
