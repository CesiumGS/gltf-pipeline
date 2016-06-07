'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
module.exports = checkCombineWarning;

//Outputs a warning if there are extensions or non-pipeline extras in the object that will be lost.
function checkCombineWarning(object, objectType, objectId) {
    if (defined(object.extensions) || (defined(object.extras) && Object.keys(object.extras).length > 1)) {
        console.log('Warning: Extensions and extras for ' + objectType + ' "' + objectId + '" will be lost.');
    }
}
