'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;

module.exports = addPipelineExtras;

//Add the pipeline extras object to each glTF object.
function addPipelineExtras(gltf) {
    var reference = {
        "accessors": { "accessorObject": { "addPipelineExtra": true } },
        "animations": {
            "animationObject": {
                "channels": [
                    { 
                        "target": { "addPipelineExtra": true },
                        "addPipelineExtra": true
                    }
                ],
                "samplers": { "samplerObject": { "addPipelineExtra": true } },
                "addPipelineExtra": true
            }
        },
        "asset": {
            "profile": { "addPipelineExtra": true },
            "addPipelineExtra": true
        },
        "buffers": { "bufferObject": { "addPipelineExtra": true } },
        "bufferViews": { "bufferViewObject": { "addPipelineExtra": true } },
        "cameras": {
            "cameraObject": {
                "orthographic": { "addPipelineExtra": true },
                "perspective": { "addPipelineExtra": true },
                "addPipelineExtra": true
            }
        },
        "images": { "imageObject": { "addPipelineExtra": true } },
        "materials": { "materialObject": { "addPipelineExtra": true } },
        "meshes": {
            "meshObject": {
                "primitives": [
                    { "addPipelineExtra": true }
                ],
                "addPipelineExtra": true
            }
        },
        "nodes": { "nodeObject": { "addPipelineExtra": true } },
        "programs": { "programObject": { "addPipelineExtra": true } },
        "samplers": { "samplerObject": { "addPipelineExtra": true } },
        "scenes": { "sceneObject": { "addPipelineExtra": true } },
        "shaders": { "shaderObject": { "addPipelineExtra": true } },
        "skins": { "skinObject": { "addPipelineExtra": true } },
        "techniques": { 
            "techniqueObject": {
                "parameters": { "parameterObject": { "addPipelineExtra": true } },
                "states": { 
                    "functions": { "addPipelineExtra": true },
                    "addPipelineExtra": true 
                },
                "addPipelineExtra": true
            }
        },
        "textures": { "textureObject": { "addPipelineExtra": true } },
        "addPipelineExtra": true
    };

    addPipelineExtra(gltf, reference);

    return gltf;
}

function addPipelineExtra(object, reference) {
    if (object === null || typeof object !== 'object') {
            return object;
    }

    if (defined(reference)) {
        if (defined(reference.addPipelineExtra)) {
            if (defined(object.extras)) {
                object.extras._pipeline = {
                    "deleteExtras": false
                };
            }
            else {
                object.extras = {
                    "_pipeline": {
                        "deleteExtras": true
                    }
                };
            }
        }

        for (var propertyId in object) {
            if (object.hasOwnProperty(propertyId) && propertyId !== 'extras') {
                var property = object[propertyId];

                if (reference.hasOwnProperty(propertyId)) {
                    addPipelineExtra(property, reference[propertyId]);
                }
                else {
                    for (var referencePropertyId in reference) {
                        if (reference.hasOwnProperty(referencePropertyId)) {
                            var referenceProperty = reference[referencePropertyId];
                            if (typeof referenceProperty === 'object') {
                                addPipelineExtra(property, referenceProperty);
                            }
                        }
                    }
                }
            }
        }
    }

    return object;
}