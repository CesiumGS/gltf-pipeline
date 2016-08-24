'use strict';
var Cesium = require('cesium');

var Cartesian3 = Cesium.Cartesian3;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = GeometryMath;

/**
 * Functions for working with geometry, like triangles and lines.
 * @constructor
 * @private
 */
function GeometryMath() {}

var sumBarycentricScratch = new Cartesian3();
/**
 * Sums three Cartesian3s according to barycentric weights.
 *
 * @param {Cartesian3} barycentric Containing the barycentric weights to use when summing.
 * @param {Cartesian3} vector0 Containing the values to be multiplied by barycentric.x
 * @param {Cartesian3} vector1 Containing the values to be multiplied by barycentric.y
 * @param {Cartesian3} vector2 Containing the values to be multiplied by barycentric.z
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter.
 */
GeometryMath.sumCartesian3sBarycentric = function(barycentric, vector0, vector1, vector2, result) {
    if (!defined(barycentric)) {
        throw new DeveloperError('barycentric is required');
    }
    if (!defined(vector0)) {
        throw new DeveloperError('vector0 is required');
    }
    if (!defined(vector1)) {
        throw new DeveloperError('vector1 is required');
    }
    if (!defined(vector2)) {
        throw new DeveloperError('vector2 is required');
    }
    if (!defined(result)) {
        throw new DeveloperError('result is required');
    }

    result.x = 0.0;
    result.y = 0.0;
    result.z = 0.0;
    Cartesian3.multiplyByScalar(vector0, barycentric.x, sumBarycentricScratch);
    Cartesian3.add(result, sumBarycentricScratch, result);
    Cartesian3.multiplyByScalar(vector1, barycentric.y, sumBarycentricScratch);
    Cartesian3.add(result, sumBarycentricScratch, result);
    Cartesian3.multiplyByScalar(vector2, barycentric.z, sumBarycentricScratch);
    Cartesian3.add(result, sumBarycentricScratch, result);
    return result;
};

var pointOnLineScratch = new Cartesian3();
/**
 * Returns the parametric position on the line closest to the given point.
 * Math reference: http://paulbourke.net/geometry/pointlineplane/
 *
 * @param {Cartesian3} point Some point in 3D cartesian space.
 * @param {Cartesian3} linePosition "Starting" position of the line.
 * @param {Cartesian3} lineDirection A direction specifying the line's orientation.
 * @returns {Number} The parametric position on the line closest to the given point.
 */
GeometryMath.pointLineDistanceParametric = function(point, linePosition, lineDirection) {
    if (!defined(point)) {
        throw new DeveloperError('point is required');
    }
    if (!defined(linePosition)) {
        throw new DeveloperError('linePosition is required');
    }
    if (!defined(lineDirection)) {
        throw new DeveloperError('lineDirection is required');
    }

    var p1 = linePosition;
    var p2 = Cartesian3.add(p1, lineDirection, pointOnLineScratch);
    var p3 = point;
    var length2 = Cartesian3.magnitudeSquared(lineDirection);
    return ((p3.x - p1.x) * (p2.x - p1.x) + (p3.y - p1.y) * (p2.y - p1.y) + (p3.z - p1.z) * (p2.z - p1.z)) / length2;
};

var xAxis = new Cartesian3();
var zAxis = new Cartesian3();
var yAxis = new Cartesian3();
/**
 * Flattens the triangle into its own plane and returns the 2D coordinates of each vertex.
 * position[0] is the origin and position[1] - position[0] is the "x" axis.
 * @param {Cartesian3[]} positions The triangle's vertex positions.
 * @param {Cartesian2[]} results The objects onto which to store the results.
 * @returns {Cartesian2[]} The triangle's vertex positions in its own plane.
 */
GeometryMath.flattenTriangle = function(positions, results) {
    if (!defined(positions)) {
        throw new DeveloperError('positions is required');
    }
    if (!defined(results)) {
        throw new DeveloperError('results is required');
    }

    // Compute x, y, z axes. Z is considered to be the plane normal.
    xAxis = Cartesian3.subtract(positions[1], positions[0], xAxis);
    yAxis = Cartesian3.subtract(positions[2], positions[0], yAxis);
    xAxis = Cartesian3.normalize(xAxis, xAxis);
    yAxis = Cartesian3.normalize(yAxis, yAxis);
    zAxis = Cartesian3.cross(xAxis, yAxis, zAxis);
    zAxis = Cartesian3.normalize(zAxis, zAxis);
    yAxis = Cartesian3.cross(zAxis, xAxis, yAxis);
    yAxis = Cartesian3.normalize(yAxis, yAxis);

    // Compute x/y coordinates by getting distance to normalized x and y axes in 3D
    results[0].x = 0.0;
    results[0].y = 0.0;
    results[1].x = GeometryMath.pointLineDistanceParametric(positions[1], positions[0], xAxis);
    results[1].y = GeometryMath.pointLineDistanceParametric(positions[1], positions[0], yAxis);
    results[2].x = GeometryMath.pointLineDistanceParametric(positions[2], positions[0], xAxis);
    results[2].y = GeometryMath.pointLineDistanceParametric(positions[2], positions[0], yAxis);

    return results;
};
