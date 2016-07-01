'use strict';
var Cesium = require('cesium');
var Cartesian3 = Cesium.Cartesian3;
var CesiumMath = Cesium.Math;
var buildTriangleStaticUniformGrid = require('../../lib/buildTriangleStaticUniformGrid');

describe('buildTriangleStaticUniformGrid', function() {

    var manyTriangles = [];

    for (var z = 0; z < 5; z++) {
        for (var y = 0; y < 5; y++) {
            for (var x = 0; x < 5; x++) {
                manyTriangles.push([
                    new Cartesian3(x, y, z),
                    new Cartesian3(x, y, z + 0.5),
                    new Cartesian3(x, y + 0.5, z)
                ]);
            }
        }
    }

    var cartesian3Scratch = new Cartesian3();

    it('builds a grid containing triangles, which are lists of Cartesian3s', function() {
        var grid = buildTriangleStaticUniformGrid(manyTriangles, 1.0);

        expect(grid.resolution.x).toEqual(5);
        expect(grid.resolution.y).toEqual(5);
        expect(grid.resolution.z).toEqual(5);

        var expectedMin = cartesian3Scratch;
        expectedMin.x = -0.5;
        expectedMin.y = -0.25;
        expectedMin.z = -0.25;
        expect(Cartesian3.equalsEpsilon(expectedMin, grid.AABB.minimum, CesiumMath.EPSILON7)).toEqual(true);

        var expectedMax = cartesian3Scratch;
        expectedMax.x = 4.5;
        expectedMax.y = 4.75;
        expectedMax.z = 4.75;
        expect(Cartesian3.equalsEpsilon(expectedMax, grid.AABB.maximum, CesiumMath.EPSILON7)).toEqual(true);

        var cellIndices = grid.cellIndices;
        var cellCounts = grid.cellCounts;
        var triangleData = grid.data;
        var cellCount = 125;
        for (var i = 0; i < cellCount; i++) {
            expect(cellIndices[i]).toEqual(i);
            expect(cellCounts[i]).toEqual(1);
            expect(triangleData[i]).toEqual(manyTriangles[i]);
        }
    });

    it('bins trangles that span cells in more than one cell', function() {
        var corner0 = new Cartesian3(0.0, 0.0, 0.0);
        var corner1 = new Cartesian3(0.0, 9.0, 0.0);
        var corner2 = new Cartesian3(9.0, 9.0, 0.0);
        var corner3 = new Cartesian3(9.0, 0.0, 0.0);
        var triangleData = [
            [corner0, corner1, corner2],
            [corner0, corner2, corner3]
        ];
        var grid = buildTriangleStaticUniformGrid(triangleData, 1.0);

        expect(grid.resolution.x).toEqual(10);
        expect(grid.resolution.y).toEqual(10);
        expect(grid.resolution.z).toEqual(1);

        var expectedMin = cartesian3Scratch;
        expectedMin.x = -0.5;
        expectedMin.y = -0.5;
        expectedMin.z = -0.5;
        expect(Cartesian3.equalsEpsilon(expectedMin, grid.AABB.minimum, CesiumMath.EPSILON7)).toEqual(true);

        var expectedMax = cartesian3Scratch;
        expectedMax.x = 9.5;
        expectedMax.y = 9.5;
        expectedMax.z = 0.5;
        expect(Cartesian3.equalsEpsilon(expectedMax, grid.AABB.maximum, CesiumMath.EPSILON7)).toEqual(true);

        var cellCounts = grid.cellCounts;
        var cellCount = 100;
        for (var i = 0; i < cellCount; i++) {
            expect(cellCounts[i] === 1 || cellCounts[i] === 2).toEqual(true);
        }
    });
});
