'use strict';

var path = require('path');
var requirejs = require('requirejs');

var expectPromise = require('./expectPromise');

//Since Jasmine matchers are shared between client and server code
//We need to use requirejs to bring them into node.
requirejs.config({
    baseUrl: path.join(__dirname, '../..'),
    paths: {
        'Cesium': 'node_modules/cesium/source'
    },
    nodeRequire: require
});

var customizeJasmine = requirejs('./specs/matchers/customizeJasmine');

var env = jasmine.getEnv();
customizeJasmine(env);

var oldExpect = global.expect;
global.expect = function (promise, done) {
    //We can't use instanceof Promise here because promise
    //may not be a bluebird-defined Promise
    if (promise && promise.then && done) {
        return expectPromise(promise, done);
    }

    //If it wasn't a promise, call original implementation
    return oldExpect.apply(global, arguments);
};
