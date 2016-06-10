# glTF Pipeline

[![License](https://img.shields.io/:license-apache-blue.svg)](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/blob/master/LICENSE.md)
[![Build Status](https://travis-ci.org/AnalyticalGraphicsInc/gltf-pipeline.svg?branch=master)](https://travis-ci.org/AnalyticalGraphicsInc/gltf-pipeline)
[![Coverage Status](https://coveralls.io/repos/AnalyticalGraphicsInc/gltf-pipeline/badge.svg?branch=master)](https://coveralls.io/r/AnalyticalGraphicsInc/gltf-pipeline?branch=master)

<p align="center">
<a href="https://www.khronos.org/gltf"><img src="doc/gltf.png" /></a>
</p>

Content pipeline tools for optimizing [glTF](https://www.khronos.org/gltf) assets by [Richard Lee](http://leerichard.net/) and the [Cesium team](http://cesiumjs.org/).

See the [roadmap](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/issues/1).

gltf-pipeline can be used as a command-line tool, Node.js module, or JavaScript library.

## Instructions

Clone this repo and install [Node.js](http://nodejs.org/).  From the root directory of this repo, run:
```
npm install
```

Command-line Example:
```
node ./bin/gltf-pipeline.js ./specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf -o output.gltf
```

## Usage

### Using the JavaScript library

Include `build/gltf-pipeline.js` it with a `script` tag.  For a simple example, see [build/index.html](build/index.html).


###Command line flags:

|Flag|Description|Required|
|----|-----------|--------|
|`-i`, `--input`|Path to the input glTF file.| :white_check_mark: Yes|
|`-o`, `--output`|Directory or filename for the exported glTF file.|No|
|`-b`, `--binary`|Write binary glTF file.|No, default `false`|
|`-s`, `--separate`|Writes out separate geometry/animation data files, shader files and textures instead of embedding them in the glTF file.|No, default `false`|
|`-h`, `--help`|Display help|No|
|`-t`, `--separateTexture`|Write out separate textures, but embed geometry/animation data files, and shader files.|No, default `false`|
|`-q`, `--quantize`|Quantize attributes using WEB3D_quantized_attributes extension.|No, default `false`|

## Build Instructions

Run the tests:
```
npm run jasmine
```
To run JSHint on the entire codebase, run:
```
npm run jsHint
```
To run JSHint automatically when a file is saved, run the following and leave it open in a console window:
```
npm run jsHint-watch
```

### Running test coverage

Coverage uses [istanbul](https://github.com/gotwarlost/istanbul).  Run:
```
npm run coverage
```
For complete coverage details, open `coverage/lcov-report/index.html`.

The tests and coverage covers the Node.js module; it does not cover the command-line interface (which is tiny) or the built JavaScript library (which is the same code just ran through browserify).

### Building the JavaScript library

A pre-built unminified `.js` file is in the `build` directory.  This is built with [browserify](http://browserify.org/).  Install it with:
```
npm install -g browserify
```
To rebuild, run:
```
npm run build
```

## Limitations

This tool is still in development. We plan on adding additional features such as AO baking, and other functionality.


## Contributions

Pull requests are appreciated!  Please use the same [Contributor License Agreement (CLA)](https://github.com/AnalyticalGraphicsInc/cesium/blob/master/CONTRIBUTING.md) and [Coding Guide](https://github.com/AnalyticalGraphicsInc/cesium/blob/master/Documentation/Contributors/CodingGuide/README.md) used for [Cesium](http://cesiumjs.org/).

---

Developed by the Cesium team.
<p align="center">
<a href="http://cesiumjs.org/"><img src="doc/cesium.png" /></a>
</p>