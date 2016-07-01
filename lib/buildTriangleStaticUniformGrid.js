'use strict';
var Cesium = require('cesium');
var AxisAlignedBoundingBox = Cesium.AxisAlignedBoundingBox;
var Cartesian3 = Cesium.Cartesian3;
var StaticUniformGrid = require('./StaticUniformGrid');
var triangleAxisAlignedBoundingBoxOverlap = require('./triangleAxisAlignedBoundingBoxOverlap');

module.exports = buildTriangleStaticUniformGrid;

/**
 * Function for generating a uniform grid from a list of triangles of form [Cartesian3, Cartesian3, Cartesian3]
 *
 * @param {List[Cartesian3, Cartesian3, Cartesian3]} [data] Triangle data to bin.
 * @param {Number} [cellWidth] The width of each cell in the uniform grid.
 *
 * @returns a StaticUniformGrid storing triangles.
 */

function buildTriangleStaticUniformGrid(data, cellWidth) {
    return new StaticUniformGrid(data, cellWidth, triangleAABB, triangleCellCheck);
}

function triangleAABB(triangle, min, max) {
    min.x = Math.min(triangle[0].x, min.x);
    min.y = Math.min(triangle[0].y, min.y);
    min.z = Math.min(triangle[0].z, min.z);
    max.x = Math.max(triangle[0].x, max.x);
    max.y = Math.max(triangle[0].y, max.y);
    max.z = Math.max(triangle[0].z, max.z);

    min.x = Math.min(triangle[1].x, min.x);
    min.y = Math.min(triangle[1].y, min.y);
    min.z = Math.min(triangle[1].z, min.z);
    max.x = Math.max(triangle[1].x, max.x);
    max.y = Math.max(triangle[1].y, max.y);
    max.z = Math.max(triangle[1].z, max.z);

    min.x = Math.min(triangle[2].x, min.x);
    min.y = Math.min(triangle[2].y, min.y);
    min.z = Math.min(triangle[2].z, min.z);
    max.x = Math.max(triangle[2].x, max.x);
    max.y = Math.max(triangle[2].y, max.y);
    max.z = Math.max(triangle[2].z, max.z);
}

var triangleCheckScratch = new Cartesian3();
var halfDimensionsScratch = new Cartesian3();
var aabbScratch = new AxisAlignedBoundingBox();
function triangleCellCheck(triangle, cellMin, cellWidth) {
    var halfWidth = cellWidth / 2.0;
    var center = aabbScratch.center;
    var maximum = aabbScratch.maximum;

    halfDimensionsScratch.x = halfWidth;
    halfDimensionsScratch.y = halfWidth;
    halfDimensionsScratch.z = halfWidth;

    triangleCheckScratch.x = cellMin.x + halfWidth;
    triangleCheckScratch.y = cellMin.y + halfWidth;
    triangleCheckScratch.z = cellMin.z + halfWidth;

    aabbScratch.minimum = cellMin;
    center.x = cellMin.x + cellWidth;
    center.y = cellMin.y + cellWidth;
    center.z = cellMin.z + cellWidth;
    maximum.x = center.x + cellWidth;
    maximum.y = center.y + cellWidth;
    maximum.z = center.z + cellWidth;

    return triangleAxisAlignedBoundingBoxOverlap(aabbScratch, triangle);
}
