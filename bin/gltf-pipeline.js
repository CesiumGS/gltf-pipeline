#!/usr/bin/env node
"use strict";
const Cesium = require("cesium");
const fsExtra = require("fs-extra");
const path = require("path");
const Promise = require("bluebird");
const yargs = require("yargs");
const compressDracoMeshes = require("../lib/compressDracoMeshes");
const glbToGltf = require("../lib/glbToGltf");
const gltfToGlb = require("../lib/gltfToGlb");
const processGlb = require("../lib/processGlb");
const processGltf = require("../lib/processGltf");

const defaultValue = Cesium.defaultValue;
const defined = Cesium.defined;

const defaults = processGltf.defaults;
const dracoDefaults = compressDracoMeshes.defaults;

const args = process.argv;

const argv = yargs
  .usage("Usage: node $0 -i inputPath -o outputPath")
  .example("node $0 -i model.gltf")
  .example("node $0 -i model.gltf -b")
  .example("node $0 -i model.glb -o model.gltf")
  .help("h")
  .alias("h", "help")
  .options({
    input: {
      alias: "i",
      describe: "Path to the glTF or glb file.",
      type: "string",
      normalize: true,
      demandOption: true,
    },
    output: {
      alias: "o",
      describe:
        "Output path of the glTF or glb file. Separate resources will be saved to the same directory.",
      type: "string",
      normalize: true,
    },
    binary: {
      alias: "b",
      describe: "Convert the input glTF to glb.",
      type: "boolean",
      default: false,
    },
    json: {
      alias: "j",
      describe: "Convert the input glb to glTF.",
      type: "boolean",
      default: false,
    },
    separate: {
      alias: "s",
      describe:
        "Write separate buffers, shaders, and textures instead of embedding them in the glTF.",
      type: "boolean",
      default: defaults.separate,
    },
    separateTextures: {
      alias: "t",
      describe: "Write out separate textures only.",
      type: "boolean",
      default: defaults.separateTextures,
    },
    stats: {
      describe: "Print statistics to console for output glTF file.",
      type: "boolean",
      default: defaults.stats,
    },
    keepUnusedElements: {
      describe: "Keep unused materials, nodes and meshes.",
      type: "boolean",
      default: defaults.keepUnusedElements,
    },
    keepLegacyExtensions: {
      describe:
        "When false, materials with KHR_techniques_webgl, KHR_blend, or KHR_materials_common will be converted to PBR.",
      type: "boolean",
      default: defaults.keepLegacyExtensions,
    },
    "draco.compressMeshes": {
      alias: "d",
      describe:
        "Compress the meshes using Draco. Adds the KHR_draco_mesh_compression extension.",
      type: "boolean",
      default: defaults.compressDracoMeshes,
    },
    "draco.compressionLevel": {
      describe:
        "Draco compression level [0-10], most is 10, least is 0. A value of 0 will apply sequential encoding and preserve face order.",
      type: "number",
      default: dracoDefaults.compressionLevel,
    },
    "draco.quantizePositionBits": {
      describe:
        "Quantization bits for position attribute when using Draco compression.",
      type: "number",
      default: dracoDefaults.quantizePositionBits,
    },
    "draco.quantizeNormalBits": {
      describe:
        "Quantization bits for normal attribute when using Draco compression.",
      type: "number",
      default: dracoDefaults.quantizeNormalBits,
    },
    "draco.quantizeTexcoordBits": {
      describe:
        "Quantization bits for texture coordinate attribute when using Draco compression.",
      type: "number",
      default: dracoDefaults.quantizeTexcoordBits,
    },
    "draco.quantizeColorBits": {
      describe:
        "Quantization bits for color attribute when using Draco compression.",
      type: "number",
      default: dracoDefaults.quantizeColorBits,
    },
    "draco.quantizeGenericBits": {
      describe:
        "Quantization bits for skinning attribute (joint indices and joint weights) ad custom attributes when using Draco compression.",
      type: "number",
      default: dracoDefaults.quantizeGenericBits,
    },
    "draco.uncompressedFallback": {
      describe: "Adds uncompressed fallback versions of the compressed meshes.",
      type: "boolean",
      default: dracoDefaults.uncompressedFallback,
    },
    "draco.unifiedQuantization": {
      describe:
        "Quantize positions of all primitives using the same quantization grid defined by the unified bounding box of all primitives. If this option is not set, quantization is applied on each primitive separately which can result in gaps appearing between different primitives.",
      type: "boolean",
      default: dracoDefaults.unifiedQuantization,
    },
    baseColorTextureNames: {
      describe:
        "Names of uniforms that should be considered to refer to base color textures when updating from the KHR_techniques_webgl extension to PBR materials.",
      type: "array",
    },
    baseColorFactorNames: {
      describe:
        "Names of uniforms that should be considered to refer to base color factors when updating from the KHR_techniques_webgl extension to PBR materials.",
      type: "array",
    },
  })
  .parse(args);

const inputPath = argv.input;
let outputPath = argv.output;

const inputDirectory = path.dirname(inputPath);
const inputName = path.basename(inputPath, path.extname(inputPath));
const inputExtension = path.extname(inputPath).toLowerCase();
if (inputExtension !== ".gltf" && inputExtension !== ".glb") {
  console.log(`Error: unrecognized file extension "${inputExtension}".`);
  return;
}

let outputExtension;
if (!defined(outputPath)) {
  if (argv.binary) {
    outputExtension = ".glb";
  } else if (argv.json) {
    outputExtension = ".gltf";
  } else {
    outputExtension = inputExtension;
  }
  outputPath = path.join(
    inputDirectory,
    `${inputName}-processed${outputExtension}`
  );
}

const outputDirectory = path.dirname(outputPath);
const outputName = path.basename(outputPath, path.extname(outputPath));
outputExtension = path.extname(outputPath).toLowerCase();
if (outputExtension !== ".gltf" && outputExtension !== ".glb") {
  console.log(`Error: unrecognized file extension "${outputExtension}".`);
  return;
}

let i;
let dracoOptions;
const length = args.length;
for (i = 0; i < length; ++i) {
  const arg = args[i];
  if (arg.indexOf("--draco.") === 0 || arg === "-d") {
    dracoOptions = defaultValue(argv.draco, {});
  }
}

const options = {
  resourceDirectory: inputDirectory,
  separate: argv.separate,
  separateTextures: argv.separateTextures,
  stats: argv.stats,
  keepUnusedElements: argv.keepUnusedElements,
  keepLegacyExtensions: argv.keepLegacyExtensions,
  name: outputName,
  dracoOptions: dracoOptions,
  baseColorTextureNames: argv.baseColorTextureNames,
  baseColorFactorNames: argv.baseColorFactorNames,
};

const inputIsBinary = inputExtension === ".glb";
const outputIsBinary = outputExtension === ".glb";

const jsonOptions = {
  spaces: 2,
};

const read = inputIsBinary ? fsExtra.readFile : fsExtra.readJson;
const write = outputIsBinary ? fsExtra.outputFile : fsExtra.outputJson;
const writeOptions = outputIsBinary ? undefined : jsonOptions;
const run = inputIsBinary
  ? outputIsBinary
    ? processGlb
    : glbToGltf
  : outputIsBinary
  ? gltfToGlb
  : processGltf;

function saveSeparateResources(separateResources) {
  const resourcePromises = [];
  for (const relativePath in separateResources) {
    if (Object.prototype.hasOwnProperty.call(separateResources, relativePath)) {
      const resource = separateResources[relativePath];
      const resourcePath = path.join(outputDirectory, relativePath);
      resourcePromises.push(fsExtra.outputFile(resourcePath, resource));
    }
  }
  return resourcePromises;
}

console.time("Total");

read(inputPath)
  .then(function (gltf) {
    return run(gltf, options);
  })
  .then(function (results) {
    const gltf = defaultValue(results.gltf, results.glb);
    const separateResources = results.separateResources;
    return Promise.all([
      write(outputPath, gltf, writeOptions),
      saveSeparateResources(separateResources),
    ]);
  })
  .then(function () {
    console.timeEnd("Total");
  })
  .catch(function (error) {
    console.log(error);
    process.exit(1);
  });
