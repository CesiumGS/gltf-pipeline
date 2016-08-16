Change Log
==========

### Next Release

* cacheOptimization no longer crashes on primitives without indices. [#154](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/issues/154)
* Public API is exposed via index.js [#153](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/issues/153)
  * Documentation has been added for all exposed functions.
  * OptimizationStats is removed from removeUnusedStages.
  * gltfPipeline.js is now named Pipeline.js.
  * bakeAmbientOcclusion.js is now named AmbientOcclusion.js, bakeAmbientOcclusion is accessible via this object.
  * All removeUnusedElement type stages have been consolidated to RemoveUnusedElements to clean up the global scope.

### 0.1.0-alpha3 - 2016-07-25

* Converted the API to now use promises instead of callbacks. [#135](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/135)

### 0.1.0-alpha2 - 2016-07-21

* Fixed an issue causing some compressed accessors to not render. [#148](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/148)
* Fixed a quantization rounding issue. [#147](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/147)

### 0.1.0-alpha1 - 2016-07-20

* Initial release.
