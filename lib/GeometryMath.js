'use strict';
var Cesium = require('cesium');
var Cartesian3 = Cesium.Cartesian3;

module.exports = {
    sumBarycentric: sumBarycentric,
    flattenTriangle: flattenTriangle,
    pointLineDistanceParametric: pointLineDistanceParametric
};

// Functions for working with geometry like triangles and lines

var sumBarycentricScratch = new Cartesian3();
function sumBarycentric(barycentric, vector0, vector1, vector2, result) {
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
}

// Returns the parametric position on the line closest to the given point.
// Math reference: http://paulbourke.net/geometry/pointlineplane/
var pointOnLineScratch = new Cartesian3();
function pointLineDistanceParametric(point, linePosition, lineDirection) {
    var p1 = linePosition;
    var p2 = Cartesian3.add(p1, lineDirection, pointOnLineScratch);
    var p3 = point;
    var length2 = Cartesian3.magnitudeSquared(lineDirection);
    return ((p3.x - p1.x) * (p2.x - p1.x) + (p3.y - p1.y) * (p2.y - p1.y) + (p3.z - p1.z) * (p2.z - p1.z)) / length2;
}

var xAxis = new Cartesian3();
var zAxis = new Cartesian3();
var yAxis = new Cartesian3();
// Returns the point's x/y coordinates in the triangle's plane where position0 is the origin
// and position1 - position0 is the "x" axis.
function flattenTriangle(positions, results) {

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
    results[1].x = pointLineDistanceParametric(positions[1], positions[0], xAxis);
    results[1].y = pointLineDistanceParametric(positions[1], positions[0], yAxis);
    results[2].x = pointLineDistanceParametric(positions[2], positions[0], xAxis);
    results[2].y = pointLineDistanceParametric(positions[2], positions[0], yAxis);

    return results;
}
