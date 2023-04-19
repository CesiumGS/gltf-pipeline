# glTF Pipeline

[![License](https://img.shields.io/:license-apache-blue.svg)](https://github.com/CesiumGS/gltf-pipeline/blob/main/LICENSE.md)
[![Build Status](https://travis-ci.org/CesiumGS/gltf-pipeline.svg?branch=main)](https://travis-ci.org/CesiumGS/gltf-pipeline)

<p align="center">
<a href="https://www.khronos.org/gltf"><img src="doc/gltf.png" onerror="this.src='gltf.png'"/></a>
</p>

Content pipeline tools for optimizing [glTF](https://www.khronos.org/gltf) assets by [Richard Lee](http://leerichard.net/) and the [Cesium team](https://cesium.com/).

Supports common operations including:

- Converting glTF to glb (and reverse)
- Saving buffers/textures as embedded or separate files
- Converting glTF 1.0 models to glTF 2.0
- Applying [Draco](https://github.com/google/draco) mesh compression

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
const gltfPipeline = require("gltf-pipeline");
const fsExtra = require("fs-extra");
const gltfToGlb = gltfPipeline.gltfToGlb;
const gltf = fsExtra.readJsonSync("./input/model.gltf");
const options = { resourceDirectory: "./input/" };
gltfToGlb(gltf, options).then(function (results) {
  fsExtra.writeFileSync("model.glb", results.glb);
});
```

#### Converting a glb to embedded glTF

```javascript
const gltfPipeline = require("gltf-pipeline");
const fsExtra = require("fs-extra");
const glbToGltf = gltfPipeline.glbToGltf;
const glb = fsExtra.readFileSync("model.glb");
glbToGltf(glb).then(function (results) {
  fsExtra.writeJsonSync("model.gltf", results.gltf);
});
```

#### Converting a glTF to Draco glTF

```javascript
const gltfPipeline = require("gltf-pipeline");
const fsExtra = require("fs-extra");
const processGltf = gltfPipeline.processGltf;
const gltf = fsExtra.readJsonSync("model.gltf");
const options = {
  dracoOptions: {
    compressionLevel: 10,
  },
};
processGltf(gltf, options).then(function (results) {
  fsExtra.writeJsonSync("model-draco.gltf", results.gltf);
});
```

#### Saving separate textures

```javascript
const gltfPipeline = require("gltf-pipeline");
const fsExtra = require("fs-extra");
const processGltf = gltfPipeline.processGltf;
const gltf = fsExtra.readJsonSync("model.gltf");
const options = {
  separateTextures: true,
};
processGltf(gltf, options).then(function (results) {
  fsExtra.writeJsonSync("model-separate.gltf", results.gltf);
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

| Flag                           | Description                                                                                                                                                  | Required                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| `--help`, `-h`                 | Display help                                                                                                                                                 | No                                        |
| `--input`, `-i`                | Path to the glTF or glb file.                                                                                                                                | :white_check_mark: Yes                    |
| `--output`, `-o`               | Output path of the glTF or glb file. Separate resources will be saved to the same directory.                                                                 | No                                        |
| `--binary`, `-b`               | Convert the input glTF to glb.                                                                                                                               | No, default `false`                       |
| `--json`, `-j`                 | Convert the input glb to glTF.                                                                                                                               | No, default `false`                       |
| `--separate`, `-s`             | Write separate buffers, shaders, and textures instead of embedding them in the glTF.                                                                         | No, default `false`                       |
| `--separateTextures`, `-t`     | Write out separate textures only.                                                                                                                            | No, default `false`                       |
| `--stats`                      | Print statistics to console for output glTF file.                                                                                                            | No, default `false`                       |
| `--keepUnusedElements`         | Keep unused materials, nodes and meshes.                                                                                                                     | No, default `false`                       |
| `--keepLegacyExtensions`       | When false, materials with `KHR_techniques_webgl`, `KHR_blend`, or `KHR_materials_common` will be converted to PBR.                                          | No, default `false`                       |
| `--draco.compressMeshes`, `-d` | Compress the meshes using Draco. Adds the `KHR_draco_mesh_compression` extension.                                                                            | No, default `false`                       |
| `--draco.compressionLevel`     | Draco compression level [0-10], most is 10, least is 0. A value of 0 will apply sequential encoding and preserve face order.                                 | No, default `7`                           |
| `--draco.quantizePositionBits` | Quantization bits for position attribute when using Draco compression.                                                                                       | No, default `11`                          |
| `--draco.quantizeNormalBits`   | Quantization bits for normal attribute when using Draco compression.                                                                                         | No, default `8`                           |
| `--draco.quantizeTexcoordBits` | Quantization bits for texture coordinate attribute when using Draco compression.                                                                             | No, default `10`                          |
| `--draco.quantizeColorBits`    | Quantization bits for color attribute when using Draco compression.                                                                                          | No, default `8`                           |
| `--draco.quantizeGenericBits`  | Quantization bits for skinning attribute (joint indices and joint weights) and custom attributes when using Draco compression.                               | No, default `8`                           |
| `--draco.unifiedQuantization`  | Quantize positions of all primitives using the same quantization grid. If not set, quantization is applied separately.                                       | No, default `false`                       |
| `--draco.uncompressedFallback` | Adds uncompressed fallback versions of the compressed meshes.                                                                                                | No, default `false`                       |
| `--baseColorTextureNames`      | Names of uniforms that should be considered to refer to base color textures <br /> when updating from the `KHR_techniques_webgl` extension to PBR materials. | No. (The defaults are not specified here) |
| `--baseColorFactorNames`       | Names of uniforms that should be considered to refer to base color factors <br /> when updating from the `KHR_techniques_webgl` extension to PBR materials.  | No. (The defaults are not specified here) |

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

### Building for CesiumJS integration

Some functionality of gltf-pipeline is used by CesiumJS as a third party library. The necessary files can be generated using:

```
npm run build-cesium
```

This will output a portion of the gltf-pipeline code into the `dist/cesium` folder for use with CesiumJS in the browser. Copy the files into `Source/Scene/GltfPipeline/` in the [`cesium`](https://github.com/CesiumGS/cesium) repository and submit a pull request.

### Running Test Coverage

Coverage uses [nyc](https://github.com/istanbuljs/nyc). Run:

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

Pull requests are appreciated! Please use the same [Contributor License Agreement (CLA)](https://github.com/CesiumGS/cesium/blob/main/CONTRIBUTING.md) and [Coding Guide](https://github.com/CesiumGS/cesium/blob/main/Documentation/Contributors/CodingGuide/README.md) used for [Cesium](https://github.com/CesiumGS/cesium).
