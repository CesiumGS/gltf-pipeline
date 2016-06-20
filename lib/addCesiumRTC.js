'use strict';
var Cesium = require('cesium');
var Cartesian3 = Cesium.Cartesian3;
var Ellipsoid = Cesium.Ellipsoid;
var defined = Cesium.defined;

var addExtensionsUsed = require('./addExtensionsUsed');

module.exports = addCesiumRTC;

function addCesiumRTC(gltf, options) {
    var positionArray = [];
    var position = Cartesian3.fromRadians(options.longitude, options.latitude, options.height, Ellipsoid.WGS84);
    Cartesian3.pack(position, positionArray);
    var extensions = gltf.extensions;
    if (!defined(extensions)) {
        extensions = {};
        gltf.extensions = extensions;
    }
    extensions.CESIUM_RTC = {
        center : positionArray
    };
    addExtensionsUsed(gltf, 'CESIUM_RTC');
    var techniques = gltf.techniques;
    for (var techniqueId in techniques) {
        if (techniques.hasOwnProperty(techniqueId)) {
            var technique = techniques[techniqueId];
            var parameters = technique.parameters;
            if (defined(parameters)) {
                for (var parameterId in parameters) {
                    if (parameters.hasOwnProperty(parameterId)) {
                        if (parameterId === "modelViewMatrix") {
                            var parameter = parameters[parameterId];
                            parameter.semantic = "CESIUM_RTC_MODELVIEW";
                        }
                    }
                }
            }
        }
    }
    return gltf;
}