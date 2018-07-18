'use strict';
var Cesium = require('cesium');
var Cartesian3 = Cesium.Cartesian3;
var DeveloperError = Cesium.DeveloperError;
var Ellipsoid = Cesium.Ellipsoid;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

var addExtensionsUsed = require('./addExtensionsUsed');

module.exports = addCesiumRTC;

/**
 * Positions the model relative to a center point using the CESIUM_RTC extension.
 * Either specify options.position directly or calculate it from longitude, latitude and height
 * along with an ellipsoid (WGS84 if not specified).
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @param {Object} [options] Defines the relationship with the center position
 * @param {Cartesian3} [options.position] Places the model relative to a particular position.
 * @param {Number} [options.longitude] The longitude to map onto the ellipsoid.
 * @param {Number} [options.latitude] The latitude to map onto the ellipsoid.
 * @param {Number} [options.height] Distance from the ellipsoid's surface.
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.WGS84] The ellipsoid to use for lat-long mapping.
 */
function addCesiumRTC(gltf, options) {
    options = defaultValue(options, {});
    var positionArray = [];
    var ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);
    var position = options.position;
    if (!defined(position)) {
        if (defined(options.longitude) && defined(options.latitude) && defined(options.height)) {
            position = Cartesian3.fromRadians(options.longitude, options.latitude, options.height, ellipsoid);
        } else {
            throw new DeveloperError('Either a position or lat/long/height must be provided');
        }
    }
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
                        if (parameterId === 'modelViewMatrix') {
                            var parameter = parameters[parameterId];
                            parameter.semantic = 'CESIUM_RTC_MODELVIEW';
                        }
                    }
                }
            }
        }
    }
}
