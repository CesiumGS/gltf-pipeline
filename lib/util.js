"use strict";
module.exports = {
    defined : defined,
    defaultValue : defaultValue,
    normalize : normalize,
    faceNormal : faceNormal
};

function defined(value) {
    return value !== undefined;
}

function defaultValue(a, b) {
    if (a !== undefined) {
        return a;
    }
    return b;
}

var result = [0, 0, 0];

function normalize(x, y, z) {
    var magnitude = Math.sqrt(x * x + y * y + z * z);
    result[0] = x / magnitude;
    result[1] = y / magnitude;
    result[2] = z / magnitude;
    return result;
}

function faceNormal(x1, y1, z1, x2, y2, z2, x3, y3, z3) {
    var e1x = x2 - x1;
    var e1y = y2 - y1;
    var e1z = z2 - z1;
    var e2x = x3 - x1;
    var e2y = y3 - y1;
    var e2z = z3 - z1;
    result[0] = (e1y * e2z) - (e1z * e2y);
    result[1] = (e1z * e2x) - (e1x * e2z);
    result[2] = (e1x * e2y) - (e1y * e2x);
    return result;
}
