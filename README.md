# glTF Pipeline

[![License](https://img.shields.io/:license-apache-blue.svg)](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/blob/master/LICENSE.md)
[![Build Status](https://travis-ci.org/AnalyticalGraphicsInc/gltf-pipeline.svg?branch=master)](https://travis-ci.org/AnalyticalGraphicsInc/gltf-pipeline)
[![Coverage Status](https://coveralls.io/repos/AnalyticalGraphicsInc/gltf-pipeline/badge.svg?branch=master)](https://coveralls.io/r/AnalyticalGraphicsInc/gltf-pipeline?branch=master)

<p align="center">
<a href="https://www.khronos.org/gltf"><img src="doc/gltf.png" onerror="this.src='gltf.png'"/></a>
</p>

Content pipeline tools for optimizing [glTF](https://www.khronos.org/gltf) assets by [Richard Lee](http://leerichard.net/) and the [Cesium team](http://cesiumjs.org/).

Supports common operations including:
* Converting glTF to glb (and reverse)
* Saving buffers/textures as embedded or separate files
* Converting glTF 1.0 models to glTF 2.0 (using the [KHR_techniques_webgl](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_techniques_webgl) and [KHR_blend](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_blend) extensions)

`gltf-pipeline` can be used as a command-line tool or Node.js module.

## Getting Started

Install [Node.js](https://nodejs.org/en/) if you don't already have it, and then:
```
npm install
```

### Using gltf-pipeline as a command-line tool:

#### Converting a glTF to glb
`node bin/gltf-pipeline.js -i model.gltf -o model.glb`

`node bin/gltf-pipeline.js -i model.gltf -b`

#### Converting a glb to glTF
`node bin/gltf-pipeline.js -i model.glb -o model.gltf`

`node bin/gltf-pipeline.js -i model.glb -j`

#### Converting a glTF to Draco glTF
`node bin/gltf-pipeline.js -i model.gltf -d -s -o modelDraco.gltf`

### Saving separate textures
`node bin/gltf-pipeline.js -i model.gltf -t`

### Using gltf-pipeline as a library:

#### Converting a glTF to glb:

```javascript
var gltfPipeline = require('gltf-pipeline');
var fsExtra = require('fs-extra');
var gltfToGlb = gltfPipeline.gltfToGlb;
var gltf = fsExtra.readJsonSync('model.gltf');
gltfToGlb(gltf)
    .then(function(results) {
        fsExtra.writeFileSync('model.glb', results.glb);
    }
```

#### Converting a glb to glTF

```javascript
var gltfPipeline = require('gltf-pipeline');
var fsExtra = require('fs-extra');
var glbToGltf = gltfPipeline.glbToGltf;
var glb = fsExtra.readFileSync('model.glb');
glbToGltf(glb)
    .then(function(results) {
        fsExtra.writeJsonSync('model.gltf', results.gltf);
    }
```

#### Saving separate textures

```javascript
var gltfPipeline = require('gltf-pipeline');
var fsExtra = require('fs-extra');
var gltfToGlb = gltfPipeline.gltfToGlb;
var gltf = fsExtra.readJsonSync('model.gltf');
var options = {
    separateTextures: true
};
processGltf(gltf, options)
    .then(function(results) {
        fsExtra.writeJsonSync('model.gltf', results.gltf);
        // Save separate resources
        var separateResources = results.separateResources;
        for (var relativePath in separateResources) {
            if (separateResources.hasOwnProperty(relativePath)) {
                var resource = separateResources[relativePath];
                fsExtra.writeFileSync(relativePath, resource));
            }
        }
    }
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
|`--checkTransparency`|Do a more exhaustive check for texture transparency by looking at the alpha channel of each pixel. By default textures are considered to be opaque.|No, default `false`|
|`--stats`|Print statistics to console for input and output glTF files.|No, default `false`|
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

## Deploying to npm

* Proofread [CHANGES.md](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/blob/master/CHANGES.md).
* Update the `version` in [package.json](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/blob/master/package.json) to match the latest version in [CHANGES.md](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/blob/master/CHANGES.md).
* Make sure to run the tests and ensure they pass.
* If any changes are required, commit and push them to the repository.
* Create and test the package.
```
## NPM Pack
## Creates tarball. Verify using 7-zip (or your favorite archiver).
## If you find unexpected/unwanted files, add them to .npmignore, and then run npm pack again.
npm pack

## Test the package
## Copy and install the package in a temporary directory
mkdir temp && cp <tarball> temp/
npm install --production <tarball>
node -e "var test = require('gltf-pipeline');" # No output on success

# If module has executables, then test those now.
```
* Tag and push the release.
  * `git tag -a <version> -m "<message>"`
  * `git push origin <version>`
* Publish
```
npm publish
```

Contact [@lilleyse](https://github.com/lilleyse) if you need access to publish.

## Contributions

Pull requests are appreciated!  Please use the same [Contributor License Agreement (CLA)](https://github.com/AnalyticalGraphicsInc/cesium/blob/master/CONTRIBUTING.md) and [Coding Guide](https://github.com/AnalyticalGraphicsInc/cesium/blob/master/Documentation/Contributors/CodingGuide/README.md) used for [Cesium](http://cesiumjs.org/).
