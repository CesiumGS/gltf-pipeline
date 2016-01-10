# glTF Pipeline

[![Build Status](https://travis-ci.org/AnalyticalGraphicsInc/gltf-pipeline.svg?branch=master)](https://travis-ci.org/AnalyticalGraphicsInc/gltf-pipeline)
[![License](https://img.shields.io/:license-apache-blue.svg)](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/blob/master/LICENSE.md)

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

## Using the JavaScript library

Include `build/gltf-pipeline.js` it with a `script` tag.  For a simple example, see [build/index.html](build/index.html).

## Build Instructions

Run the tests:
```
npm run jasmine
```
To run JSHint on the entire codebase, run
```
npm run jsHint
```
To run JSHint automatically when a file is saved, run the following and leave it open in a console window:
```
npm run jsHint-watch
```

### Building the JavaScript library

A pre-built unminified `.js` file is in the `build` directory.  This is built with [browserify](http://browserify.org/).  Install it with:
```
npm install -g browserify
```
To rebuild, from the `gltf-pipeline` root directory, run
```
npm run build
```