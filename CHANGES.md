Change Log
==========

### Next Release

* Added `MergeDuplicateProperties` for stages merging duplicate glTF properties, like materials and shaders. [#152](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/152)
  * `mergeDuplicateAccessors` is now a part of this stage.
  * `RemoveUnusedProperties` stage names are changed from `removeUnusedXXX` to `removeXXX`. `MergeDuplicateProperties` conforms to this naming convention.
* `quantizedAttributes` has an optional `normalized` flag to use the glTF 1.0.1 `accessor.normalized` for a higher precision decode matrix.
* Added support for generating hard normals with the `-f` flag and for removing normals with `-r`. [#173](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/173)
* Preserve non-default shader attributes when generating shaders. [#175](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/175)

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
