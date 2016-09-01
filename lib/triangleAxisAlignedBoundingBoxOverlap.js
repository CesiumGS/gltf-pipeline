'use strict';

var Cesium = require('cesium');
var Cartesian3 = Cesium.Cartesian3;

module.exports = triangleAxisAlignedBoundingBoxOverlap;

var edges = [];
edges.push(new Cartesian3());
edges.push(new Cartesian3());
edges.push(new Cartesian3());

var v0 = new Cartesian3();
var v1 = new Cartesian3();
var v2 = new Cartesian3();
var triangleNormalScratch = new Cartesian3();
var halfHeightScratch = new Cartesian3();

/**
 * Function and helpers for computing the intersection between a static triangle and a static AABB.
 * Adapted from Tomas Akenine-Möller's public domain implementation: http://www.cs.lth.se/home/Tomas_Akenine_Moller/code/
 * @private
 */
function triangleAxisAlignedBoundingBoxOverlap(axisAlignedBoundingBox, triangle) {
    // Use the separating axis theorem to test overlap between triangle and box.
    // Need to test for overlap in these directions:
    // 1) the {x,y,z} directions (testing the AABB of the triangle against the box handles these)
    // 2) normal of the triangle
    // 3) cross product of edge from triangle with {x, y, z} direction. this is 3x3 = 9 tests.

    var boxCenter = axisAlignedBoundingBox.center;
    var boxHalfSize = Cartesian3.subtract(axisAlignedBoundingBox.maximum, boxCenter, halfHeightScratch);

    // Translate the triangle and box so the box is centered at the origin.
    Cartesian3.subtract(triangle[0], boxCenter, v0);
    Cartesian3.subtract(triangle[1], boxCenter, v1);
    Cartesian3.subtract(triangle[2], boxCenter, v2);

    // Compute triangle edges
    Cartesian3.subtract(v1, v0, edges[0]);
    Cartesian3.subtract(v2, v1, edges[1]);
    Cartesian3.subtract(v0, v2, edges[2]);

    // Bullet 3: Perform edge checks first for early return. Check if each is a separating axis.
    var fex = Math.abs(edges[0].x);
    var fey = Math.abs(edges[0].y);
    var fez = Math.abs(edges[0].z);
    if (axisTestX01(edges[0].z, edges[0].y, fez, fey, boxHalfSize, v0, v2)) {
        return false;
    } else if (axisTestY02(edges[0].z, edges[0].x, fez, fex, boxHalfSize, v0, v2)) {
        return false;
    } else if (axisTestZ12(edges[0].y, edges[0].x, fey, fex, boxHalfSize, v1, v2)) {
        return false;
    }

    fex = Math.abs(edges[1].x);
    fey = Math.abs(edges[1].y);
    fez = Math.abs(edges[1].z);
    if (axisTestX01(edges[1].z, edges[1].y, fez, fey, boxHalfSize, v0, v2)) {
        return false;
    } else if (axisTestY02(edges[1].z, edges[1].x, fez, fex, boxHalfSize, v0, v2)) {
        return false;
    } else if (axisTestZ0(edges[1].y, edges[1].x, fey, fex, boxHalfSize, v0, v1)) {
        return false;
    }

    fex = Math.abs(edges[2].x);
    fey = Math.abs(edges[2].y);
    fez = Math.abs(edges[2].z);
    if (axisTestX2(edges[2].z, edges[2].y, fez, fey, boxHalfSize, v0, v1)) {
        return false;
    } else if (axisTestY1(edges[2].z, edges[2].x, fez, fex, boxHalfSize, v0, v1)) {
        return false;
    } else if (axisTestZ12(edges[2].y, edges[2].x, fey, fex, boxHalfSize, v1, v2)) {
        return false;
    }

    // Bullet 1: Perform an AABB test between the triangle's minimum AABB and the box
    var triangleAABBmin = Math.min(v0.x, v1.x, v2.x);
    var triangleAABBmax = Math.max(v0.x, v1.x, v2.x);
    if (triangleAABBmin > boxHalfSize.x || triangleAABBmax < -boxHalfSize.x) {
        return false;
    }

    triangleAABBmin = Math.min(v0.y, v1.y, v2.y);
    triangleAABBmax = Math.max(v0.y, v1.y, v2.y);
    if (triangleAABBmin > boxHalfSize.y || triangleAABBmax < -boxHalfSize.y) {
        return false;
    }

    triangleAABBmin = Math.min(v0.z, v1.z, v2.z);
    triangleAABBmax = Math.max(v0.z, v1.z, v2.z);
    if (triangleAABBmin > boxHalfSize.z || triangleAABBmax < -boxHalfSize.z) {
        return false;
    }

    // Bullet 2: Test if the box intersects the plane of the triangle.
    triangleNormalScratch = Cartesian3.cross(edges[0], edges[1], triangleNormalScratch);
    return planeBoxOverlap(triangleNormalScratch, v0, boxHalfSize);
}

var vMin = new Cartesian3();
var vMax = new Cartesian3();
// Perform a fast plane/box overlap test using the separating axis theorem.
// Basically, this checks the plane normal against the two vertices whose normals which are most closely aligned with it.
function planeBoxOverlap(normal, vertex, maxBox) {
    // Pick the most closely aligned vertices, vMin and vMax
    var v = vertex.x;
    var sign = (normal.x > 0.0) ? -1.0 : 1.0;
    vMin.x = sign * maxBox.x - v;
    vMax.x = (-sign) * maxBox.x - v;

    v = vertex.y;
    sign = (normal.y > 0.0) ? -1.0 : 1.0;
    vMin.y = sign * maxBox.y - v;
    vMax.y = (-sign) * maxBox.y - v;

    v = vertex.z;
    sign = (normal.z > 0.0) ? -1.0 : 1.0;
    vMin.z = sign * maxBox.z - v;
    vMax.z = (-sign) * maxBox.z - v;

    // Project each vertex as a vector from the origin onto the plane normal
    if (Cartesian3.dot(normal, vMin) > 0.0) {
        return false;
    }
    else if (Cartesian3.dot(normal, vMax) >= 0.0) {
        return true;
    }
    return false;
}

////// X-tests //////

function axisTestX01(a, b, fa, fb, boxHalfSize, v0, v2) {
    var p0 = a * v0.y - b * v0.z;
    var p2 = a * v2.y - b * v2.z;
    var min = p2;
    var max = p0;
    if (p0 < p2) {
        min = p0;
        max = p2;
    }
    var rad = fa * boxHalfSize.y + fb * boxHalfSize.z;
    return (min > rad || max < -rad);
}

function axisTestX2(a, b, fa, fb, boxHalfSize, v0, v1) {
    var p0 = a * v0.y - b * v0.z;
    var p1 = a * v1.y - b * v1.z;
    var min = p1;
    var max = p0;
    if (p0 < p1) {
        min = p0;
        max = p1;
    }
    var rad = fa * boxHalfSize.y + fb * boxHalfSize.z;
    return (min > rad || max < -rad);
}

////// Y-tests //////

function axisTestY02(a, b, fa, fb, boxHalfSize, v0, v2) {
    var p0 = -a * v0.x + b * v0.z;
    var p2 = -a * v2.x + b * v2.z;
    var min = p2;
    var max = p0;
    if (p0 < p2) {
        min = p0;
        max = p2;
    }
    var rad = fa * boxHalfSize.x + fb * boxHalfSize.z;
    return (min > rad || max < -rad);
}

function axisTestY1(a, b, fa, fb, boxHalfSize, v0, v1) {
    var p0 = -a * v0.x + b * v0.z;
    var p1 = -a * v1.x + b * v1.z;
    var min = p1;
    var max = p0;
    if (p0 < p1) {
        min = p0;
        max = p1;
    }
    var rad = fa * boxHalfSize.x + fb * boxHalfSize.z;
    return (min > rad || max < -rad);
}

////// Z-tests //////

function axisTestZ12(a, b, fa, fb, boxHalfSize, v1, v2) {
    var p1 = a * v1.x - b * v1.y;
    var p2 = a * v2.x - b * v2.y;
    var min = p1;
    var max = p2;
    if (p2 < p1) {
        min = p2;
        max = p1;
    }
    var rad = fa * boxHalfSize.x + fb * boxHalfSize.y;
    return (min > rad || max < -rad);
}

function axisTestZ0(a, b, fa, fb, boxHalfSize, v0, v1) {
    var p0 = a * v0.x - b * v0.y;
    var p1 = a * v1.x - b * v1.y;
    var min = p1;
    var max = p0;
    if (p0 < p1) {
        min = p0;
        max = p1;
    }
    var rad = fa * boxHalfSize.x + fb * boxHalfSize.y;
    return (min > rad || max < -rad);
}
