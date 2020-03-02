Change Log
==========

### 1.0.7 - 2020-03-02
* Fixed a bug where primitives with different types of attributes where being assigned the same material when converting KHR_materials_common to shaders and techniques.

### 1.0.6 - 2018-08-14
* Fixed `UNSIGNED_SHORT` overflow when generating face normals.

### 1.0.5 - 2018-07-13
* Fixed a bug where percent-encoded characters (like %20) were not decoded before attempting to read a uri.

### 1.0.4 - 2018-05-30
* Fixed a bug where multiple inclusions of the same mime type lead to conflicts.

### 1.0.3 - 2018-03-28
* Fixed a bug where animations in glTF 0.8 assets where not being converted from axis angle to quaternion.
* Fixed a bug where generating normals and materials did not take image transparency into account

### 1.0.2 - 2017-09-27
* Fixed specular computation for certain models using the `KHR_materials_common` extension. [#309](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/309)
* Added a `optimizeDrawCalls` flag to merge nodes and meshes more aggressively to minimize draw calls. [#308](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/308)
* Added minimum lighting to diffuse when the `cesium` flag is enabled. [#313](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/313)
* Added a check for normals arrtibute for mesh in `modelMaterialsCommon`. [#318](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/318)
* Fixed generating duplicate accessors in `cesiumGeometryToGltfPrimitive`. [#321](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/321)

### 1.0.1 - 2017-07-07
* Fix `gltf-pipeline` to work with Cesium 1.36 and newer.

### 1.0.0 - 2017-07-07
* Fixed issue where shader comparison in `MergeDuplicateProperties` would cause a crash. [#297](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/297)
* Fixed an issue where `mergeBuffers` would not align buffer views to 4-byte boundaries. [#298](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/298)
* Fixed an issue where face normal generation would crash for degenerate triangles. [#298](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/298)

### 0.1.0-alpha15 - 2017-06-06
* Fixed the `removeNormals` stage so that it can operate independently of `generateNormals`. [#287](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/287)
* Fixed an issue with writing attributes with double underscores, which is reserved in GLSL. [#286](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/286)
* Fixed issue with transparent diffuse texture overriding the render state of other materials. [#284](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/284)
* Fixed crash when loading a model with a huge number of textures. [#283](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/283)

### 0.1.0-alpha14 - 2017-05-09
* Fixed byte offset alignment issue when loading converted models in Cesium. [#279](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/279)
* Added case-insensitive regex checking for image extensions. [#278](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/278)
* Added `mergeVertices` option to merge duplicate vertices. This operation is now disabled by default. [#276](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/276)

### 0.1.0-alpha13 - 2017-04-27
* Fixed a bug in `processModelMaterialsCommon` that produced out-of-spec technique states. [#269](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/269)

### 0.1.0-alpha12 - 2017-04-13
* Fixed issue with ambient occlusion not working correctly with other stages. [#267](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/267)
* Fixed handling of binary glTF with special characters. [#253](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/253)

### 0.1.0-alpha11 - 2017-03-07
* Added `compressTextures` stage to compress input textures to a variety of compressed texture formats.
* Optimized `mergeBuffers` to avoid repeated copies, drastically improving performance when there are lots of buffers to merge.
* Fixed a bug in `addPipelineExtras` that made it try to add extras to null objects.
* Expose `triangleAxisAlignedBoundingBoxOverlap`, an implementation of Tomas Akenine-Möller algorithm for determining if a triangle overlaps an axis aligned bounding box.
* Merged [gltf-statistics](https://github.com/AnalyticalGraphicsInc/gltf-statistics) as a stage in the pipeline.
* Added `updateVersion` stage for patching glTF `0.8` -> `1.0` changes; `addDefaults` no longer calls `processModelMaterialsCommon`. [#223](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/223)
* Added `build-cesium-combined` command to gulp file for generating simple files for other projects. [#231](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/231).
* Change Cesium `Geometry`'s and `VertexFormat`'s `binormal` attribute to bitangent.
* Fixed a bug in `combinePrimitives` where combining primitives can overflow uint16 for the resulting indices. [#230](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/issues/230)
* Made `generateNormals` stage optional and added `smoothNormals` option for generating smooth normals if the model does not have normals. [#240](https://github.com/AnalyticalGraphicsInc/gltf-pipeline/pull/240)

### 0.1.0-alpha10 - 2017-01-10
* Added `tangentsBitangents` generation option

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
