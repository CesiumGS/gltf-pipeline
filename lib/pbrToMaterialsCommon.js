'use strict';
var Cesium = require('cesium');
var ForEach = require('./ForEach');

var defined = Cesium.defined;

module.exports = pbrToMaterialsCommon;

/**
 * Convert PBR materials to use a KHR_materials_common PHONG shader.
 * This is a lossy conversion, and as such is only to be used for
 * compatibility reasons. Normal texture and metallic roughness information
 * will be lost, and some color or texture information may be lost.
 *
 * The preferred solution is to properly
 * implement PBR materials, and as such this function will likely
 * by deprecated in the future.
 *
 * @param {Object} gltf A javascript object containing a glTF asset.
 * @returns {Object} The glTF asset with materials converted to KHR_materials_common
 */
function pbrToMaterialsCommon(gltf) {
    ForEach.material(gltf, function(material) {
        var values = {
            ambient : [ 0.0, 0.0, 0.0, 1.0 ],
            diffuse : [ 0.0, 0.0, 0.0, 1.0 ],
            emission : [ 0.0, 0.0, 0.0, 1.0 ],
            specular : [ 0.0, 0.0, 0.0, 1.0],
            shininess : [ 0.0 ]
        };
        var pbrMetallicRoughness = material.pbrMetallicRoughness;
        if (defined(pbrMetallicRoughness)) {
            var baseColorFactor = pbrMetallicRoughness.baseColorFactor;
            if (defined(baseColorFactor)) {
                values.diffuse = baseColorFactor;
            }
            var baseColorTexture = pbrMetallicRoughness.baseColorTexture;
            if (defined(baseColorTexture)) {
                values.diffuse = [ baseColorTexture.index ];
            }
        }
        var extensions = material.extensions;
        if (defined(extensions)) {
            var pbrSpecularGlossiness = extensions.KHR_materials_pbrSpecularGlossiness;
            if (defined(pbrSpecularGlossiness)) {
                var diffuseFactor = pbrSpecularGlossiness.diffuseFactor;
                // Use baseColorTexture if it was defined
                if (defined(diffuseFactor) && values.diffuse.length > 1) {
                    values.diffuse = diffuseFactor;
                }
                // diffuseTexture should be used instead of baseColorTexture if defined
                var diffuseTexture = pbrSpecularGlossiness.diffuseTexture;
                if (defined(diffuseTexture)) {
                    values.diffuse = [ diffuseTexture.index ];
                }
                var specularFactor = pbrSpecularGlossiness.specularFactor;
                if (defined(specularFactor)) {
                    values.specular[0] = specularFactor[0];
                    values.specular[1] = specularFactor[1];
                    values.specular[2] = specularFactor[2];
                }
                var glossinessFactor = pbrSpecularGlossiness.glossinessFactor;
                if (defined(glossinessFactor)) {
                    values.shininess[0] = glossinessFactor;
                }
                var specularGlossinessTexture = pbrSpecularGlossiness.specularGlossinessTexture;
                if (defined(specularGlossinessTexture)) {
                    values.specular = [ specularGlossinessTexture.index ];
                }
            }
        }
        var occlusionTexture = material.occlusionTexture;
        if (defined(occlusionTexture)) {
            values.ambient = [ occlusionTexture.index ];
        }
        var emissiveFactor = material.emissiveFactor;
        if (defined(emissiveFactor)) {
            values.emission[0] = emissiveFactor[0];
            values.emission[1] = emissiveFactor[1];
            values.emission[2] = emissiveFactor[2];
        }
        delete material.emissiveFactor;
        delete material.normalTexture;
        delete material.occlusionTexture;
        delete material.pbrMetallicRoughness;
        material.extensions = {
            technique : 'PHONG',
            KHR_materials_common : {
                values: values
            }
        };
    });
}