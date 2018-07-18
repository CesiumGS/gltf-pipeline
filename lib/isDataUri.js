'use strict';
var Cesium = require('cesium');

var defined = Cesium.defined;

module.exports = isDataUri;

/**
 * @private
 */
 function isDataUri(uri) {
    //Return false if the uri is undefined
    if (!defined(uri)) {
        return false;
    }

    //Return true if the uri is a data uri
    return /^data\:/i.test(uri);
 }
