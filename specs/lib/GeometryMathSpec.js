'use strict';
var Cesium = require('cesium');
var CesiumMath = Cesium.Math;
var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;
var Matrix4 = Cesium.Matrix4;
var Quaternion = Cesium.Quaternion;
var GeometryMath = require('../../lib/GeometryMath');

describe('GeometryMath', function() {
    it('sums values according to barycentric weights', function() {
        var values = [
            new Cartesian3(1, 0, 0),
            new Cartesian3(0, 1, 0),
            new Cartesian3(0, 0, 1)
        ];

        var barycentric = new Cartesian3(1/3, 1/3, 1/3);
        var result = new Cartesian3();
        result = GeometryMath.sumCartesian3sBarycentric(barycentric, values[0], values[1], values[2], result);
        var expectedResult = new Cartesian3(1/3, 1/3, 1/3);
        expect(Cartesian3.equalsEpsilon(result, expectedResult, CesiumMath.EPSILON7)).toEqual(true);
    });

    it('finds the parametric coordinate of the closest point on a ray to some point off the ray', function() {
        var origin = new Cartesian3(1.0, 0.0, 0.0);
        var direction = new Cartesian3(0.0, 10.0, 0.0);
        var point = new Cartesian3(1.0, 15.0, 0.0);

        var t = GeometryMath.pointLineDistanceParametric(point, origin, direction);
        expect(CesiumMath.equalsEpsilon(t, 1.5, CesiumMath.EPSILON7)).toEqual(true);

        point.y = -5.0;

        t = GeometryMath.pointLineDistanceParametric(point, origin, direction);
        expect(CesiumMath.equalsEpsilon(t, -0.5, CesiumMath.EPSILON7)).toEqual(true);
    });

    it('flattens triangles into their own planes', function() {
        var positions = [
            new Cartesian3(0, 0, 0),
            new Cartesian3(1, 0, 0),
            new Cartesian3(1, 1, 0)
        ];

        // Transform the triangle to be unrecognizable but not scaled
        var rotation = new Quaternion(1.1, 0.2, 0.3, 2.0); // some rotation
        rotation = Quaternion.normalize(rotation, rotation);
        var translation = new Cartesian3(1.0, 2.0, 3.0);
        var scale = new Cartesian3(1.0, 1.0, 1.0);
        var transform = Matrix4.fromTranslationQuaternionRotationScale(translation, rotation, scale, new Matrix4());

        positions[0] = Matrix4.multiplyByPoint(transform, positions[0], positions[0]);
        positions[1] = Matrix4.multiplyByPoint(transform, positions[1], positions[1]);
        positions[2] = Matrix4.multiplyByPoint(transform, positions[2], positions[2]);

        var results = [
            new Cartesian2(),
            new Cartesian2(),
            new Cartesian2()
        ];
        var expected = [
            new Cartesian2(0.0, 0.0),
            new Cartesian2(1.0, 0.0),
            new Cartesian2(1.0, 1.0)
        ];

        GeometryMath.flattenTriangle(positions, results);

        expect(Cartesian2.equalsEpsilon(results[0], expected[0], CesiumMath.EPSILON7)).toEqual(true);
        expect(Cartesian2.equalsEpsilon(results[1], expected[1], CesiumMath.EPSILON7)).toEqual(true);
        expect(Cartesian2.equalsEpsilon(results[2], expected[2], CesiumMath.EPSILON7)).toEqual(true);
    });
});
