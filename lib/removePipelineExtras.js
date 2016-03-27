'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = removePipelineExtras;

function removePipelineExtras(object) {
    if (object === null || typeof object !== 'object') {
            return object;
    }

    //Iterate through the objects within each glTF object and delete their pipeline extras object
    if (defined(object)) {
        for (var propertyId in object) {
            if (object.hasOwnProperty(propertyId)) {
                var property = object[propertyId];
                if (defined(property) && defined(property.extras)) {
                    if (defined(property.extras._pipeline)) {
                        var deleteExtras = property.extras._pipeline.deleteExtras;
                        delete property.extras._pipeline;
                        //Also delete extras if extras._pipeline is the only extras object
                        if (deleteExtras && Object.keys(property.extras).length === 0) {
                            delete property.extras;
                        }
                    }
                }
                //Recursively check subproperties for extras
                removePipelineExtras(property);
            }
        }
    }

    return object;
}