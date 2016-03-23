'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = removePipelineExtras;

function removePipelineExtras(gltf) {
    //Iterate through the objects within each glTF object and delete their pipeline extras object
    if (defined(gltf)) {
        for (var gltfObjectId in gltf) {
            if (gltf.hasOwnProperty(gltfObjectId)) {
                var gltfObject = gltf[gltfObjectId];
                for (var objectId in gltfObject) {
                    if (gltfObject.hasOwnProperty(objectId)) {
                        var object = gltfObject[objectId];
                        if (defined(object.extras)) {
                            if (defined(object.extras._pipeline)) {
                                delete object.extras._pipeline;
                            }
                            //Also delete extras if extras._pipeline is the only extras object
                            if (Object.keys(object.extras).length === 0) {
                                delete object.extras;
                            }
                        }
                    }
                }
            }
        }
    }

    return gltf;
}