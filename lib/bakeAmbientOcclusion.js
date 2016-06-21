'use strict';
var Cesium = require('cesium');
var baryCentricCoordinates = Cesium.barycentricCoordinates;
var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;
var CesiumMath = Cesium.Math;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;
var Matrix3 = Cesium.Matrix3;
var Matrix4 = Cesium.Matrix4;
var Quaternion = Cesium.Quaternion;
var Ray = Cesium.Ray;
var WebGLConstants = Cesium.WebGLConstants;
var clone = require('clone');
var Jimp = require('jimp');
var NodeHelpers = require('./NodeHelpers');
var readAccessor = require('./readAccessor');

module.exports = {
    bakeAmbientOcclusion: bakeAmbientOcclusion,
    generateRaytracerScene: generateRaytracerScene,
    computeAmbientOcclusionAt: computeAmbientOcclusionAt
};

var scratchRay = new Ray();
var cartesian3Scratch1 = new Cartesian3();
var cartesian3Scratch2 = new Cartesian3();
var cartesian3Scratch3 = new Cartesian3();
var cartesian3Scratch4 = new Cartesian3();
var cartesian2Scratch = new Cartesian2();
var quaternionScratch = new Quaternion();
var matrix3Scratch = new Matrix3();

function bakeAmbientOcclusion(gltf, options) {
    // Requires each mesh to occur only once in the scene
    var sceneID = defaultValue(options.scene, gltf.scene);
    if (!defined(sceneID)) {
        sceneID = Object.keys(gltf.scenes)[0];
    }
    var scene = gltf.scenes[sceneID];

    // Generate triangle soup
    var raytracerScene = generateRaytracerScene(gltf, scene, options);

    // Raytrace to a new texture for each primitive
    var parameters = {
        raytracerScene: raytracerScene,
        resolution: options.resolution
    };
    NodeHelpers.forEachPrimitiveInScene(gltf, scene, raytracePrimitiveTexels, parameters);

    // Add to the gltf
    bakeToDiffuse(gltf, scene, options.resolution, raytracerScene);
}

////////// adding to the gltf //////////

function bakeToDiffuse(gltf, scene, resolution, raytracerScene) {
    // find material with a diffuse texture parameter to clone as needed
    var materials = gltf.materials;
    var textures = gltf.textures;

    var exampleMaterialID;
    var exampleTextureID;
    var exampleImageID;

    for (var materialID in materials) {
        if (materials.hasOwnProperty(materialID)) {
            var material = materials[materialID];
            if (defined(material.values) && defined(material.values.diffuse)) {
                if (typeof material.values.diffuse === 'string') {
                    exampleMaterialID = materialID;
                    exampleTextureID = material.values.diffuse;
                    exampleImageID = textures[exampleTextureID].source;
                    break;
                }
            }
        }
    }

    if (!defined(exampleMaterialID)) {
        throw new DeveloperError('In stage bakeAmbientOcclusion: could not find any materials with a diffuse texture.');
    }

    // Build a hash of materials, textures, and images we've seen so far to ensure uniqueness
    var parameters = {
        materialsSeen: {},
        texturesSeen: {},
        imagesSeen: {},
        exampleMaterialID: exampleMaterialID,
        exampleTextureID: exampleTextureID,
        exampleImageID: exampleImageID,
        resolution: resolution,
        gltf: gltf,
        raytracerScene: raytracerScene
    };

    // Bake AO for each primitive in the scene
    NodeHelpers.forEachPrimitiveInScene(gltf, scene, addAoToImage, parameters);
}

function addAoToImage(primitive, meshPrimitiveID, parameters) {
    // Enforce material/texture/image uniqueness
    var gltf = parameters.gltf;
    var diffuseImage = ensureImageUniqueness(gltf, primitive, meshPrimitiveID, parameters);
    diffuseImage.extras._pipeline.imageChanged = true;
    var diffuseImageJimp = diffuseImage.extras._pipeline.jimpImage;
    var goalResolution = diffuseImageJimp.bitmap.width;

    // Post process the AO
    var jimpAO = gltf.extras._pipeline.jimpScratch;
    var aoBuffer = parameters.raytracerScene.aoBufferByPrimitive[meshPrimitiveID];
    postProcessAO(aoBuffer, parameters.resolution, goalResolution, jimpAO);

    // Modify the diffuse image with AO
    for (var x = 0; x < goalResolution; x++) {
        for (var y = 0; y < goalResolution; y++) {
            var idx = (goalResolution * y + x) * 4;
            var aoValue = 1.0 - (jimpAO.bitmap.data[idx + 3] / 255.0);

            // darken each channel by the ao value
            diffuseImageJimp.bitmap.data[idx] *= aoValue;
            diffuseImageJimp.bitmap.data[idx + 1] *= aoValue;
            diffuseImageJimp.bitmap.data[idx + 2] *= aoValue;
        }
    }
}

function postProcessAO(aoBuffer, dataResolution, goalResolution, jimpAO) {
    // Copy the data over to the jimp
    var value = 0.0;
    jimpAO.resize(dataResolution, dataResolution);
    for (var x = 0; x < dataResolution; x++) {
        for (var y = 0; y < dataResolution; y++) {
            var dataIdx = dataResolution * y + x;
            value = 255.0 * (aoBuffer.samples[dataIdx] / aoBuffer.count[dataIdx]);
            jimpAO.bitmap.data[dataIdx * 4 + 3] = value;
        }
    }
    // Resize the data to match the goal resolution
    jimpAO.resize(goalResolution, goalResolution, Jimp.RESIZE_BEZIER);
}

function cloneAndSetup(newMateralID, newTextureID, newImageID,
                      oldMateralID, oldTextureID, oldImageID,
                      materials, textures, images) {
    var newImage;
    var newTexture;
    var newMaterial;

    if (defined(newImageID)) {
        var oldImage = images[oldImageID];
        newImage = clone(oldImage);
        newImage.extras._pipeline.jimpImage = oldImage.extras._pipeline.jimpImage.clone();
        images[newImageID] = newImage;
    }
    if (defined(newTextureID)) {
        var oldTexture = textures[oldTextureID];
        newTexture = clone(oldTexture);
        newTexture.source = newImageID;
        textures[newTextureID] = newTexture;
    } else {
        return;
    }
    if (defined(newMateralID)) {
        newMaterial = clone(materials[oldMateralID]);
        newMaterial.texture = newTextureID;
        materials[newMateralID] = newMaterial;
    }
}

// Check and modify the given material to ensure every primitive gets a unique material, texture, and image
function ensureImageUniqueness(gltf, primitive, meshPrimitiveID, state) {
    var materialsSeen = state.materialsSeen;
    var texturesSeen = state.texturesSeen;
    var imagesSeen = state.imagesSeen;

    var allMaterials = gltf.materials;
    var allTextures = gltf.textures;
    var allImages = gltf.images;

    // Generate some new IDs
    var newMaterialID = meshPrimitiveID + '_AO_material';
    var newTextureID = meshPrimitiveID + '_AO_texture';
    var newImageID = meshPrimitiveID + '_AO_image';

    // Grab the existing material
    var materialID = primitive.material;
    var material = allMaterials[materialID];
    var values = material.values;
    var diffuse = values.diffuse;

    // Check if the material has a diffuse texture material. if not,
    // - clone the example material
    // - clone the example texture
    // - clone the example image. resize to resolution and set to diffuse color, if any
    if (!defined(diffuse) || typeof diffuse !== 'string') {
        cloneAndSetup(
            newMaterialID, newTextureID, newImageID,
            state.exampleMaterialID, state.exampleTextureID, state.exampleImageID,
            allMaterials, allTextures, allImages);

        var color = defaultValue(diffuse, [1.0, 1.0, 1.0, 1.0]);
        for (var i = 0; i < 4; i++) {
            diffuse[i] *= 255;
        }
        var newJimpImage = allImages[newImageID].extras._pipeline.jimpImage;

        var resolution = state.resolution;
        newJimpImage.resize(resolution, resolution);
        var hexColor = Jimp.rgbaToInt(color[0], color[1], color[2], color[3]);
        for (var x = 0; x < resolution; x++) {
            for (var y = 0; y < resolution; y++) {
                newJimpImage.setPixelColor(x, y, hexColor);
            }
        }
        primitive.material = newMaterialID;
        return allImages[newImageID];
    }

    var textureID = diffuse;
    var imageID = allTextures[textureID].source;

    if (materialsSeen.hasOwnProperty(materialID)) {
        // Check if the material is unique. If not, clone material, texture, and image
        cloneAndSetup(
            newMaterialID, newTextureID, newImageID,
            materialID, textureID, imageID,
            allMaterials, allTextures, allImages);
        primitive.material = newMaterialID;
    } else if(texturesSeen.hasOwnProperty(textureID)) {
        // Check if the texture is unique. If not clone the texture and the image.
        cloneAndSetup(
            undefined, newTextureID, newImageID,
            materialID, textureID, imageID,
            allMaterials, allTextures, allImages);
        values.diffuse = newTextureID;
    } else if(imagesSeen.hasOwnProperty(imageID)) {
        // Check if the image is unique. if not, clone the image.
        var texture = allTextures[textureID];
        cloneAndSetup(
            undefined, undefined, newImageID,
            materialID, textureID, imageID,
            allMaterials, allTextures, allImages);
        texture.source = newImageID;
    } else {
        // If nothing was cloned, mark this material, texture, and image as seen
        materialsSeen[materialID] = true;
        texturesSeen[textureID] = true;
        imagesSeen[imageID] = true;
        newImageID = imageID;
    }
    return allImages[newImageID];
}

////////// loading //////////

function generateRaytracerScene(gltf, scene, options) {
    // Set up data we need for sampling. generate "triangle soup" over the whole scene.
    var accessors = gltf.accessors;

    // read all accessors in one go to avoid repeated read-and-conversion
    var bufferDataByAccessor = {};

    for (var accessorID in accessors) {
        if (accessors.hasOwnProperty(accessorID)) {
            var accessor = accessors[accessorID];
            bufferDataByAccessor[accessorID] = readAccessor(gltf, accessor);
        }
    }

    var raytracerScene = {
        bufferDataByAccessor: bufferDataByAccessor,
        numberSamples: defaultValue(options.numberSamples, 16),
        rayDepth: defaultValue(options.rayDepth, 1.0), // TODO: compute dynamic default ray depth?
        triangleSoup: [],
        aoBufferByPrimitive: {},
        nearCull: 0.5 / options.resolution
    };

    // TODO: currently assuming each primitive appears in the scene once. figure out what to do when this is not true.

    // Generate all the world transform matrices
    NodeHelpers.computeFlatTransformScene(scene, gltf.nodes);

    var parameters = {
        resolution: options.resolution,
        raytracerScene: raytracerScene
    };

    NodeHelpers.forEachPrimitiveInScene(gltf, scene, processPrimitive, parameters);

    return raytracerScene;
}

function processPrimitive(primitive, meshPrimitiveID, parameters, node) {
    // AO only works with triangles
    if (defined(primitive.mode) && primitive.mode !== WebGLConstants.TRIANGLES) {
        throw new DeveloperError('In stage bakeAmbientOcclusion: baking AO only supports triangle primitives.');
    }

    var raytracerScene = parameters.raytracerScene;
    var bufferDataByAccessor = raytracerScene.bufferDataByAccessor;
    var indices = bufferDataByAccessor[primitive.indices].data;
    var positions = bufferDataByAccessor[primitive.attributes.POSITION].data;
    var numberTriangles = indices.length / 3;
    var transform = node.extras._pipeline.flatTransform;

    var resolution = parameters.resolution;

    raytracerScene.aoBufferByPrimitive[meshPrimitiveID] = {
        resolution: resolution,
        samples: new Array(resolution * resolution).fill(0.0),
        count: new Array(resolution * resolution).fill(0)
    };

    // Read each triangle's Cartesian3s using the index buffer
    for (var i = 0; i < numberTriangles; i++) {
        var index0 = indices[i * 3];
        var index1 = indices[i * 3 + 1];
        var index2 = indices[i * 3 + 2];

        var position0 = Cartesian3.clone(positions[index0]);
        var position1 = Cartesian3.clone(positions[index1]);
        var position2 = Cartesian3.clone(positions[index2]);

        // Generate a world space triangle geometry for the soup
        Matrix4.multiplyByPoint(transform, position0, position0);
        Matrix4.multiplyByPoint(transform, position1, position1);
        Matrix4.multiplyByPoint(transform, position2, position2);

        var triangle = {
            positions: [
                position0, position1, position2
            ]
        };
        raytracerScene.triangleSoup.push(triangle);
    }
}

////////// rendering //////////

function raytracePrimitiveTexels(primitive, meshPrimitiveID, parameters, node) {
    var raytracerScene = parameters.raytracerScene;
    var bufferDataByAccessor = raytracerScene.bufferDataByAccessor;
    var indices = bufferDataByAccessor[primitive.indices].data;
    var positions = bufferDataByAccessor[primitive.attributes.POSITION].data;
    var normals = bufferDataByAccessor[primitive.attributes.NORMAL].data;
    var uvs = bufferDataByAccessor[primitive.attributes.TEXCOORD_0].data;
    var numTriangles = indices.length / 3;
    var transform = node.extras._pipeline.flatTransform;
    var inverseTranspose = new Matrix4();
    inverseTranspose = Matrix4.transpose(transform, inverseTranspose);
    inverseTranspose = Matrix4.inverse(inverseTranspose, inverseTranspose);

    var triangleSoup = raytracerScene.triangleSoup;
    var numberSamples = raytracerScene.numberSamples;
    var sqrtNumberSamples = Math.floor(Math.sqrt(numberSamples));
    var aoBuffer = raytracerScene.aoBufferByPrimitive[meshPrimitiveID];
    var resolution = parameters.resolution;

    // For each position on a triangle corresponding to a texel center,
    // raytrace ambient occlusion.
    for (var i = 0; i < numTriangles; i++) {
        var index0 = indices[i * 3];
        var index1 = indices[i * 3 + 1];
        var index2 = indices[i * 3 + 2];

        var uv0 = uvs[index0];
        var uv1 = uvs[index1];
        var uv2 = uvs[index2];

        var uMin = Math.min(uv0.x, uv1.x, uv2.x);
        var vMin = Math.min(uv0.y, uv1.y, uv2.y);
        var uMax = Math.max(uv0.x, uv1.x, uv2.x);
        var vMax = Math.max(uv0.y, uv1.y, uv2.y);

        // Perform a pixel march over the
        // 0.0, 0.0 to width, width is the bottom left pixel
        // 1.0-width, 1.0-width to 1.0, 1.0 is the top right pixel
        // TODO: borrow from conservative rasterization: http://http.developer.nvidia.com/GPUGems2/gpugems2_chapter42.html
        var pixelWidth = 1.0 / resolution;
        var halfWidth = pixelWidth / 2.0;
        uMin = Math.floor(uMin / pixelWidth) * pixelWidth + halfWidth;
        vMin = Math.floor(vMin / pixelWidth) * pixelWidth + halfWidth;
        uMax = Math.floor(uMax / pixelWidth) * pixelWidth + halfWidth;
        vMax = Math.floor(vMax / pixelWidth) * pixelWidth + halfWidth;

        var barycentric = cartesian3Scratch1;

        var uStep = uMin;
        while(uStep < uMax) {
            var vStep = vMin;
            while(vStep < vMax) {
                // TODO: incorporate option for sub-pixel samples
                // Use the triangle's uv coordinates to compute this texel's barycentric coordinates on the triangle
                cartesian2Scratch.x = uStep;
                cartesian2Scratch.y = vStep;
                barycentric = baryCentricCoordinates(cartesian2Scratch, uv0, uv1, uv2, barycentric);

                // Not in triangle
                if (barycentric.x < 0.0 || barycentric.y < 0.0 || barycentric.z < 0.0) {
                    vStep += pixelWidth;
                    continue;
                }

                // Use this barycentric coordinate to compute the local space position and normal on the triangle
                var texelPosition = cartesian3Scratch2;
                var texelNormal = cartesian3Scratch3;
                sumBarycentric(barycentric, positions[index0], positions[index1], positions[index2], cartesian3Scratch4, texelPosition);
                sumBarycentric(barycentric, normals[index0], normals[index1], normals[index2], cartesian3Scratch4, texelNormal);

                // Transform to world space
                Matrix4.multiplyByPoint(transform, texelPosition, texelPosition);
                Matrix4.multiplyByPointAsVector(inverseTranspose, texelNormal, texelNormal);
                Cartesian3.normalize(texelNormal, texelNormal);

                var triangles = triangleSoup;

                var aoBufferIndex = Math.floor(uStep / pixelWidth) + Math.floor(vStep / pixelWidth) * resolution;

                // Raytrace
                computeAmbientOcclusionAt(texelPosition, texelNormal, numberSamples, sqrtNumberSamples,
                    triangles, raytracerScene.nearCull,
                    raytracerScene.rayDepth, aoBuffer, aoBufferIndex);

                vStep += pixelWidth;
            }
            uStep += pixelWidth;
        }
    }
}

function computeAmbientOcclusionAt(position, normal, numberSamples, sqrtNumberSamples,
    triangles, nearCull, rayDepth, aoBuffer, aoBufferIndex) {
    for (var j = 0; j < numberSamples; j++) {
        var sampleRay = generateJitteredRay(position, normal, j, sqrtNumberSamples);
        aoBuffer.count[aoBufferIndex]++;
        var nearestIntersect = naiveRaytrace(triangles, sampleRay, nearCull);

        if (nearestIntersect < rayDepth) {
            aoBuffer.samples[aoBufferIndex] += 1.0;
        }
    }
}

function naiveRaytrace(triangleSoup, ray, nearCull) {
    // Check ray against every triangle in the soup. return the nearest intersection.
    var minIntersect = Number.POSITIVE_INFINITY;
    for (var triangleSoupIndex = 0; triangleSoupIndex < triangleSoup.length; triangleSoupIndex++) {
        var positions = triangleSoup[triangleSoupIndex].positions;
        var distance = rayTriangle(ray, positions[0], positions[1], positions[2], false);
        if (defined(distance) && distance > nearCull) {
            minIntersect = Math.min(distance, minIntersect);
        }
    }
    return minIntersect;
}

function generateJitteredRay(position, normal, sampleNumber, sqrtNumberSamples) {
    // Stratified (jittered) Sampling with javascript's own rand function
    // Based on notes here: http://graphics.ucsd.edu/courses/cse168_s14/ucsd/CSE168_11_Random.pdf

    // Produces samples based on a grid of dimension sqrtNumberSamples x sqrtNumberSamples
    var cellWidth = 1.0 / sqrtNumberSamples;
    var s = (sampleNumber % sqrtNumberSamples) * cellWidth + (Math.random() / sqrtNumberSamples);
    var t = Math.floor(sampleNumber / sqrtNumberSamples) * cellWidth + (Math.random() / sqrtNumberSamples);

    // Generate ray on a y-up hemisphere with cosine weighting (more rays around the normal)
    var u = 2.0 * Math.PI * s;
    var v = Math.sqrt(1.0 - t);

    var randomDirection = scratchRay.direction;
    randomDirection.x = v * Math.cos(u);
    randomDirection.y = t;
    randomDirection.z = v * Math.sin(u);

    // Orient with texel's normal in world space
    var theta = Math.acos(normal.y); // dot product of normal with y-up is normal.y
    var axis = Cartesian3.cross(randomDirection, normal, cartesian3Scratch1);
    var rotation = Quaternion.fromAxisAngle(axis, theta, quaternionScratch);
    var matrix = Matrix3.fromQuaternion(rotation, matrix3Scratch);

    scratchRay.origin = position;
    scratchRay.direction = Matrix3.multiplyByVector(matrix, randomDirection, scratchRay.direction);
    return scratchRay;
}

// Borrowed straight from Cesium/Source/Core/IntersectionTests
var scratchEdge0 = new Cartesian3();
var scratchEdge1 = new Cartesian3();
var scratchPVec = new Cartesian3();
var scratchTVec = new Cartesian3();
var scratchQVec = new Cartesian3();

function rayTriangle(ray, p0, p1, p2, cullBackFaces) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(ray)) {
        throw new DeveloperError('ray is required.');
    }
    if (!defined(p0)) {
        throw new DeveloperError('p0 is required.');
    }
    if (!defined(p1)) {
        throw new DeveloperError('p1 is required.');
    }
    if (!defined(p2)) {
        throw new DeveloperError('p2 is required.');
    }
    //>>includeEnd('debug');

    cullBackFaces = defaultValue(cullBackFaces, false);

    var origin = ray.origin;
    var direction = ray.direction;

    var edge0 = Cartesian3.subtract(p1, p0, scratchEdge0);
    var edge1 = Cartesian3.subtract(p2, p0, scratchEdge1);

    var p = Cartesian3.cross(direction, edge1, scratchPVec);
    var det = Cartesian3.dot(edge0, p);

    var tvec;
    var q;

    var u;
    var v;
    var t;

    if (cullBackFaces) {
        if (det < CesiumMath.EPSILON6) {
            return undefined;
        }

        tvec = Cartesian3.subtract(origin, p0, scratchTVec);
        u = Cartesian3.dot(tvec, p);
        if (u < 0.0 || u > det) {
            return undefined;
        }

        q = Cartesian3.cross(tvec, edge0, scratchQVec);

        v = Cartesian3.dot(direction, q);
        if (v < 0.0 || u + v > det) {
            return undefined;
        }

        t = Cartesian3.dot(edge1, q) / det;
    } else {
        if (Math.abs(det) < CesiumMath.EPSILON6) {
            return undefined;
        }
        var invDet = 1.0 / det;

        tvec = Cartesian3.subtract(origin, p0, scratchTVec);
        u = Cartesian3.dot(tvec, p) * invDet;
        if (u < 0.0 || u > 1.0) {
            return undefined;
        }

        q = Cartesian3.cross(tvec, edge0, scratchQVec);

        v = Cartesian3.dot(direction, q) * invDet;
        if (v < 0.0 || u + v > 1.0) {
            return undefined;
        }

        t = Cartesian3.dot(edge1, q) * invDet;
    }

    return t;
}

function sumBarycentric(barycentric, vector0, vector1, vector2, scratch, result) {
    result.x = 0.0;
    result.y = 0.0;
    result.z = 0.0;
    Cartesian3.multiplyByScalar(vector0, barycentric.x, scratch);
    Cartesian3.add(result, scratch, result);
    Cartesian3.multiplyByScalar(vector1, barycentric.y, scratch);
    Cartesian3.add(result, scratch, result);
    Cartesian3.multiplyByScalar(vector2, barycentric.z, scratch);
    Cartesian3.add(result, scratch, result);
    return result;
}
