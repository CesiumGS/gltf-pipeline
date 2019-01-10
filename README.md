# glTF Pipeline

[![License](https://img.shields.io/:license-apache-blue.svg)](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/blob/master/LICENSE.md)
[![Build Status](https://travis-ci.org/AnalyticalGraphicsInc/gltf-pipeline.svg?branch=master)](https://travis-ci.org/AnalyticalGraphicsInc/gltf-pipeline)
[![Coverage Status](https://coveralls.io/repos/AnalyticalGraphicsInc/gltf-pipeline/badge.svg?branch=master)](https://coveralls.io/r/AnalyticalGraphicsInc/gltf-pipeline?branch=master) [![Greenkeeper badge](https://badges.greenkeeper.io/AnalyticalGraphicsInc/gltf-pipeline.svg)](https://greenkeeper.io/)

<p align="center">
<a href="https://www.khronos.org/gltf"><img src="doc/gltf.png" onerror="this.src='gltf.png'"/></a>
</p>

Content pipeline tools for optimizing [glTF](https://www.khronos.org/gltf) assets by [Richard Lee](http://leerichard.net/) and the [Cesium team](http://cesiumjs.org/).

Supports common operations including:
* Converting glTF to glb (and reverse)
* Saving buffers/textures as embedded or separate files
* Converting glTF 1.0 models to glTF 2.0 (using the [KHR_techniques_webgl](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_techniques_webgl) and [KHR_blend](https://github.com/KhronosGroup/glTF/pull/1302) extensions)
* Applying [Draco](https://github.com/google/draco) mesh compression

`gltf-pipeline` can be used as a command-line tool or Node.js module.

## Getting Started

Install [Node.js](https://nodejs.org/en/) if you don't already have it, and then:
```
npm install -g gltf-pipeline
```

### Using gltf-pipeline as a command-line tool:

#### Converting a glTF to glb
`gltf-pipeline -i model.gltf -o model.glb`

`gltf-pipeline -i model.gltf -b`

#### Converting a glb to glTF
`gltf-pipeline -i model.glb -o model.gltf`

`gltf-pipeline -i model.glb -j`

#### Converting a glTF to Draco glTF
`gltf-pipeline -i model.gltf -o modelDraco.gltf -d`

### Saving separate textures
`gltf-pipeline -i model.gltf -t`

### Using gltf-pipeline as a library:

#### Converting a glTF to glb:

```javascript
const gltfPipeline = require('gltf-pipeline');
const fsExtra = require('fs-extra');
const gltfToGlb = gltfPipeline.gltfToGlb;
const gltf = fsExtra.readJsonSync('model.gltf');
gltfToGlb(gltf)
    .then(function(results) {
        fsExtra.writeFileSync('model.glb', results.glb);
    });
```

#### Converting a glb to glTF

```javascript
const gltfPipeline = require('gltf-pipeline');
const fsExtra = require('fs-extra');
const glbToGltf = gltfPipeline.glbToGltf;
const glb = fsExtra.readFileSync('model.glb');
glbToGltf(glb)
    .then(function(results) {
        fsExtra.writeJsonSync('model.gltf', results.gltf);
    });
```

#### Converting a glTF to Draco glTF

```javascript
const gltfPipeline = require('gltf-pipeline');
const fsExtra = require('fs-extra');
const processGltf = gltfPipeline.processGltf;
const gltf = fsExtra.readJsonSync('model.gltf');
const options = {
    dracoOptions: {
        compressionLevel: 10
    }
};
processGltf(gltf, options)
    .then(function(results) {
        fsExtra.writeJsonSync('model-draco.gltf', results.gltf);
    });
```

#### Saving separate textures

```javascript
const gltfPipeline = require('gltf-pipeline');
const fsExtra = require('fs-extra');
const processGltf = gltfPipeline.processGltf;
const gltf = fsExtra.readJsonSync('model.gltf');
const options = {
    separateTextures: true
};
processGltf(gltf, options)
    .then(function(results) {
        fsExtra.writeJsonSync('model-separate.gltf', results.gltf);
        // Save separate resources
        const separateResources = results.separateResources;
        for (const relativePath in separateResources) {
            if (separateResources.hasOwnProperty(relativePath)) {
                const resource = separateResources[relativePath];
                fsExtra.writeFileSync(relativePath, resource);
            }
        }
    });
```

### Command-Line Flags

|Flag|Description|Required|
|----|-----------|--------|
|`--help`, `-h`|Display help|No|
|`--input`, `-i`|Path to the glTF or glb file.|:white_check_mark: Yes|
|`--output`, `-o`|Output path of the glTF or glb file. Separate resources will be saved to the same directory.|No|
|`--binary`, `-b`|Convert the input glTF to glb.|No, default `false`|
|`--json`, `-j`|Convert the input glb to glTF.|No, default `false`|
|`--separate`, `-s`|Write separate buffers, shaders, and textures instead of embedding them in the glTF.|No, default `false`|
|`--separateTextures`, `-t`|Write out separate textures only.|No, default `false`|
|`--secure`|Prevent the source model from referencing paths outside of its directory.|No, default `false`|
|`--stats`|Print statistics to console for output glTF file.|No, default `false`|
|`--draco.compressMeshes`, `-d`|Compress the meshes using Draco. Adds the KHR_draco_mesh_compression extension.|No, default `false`|
|`--draco.compressionLevel`|Draco compression level [0-10], most is 10, least is 0. A value of 0 will apply sequential encoding and preserve face order.|No, default `7`|
|`--draco.quantizePositionBits`|Quantization bits for position attribute when using Draco compression.|No, default `14`|
|`--draco.quantizeNormalBits`|Quantization bits for normal attribute when using Draco compression.|No, default `10`|
|`--draco.quantizeTexcoordBits`|Quantization bits for texture coordinate attribute when using Draco compression.|No, default `12`|
|`--draco.quantizeColorBits`|Quantization bits for color attribute when using Draco compression.|No, default `8`|
|`--draco.quantizeGenericBits`|Quantization bits for skinning attribute (joint indices and joint weights) and custom attributes when using Draco compression.|No, default `12`|
|`--draco.unifiedQuantization`|Quantize positions of all primitives using the same quantization grid. If not set, quantization is applied separately.|No, default `false`|

## Build Instructions

Run the tests:
```
npm run test
```
To run ESLint on the entire codebase, run:
```
npm run eslint
```
To run ESLint automatically when a file is saved, run the following and leave it open in a console window:
```
npm run eslint-watch
```

### Building for Cesium integration

Some functionality of gltf-pipeline is used by Cesium as a third party library. The necessary files can be generated using:

```
npm run build-cesium
```

This will output a portion of the gltf-pipeline code into the `dist/cesium` folder, reformatted into AMD style for use with RequireJS and Cesium in the browser.

### Running Test Coverage

Coverage uses [nyc](https://github.com/istanbuljs/nyc).  Run:
```
npm run coverage
```
For complete coverage details, open `coverage/lcov-report/index.html`.

The tests and coverage covers the Node.js module; it does not cover the command-line interface, which is tiny.

## Generating Documentation

To generate the documentation:
```
npm run jsdoc
```

The documentation will be placed in the `doc` folder.

## Contributions

Pull requests are appreciated!  Please use the same [Contributor License Agreement (CLA)](https://github.com/AnalyticalGraphicsInc/cesium/blob/master/CONTRIBUTING.md) and [Coding Guide](https://github.com/AnalyticalGraphicsInc/cesium/blob/master/Documentation/Contributors/CodingGuide/README.md) used for [Cesium](http://cesiumjs.org/).
