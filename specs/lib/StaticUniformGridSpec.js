'use strict';
var Cesium = require('cesium');
var Cartesian3 = Cesium.Cartesian3;
var CesiumMath = Cesium.Math;
var StaticUniformGrid = require('../../lib/StaticUniformGrid');

describe('StaticUniformGrid', function() {
    function pointDataAABBFunction(point, min, max) {
        min.x = Math.min(min.x, point[0]);
        min.y = Math.min(min.y, point[1]);
        min.z = Math.min(min.z, point[2]);
        max.x = Math.max(max.x, point[0]);
        max.y = Math.max(max.y, point[1]);
        max.z = Math.max(max.z, point[2]);
    }

    function pointDataCellCheckFunction(point, position, stepWidth) {
        return (
            point[0] >= position.x &&
            point[1] >= position.y &&
            point[2] >= position.z &&
            point[0] <= position.x + stepWidth &&
            point[1] <= position.y + stepWidth &&
            point[2] <= position.z + stepWidth
        );
    }

    function listPointNeighbors(point, parameters) {
        var position = parameters.position;
        var dx = point[0] - position[0];
        var dy = point[1] - position[1];
        var dz = point[2] - position[2];
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < parameters.distance) {
            parameters.neighbors.push(point);
        }
    }

    function width5IndexSort(a, b) {
        return a[0] + a[1] * 5 + a[2] * 25 < b[0] + b[1] * 5 + b[2] * 25;
    }

    function naiveNeighborSearch(pointData, position, distance) {
        var naiveNeighbors = [];
        // perform a naive neighbor search
        var pointsCount = pointData.length;
        for (var i = 0; i < pointsCount; i++) {
            var point = pointData[i];
            var dx = position[0] - point[0];
            var dy = position[1] - point[1];
            var dz = position[2] - point[2];
            if (Math.sqrt(dx * dx + dy * dy + dz * dz) < distance) {
                naiveNeighbors.push(point);
            }
        }
        return naiveNeighbors;
    }

    var cartesian3Scratch = new Cartesian3();

    it('populates a uniform grid with cells based on the center of the data AABB and the resolution', function() {
        var pointData = [
            [1,1,1], // cell 0
            [2,2,2], // cell 0
            [5,1,1], // cell 1
            [1,5,1], // cell 3 (first in y = 1)
            [7,17,87] // last cell
        ];

        var grid = new StaticUniformGrid(pointData, 3.0, pointDataAABBFunction, pointDataCellCheckFunction);
        expect(grid.cellWidth).toEqual(3.0);

        var expectedCenter = cartesian3Scratch;
        expectedCenter.x = 4.0;
        expectedCenter.y = 9.0;
        expectedCenter.z = 44.0;
        expect(Cartesian3.equalsEpsilon(expectedCenter, grid.AABB.center, CesiumMath.EPSILON7)).toEqual(true);

        expect(grid.resolution.x).toEqual(3);
        expect(grid.resolution.y).toEqual(6);
        expect(grid.resolution.z).toEqual(29);

        var expectedMin = cartesian3Scratch;
        expectedMin.x = -0.5;
        expectedMin.y = 0.0;
        expectedMin.z = 0.5;
        expect(Cartesian3.equalsEpsilon(expectedMin, grid.AABB.minimum, CesiumMath.EPSILON7)).toEqual(true);

        var expectedMax = cartesian3Scratch;
        expectedMax.x = 8.5;
        expectedMax.y = 18;
        expectedMax.z = 87.5;
        expect(Cartesian3.equalsEpsilon(expectedMax, grid.AABB.maximum, CesiumMath.EPSILON7)).toEqual(true);

        // check contents
        var cellIndices = grid.cellIndices;
        var cellCounts = grid.cellCounts;
        expect(grid.data).toEqual(pointData);

        expect(cellIndices[0]).toEqual(0);
        expect(cellCounts[0]).toEqual(2);

        expect(cellIndices[1]).toEqual(2);
        expect(cellCounts[1]).toEqual(1);

        expect(cellIndices[3]).toEqual(3);
        expect(cellCounts[3]).toEqual(1);

        expect(cellIndices[521]).toEqual(4);
        expect(cellCounts[521]).toEqual(1);

        for (var i = 4; i < 521; i++) {
            expect(cellIndices[i]).toEqual(-1);
            expect(cellCounts[i]).toEqual(0);
        }
    });

    it('runs a function on items in the neighborhood of a position', function() {
        var pointData = [];
        for (var x = 0; x < 4; x++) {
            for (var y = 0; y < 4; y++) {
                for (var z = 0; z < 4; z++) {
                    pointData.push([x, y, z]);
                }
            }
        }
        pointData.push([0.1, 0.1, 0.1]);
        pointData.push([1.5, 1.5, 1.5]);

        var grid = new StaticUniformGrid(pointData, 1.0, pointDataAABBFunction, pointDataCellCheckFunction);

        expect(grid.resolution.x).toEqual(4);
        expect(grid.resolution.y).toEqual(4);
        expect(grid.resolution.z).toEqual(4);

        var expectedMin = cartesian3Scratch;
        expectedMin.x = -0.5;
        expectedMin.y = -0.5;
        expectedMin.z = -0.5;
        expect(Cartesian3.equalsEpsilon(expectedMin, grid.AABB.minimum, CesiumMath.EPSILON7)).toEqual(true);

        var expectedMax = cartesian3Scratch;
        expectedMax.x = 3.5;
        expectedMax.y = 3.5;
        expectedMax.z = 3.5;
        expect(Cartesian3.equalsEpsilon(expectedMax, grid.AABB.maximum, CesiumMath.EPSILON7)).toEqual(true);

        var samplePosition = cartesian3Scratch;
        samplePosition.x = 1.7;
        samplePosition.y = 1.7;
        samplePosition.z = 1.7;

        var parameters = {
            position: [1.7, 1.7, 1.7],
            distance: 1.0,
            neighbors: []
        };

        StaticUniformGrid.forEachNeighbor(grid, samplePosition, listPointNeighbors, parameters);
        var fastNeighbors = parameters.neighbors;
        var naiveNeighbors = naiveNeighborSearch(pointData, parameters.position, parameters.distance);

        // sort so that if fastNeighbors and naiveNeighbors have the same contents they will be identical.
        naiveNeighbors.sort(width5IndexSort);
        fastNeighbors.sort(width5IndexSort);

        expect(fastNeighbors).toEqual(naiveNeighbors);

        // Do it at a corner
        parameters = {
            position: [-0.1, -0.1, -0.1],
            distance: 1.0,
            neighbors: []
        };

        samplePosition.x = -0.1;
        samplePosition.y = -0.1;
        samplePosition.z = -0.1;

        StaticUniformGrid.forEachNeighbor(grid, samplePosition, listPointNeighbors, parameters);
        fastNeighbors = parameters.neighbors;
        naiveNeighbors = naiveNeighborSearch(pointData, parameters.position, parameters.distance);

        // sort so that if fastNeighbors and naiveNeighbors have the same contents they will be identical.
        naiveNeighbors.sort(width5IndexSort);
        fastNeighbors.sort(width5IndexSort);

        expect(fastNeighbors).toEqual(naiveNeighbors);
    });
});
