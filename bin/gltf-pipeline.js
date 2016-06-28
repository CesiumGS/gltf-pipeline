'use strict';
var argv = require('yargs').argv;
var path = require('path');
var Cesium = require('cesium');
var CesiumMath = Cesium.Math;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;
var gltfPipeline = require('../lib/gltfPipeline');
var processFileToDisk = gltfPipeline.processFileToDisk;

if (process.argv.length < 3 || defined(argv.h) || defined(argv.help)) {
    var help =
        'Usage: node ' + path.basename(__filename) + ' [path-to.gltf or path-to.bgltf] [OPTIONS]\n' +
        '  -i --input, input=PATH Read unoptimized glTF from the specified file.\n' +
        '  -o --output, output=PATH write optimized glTF to the specified file.\n' +
        '  -b --binary, write binary glTF file.\n' +
        '  -s --separate, writes out separate geometry/animation data files, shader files and textures instead of embedding them in the glTF file.\n' +
        '  -t --separateImage, write out separate textures, but embed geometry/animation data files, and shader files.\n' +
        '  -q, quantize the attributes of this model.\n' +
        '  --ao.vertex, bake ambient occlusion to vertices instead of the diffuse texture and modify the shader. Defaults to false.\n' +
        '  --ao.shaderMode, for displaying vertex-baked occlusion. Valid settings are multiply, replace, and blend. Defaults to blend.\n' +
        '  --ao.blendAmount, for displaying vertex-baked occlusion by blending with the original shader output. Defaults to 50%.\n' +
        '  --ao.triangleAverage, bake ambient occlusion averaged over triangles to vertices. Defaults to false.\n' +
        '  --ao.groundPlane, add a simulated ground plane to the scene for computing ambient occlusion. Defaults to false.\n' +
        '  --ao.scene, specify which scene to bake AO for. Defaults to the gltf default scene.\n' +
        '  --ao.nearCull, near-distance at which to cull intersections when raytracing. Defaults to 0.0001 in world space.\n' +
        '  --ao.rayDepth, ray distance for raytraced ambient occlusion. Defaults to 1.0 units in world space.\n' +
        '  --ao.resolution: When baking to texture, this specifies the resolution of the AO texture that will be overlayed onto the diffuse texture. Defaults to 128.\n' +
        '  --ao.density: When baking to vertices with triangleAverage enabled, this is the count of points per unit length (in model space) for which AO is computed. Defaults to 1.\n' +
        '  --ao.samples, sample count for ambient occlusion texel. Clamps to the nearest smaller perfect square. Defaults to 16.\n';
    process.stdout.write(help);
    return;
}

var gltfPath = defaultValue(argv._[0], defaultValue(argv.i, argv.input));
var fileExtension = path.extname(gltfPath);
var fileName = path.basename(gltfPath, fileExtension);
var filePath = path.dirname(gltfPath);

var outputPath = defaultValue(argv._[1], defaultValue(argv.o, argv.output));
var binary = defaultValue(defaultValue(argv.b, argv.binary), false);
var separate = defaultValue(defaultValue(argv.s, argv.separate), false);
var separateImage = defaultValue(defaultValue(argv.t, argv.separateImage), false);
var quantize = defaultValue(defaultValue(argv.q, argv.quantize), false);

var aoOptions;
if (argv.ao) {
    aoOptions = {
        // per-vertex options
        toVertex : defaultValue(argv.ao.vertex, false),
        shaderMode : defaultValue(argv.ao.shaderMode, 'blend'),
        blendAmount: defaultValue(argv.ao.blendAmount, 0.5),
        triangleAverage : defaultValue(argv.ao.triangleAverage, false),
        // general options
        scene : argv.ao.scene,
        nearCull : defaultValue(argv.ao.nearCull, CesiumMath.EPSILON4),
        rayDepth : defaultValue(argv.ao.rayDepth, 1.0),
        resolution : defaultValue(argv.ao.resolution, 128),
        density : defaultValue(argv.ao.density, 1.0),
        numberSamples : defaultValue(argv.ao.samples, 16),
        groundPlane : defaultValue(argv.ao.groundPlane, false)
    };
}

if (!defined(gltfPath)) {
    throw new DeveloperError('Input path is undefined.');
}

if (fileExtension !== '.glb' && fileExtension !== '.gltf') {
    throw new DeveloperError('Invalid glTF file.');
}

if (!defined(outputPath)) {
    // Default output.  For example, path/asset.gltf becomes path/asset-optimized.gltf
    outputPath = path.join(filePath, fileName + '-optimized' + fileExtension);
}

var options = {
    binary : binary,
    embed : !separate,
    embedImage : !separateImage,
    quantize : quantize,
    aoOptions : aoOptions,
    imageProcess : defined(aoOptions) && !aoOptions.toVertex
};

processFileToDisk(gltfPath, outputPath, options);
