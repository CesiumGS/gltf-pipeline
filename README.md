# glTF Pipeline

[![License](https://img.shields.io/:license-apache-blue.svg)](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/blob/master/LICENSE.md)
[![Build Status](https://travis-ci.org/AnalyticalGraphicsInc/gltf-pipeline.svg?branch=master)](https://travis-ci.org/AnalyticalGraphicsInc/gltf-pipeline)
[![Coverage Status](https://coveralls.io/repos/AnalyticalGraphicsInc/gltf-pipeline/badge.svg?branch=master)](https://coveralls.io/r/AnalyticalGraphicsInc/gltf-pipeline?branch=master)

<p align="center">
<a href="https://www.khronos.org/gltf"><img src="doc/gltf.png" onerror="this.src='gltf.png'"/></a>
</p>

Content pipeline tools for optimizing [glTF](https://www.khronos.org/gltf) assets by [Richard Lee](http://leerichard.net/) and the [Cesium team](http://cesiumjs.org/).

This project is under active development, see the [roadmap](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/issues/1).

gltf-pipeline can be used as a command-line tool or Node.js module.

## Instructions

Clone this repo and install [Node.js](http://nodejs.org/).  From the root directory of this repo, run:
```
npm install
```

Command-Line Example:
```
node ./bin/gltf-pipeline.js ./specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf -o output.gltf
```

### Command-Line Flags

|Flag|Description|Required|
|----|-----------|--------|
|`-i`, `--input`|Path to the input glTF file.| :white_check_mark: Yes|
|`-o`, `--output`|Directory or filename for the exported glTF file.|No|
|`-b`, `--binary`|Write binary glTF file.|No, default `false`|
|`-s`, `--separate`|Writes out separate geometry/animation data files, shader files and textures instead of embedding them in the glTF file.|No, default `false`|
|`-h`, `--help`|Display help|No|
|`-t`, `--separateTexture`|Write out separate textures, but embed geometry/animation data files, and shader files.|No, default `false`|
|`-q`, `--quantize`|Quantize attributes using WEB3D_quantized_attributes extension.|No, default `false`|
|`-n`, `--encodeNormals`|Oct-encode the normals of this model.|No, default `false`|
|`-c`, `--compressTextureCoordinates`|Compress the texture coordinates of this model.|No, default `false`|
|`-m`, `--minifyImages`|Compress texture images to reduce overall model size.|No, default `false`|
|`--ao`|Bake ambient occlusion to vertex data using default settings __only__. When specifying other settings, do not use `--ao` on its own. Advanced settings in `lib/bakeAmbientOcclusion.js`|No, default `false`|
|`--ao.toTexture`|Bake AO to existing diffuse textures instead of to vertices. Does not modify shaders.|No, default `false`|
|`--ao.groundPlane`|Simulate a groundplane at the lowest point of the model when baking AO.|No, default `false`|
|`--ao.ambientShadowContribution`|Amount of AO to show when blending between shader computed lighting and AO. 1.0 is full AO, 0.5 is a 50/50 blend.|No, default `0.5`|
|`--ao.quality`|Valid settings are high, medium, and low.|No, default `low`|

## Build Instructions

Run the tests:
```
npm run test
```
To run JSHint on the entire codebase, run:
```
npm run jsHint
```
To run JSHint automatically when a file is saved, run the following and leave it open in a console window:
```
npm run jsHint-watch
```

### Running Test Coverage

Coverage uses [istanbul](https://github.com/gotwarlost/istanbul).  Run:
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

### Debugging

* To debug the tests in Webstorm, open the Gulp tab, right click the `test` task, and click `Debug 'test'`.
* To run a single test, change the test function from `it` to `fit`.

## Contributions

Pull requests are appreciated!  Please use the same [Contributor License Agreement (CLA)](https://github.com/AnalyticalGraphicsInc/cesium/blob/master/CONTRIBUTING.md) and [Coding Guide](https://github.com/AnalyticalGraphicsInc/cesium/blob/master/Documentation/Contributors/CodingGuide/README.md) used for [Cesium](http://cesiumjs.org/).

---

<p align="center">
<a href="http://cesiumjs.org/"><img src="doc/cesium.png" onerror="this.src='cesium.png'"/></a>
</p>
