Change Log
==========

### 0.1.0-alpha11 - ??
* Optimized `mergeBuffers` to avoid repeated copies, drastically improving performance when there are lots of buffers to merge.
* Fixed a bug in `addPipelineExtras` that made it try to add extras to null objects.
* Expose `triangleAxisAlignedBoundingBoxOverlap`, an implementation of Tomas Akenine-Möller algorithm for determining if a triangle overlaps an axis aligned bounding box.
* Merged [gltf-statistics](https://github.com/AnalyticalGraphicsInc/gltf-statistics) as a stage in the pipeline.

### 0.1.0-alpha10 - 2017-01-10
* Added `tangentsBitangents` generation option
* Added `updateVersion` stage for transitioning assets between glTF version and migrated any glTF 0.8 code out of `addDefaults`

### 0.1.0-alpha9 - 2017-01-03
* Fixed issue with embedding base64 encoded shader strings for assets using the KHR_materials_common extension

### 0.1.0-alpha8 - 2016-12-13
* Fixed issue with embedding base64 encoded shader strings inside the glTF.
* Added `-p` flag for preserving the glTF hierarchy. Optimization stages are not run when this flag is enabled.

### 0.1.0-alpha7 - 2016-12-08
* `modelMaterialsCommon` renamed to `processModelMaterialsCommon`.
* Added `generateModelMaterialsCommon` and command line `kmc` flags for generating models with the `KHR_materials_common` extension.

### 0.1.0-alpha6 - 2016-11-18

* Fixed `combinePrimitives` stage and re-added it to the pipeline. [#108](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/issues/108)
* Expose parsing argument arrays into an options object via `parseArguments`. [#183](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/183)

### 0.1.0-alpha5 - 2016-11-02

* Added `MergeDuplicateProperties` for stages merging duplicate glTF properties, like materials and shaders. [#152](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/152)
  * `mergeDuplicateAccessors` is now a part of this stage.
  * `RemoveUnusedProperties` stage names are changed from `removeUnusedXXX` to `removeXXX`. `MergeDuplicateProperties` conforms to this naming convention.
* `quantizedAttributes` has an optional `normalized` flag to use the glTF 1.0.1 `accessor.normalized` for a higher precision decode matrix. [#165](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/165)
* Fixed an issue where pipeline extras are not removed when running `Pipeline.processJSON` and `Pipeline.processFile`. [#180](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/180)
* Added support for generating hard normals with the `-f` flag and for removing normals with `-r`. [#173](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/173)
* Preserve non-default shader attributes when generating shaders. [#175](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/175)
* The `_3DTILESDIFFUSE` semantic is added to the model's technique when `optimizeForCesium` is true. [#174](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/174)

### 0.1.0-alpha4 - 2016-08-25

* `cacheOptimization` no longer crashes on primitives without indices. [#154](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/issues/154)
* Public API is exposed via `index.js` [#153](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/issues/153)
  * Documentation has been added for all exposed functions.
  * `OptimizationStats` is removed from `removeUnused` stages.
  * `gltfPipeline.js` is now named `Pipeline.js`.
  * `bakeAmbientOcclusion.js` now directly exports the `bakeAmbientOcclusion` function.
  * `bakeAmbientOcclusion` now takes a glTF asset as its first parameter to match the function signature of other stages.
  * All `removeUnused` stages have been consolidated to `RemoveUnusedProperties` to clean up the global scope.
  * `readBufferComponentType` and `writeBufferComponentType` have been renamed to `readBufferComponent` and `writeBufferComponent` respectively.

### 0.1.0-alpha3 - 2016-07-25

* Converted the API to now use promises instead of callbacks. [#135](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/135)

### 0.1.0-alpha2 - 2016-07-21

* Fixed an issue causing some compressed accessors to not render. [#148](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/148)
* Fixed a quantization rounding issue. [#147](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/147)

### 0.1.0-alpha1 - 2016-07-20

* Initial release.
