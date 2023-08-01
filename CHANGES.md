# Change Log

### 4.1.0 - 2023-04-21

- Add `baseColorTextureNames` and `baseColorFactorNames` to the options that can be given at the command line and passed to `processGltf` and `updateVersion`, to specify the uniform names in a `KHR_techniques_webgl` extension that indicate that a certain texture or color should be used as the base color texture or base color factor of a PBR material. [#637](https://github.com/CesiumGS/gltf-pipeline/pull/637)
- Fixed handling of glTF models with the [`CESIUM_primitive_outline`](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/CESIUM_primitive_outline/README.md) extension. [#632](https://github.com/CesiumGS/gltf-pipeline/pull/631)

### 4.0.2 - 2023-02-10

- Update npm module dependencies.

### 4.0.1 - 2023-01-25

- Fixed crash when writing GLB files above 2GB. [#627](https://github.com/CesiumGS/gltf-pipeline/pull/627)

### 4.0.0 - 2022-08-01

- Breaking changes
  - glTF 1.0 or glTF 2.0 with the `KHR_techniques_webgl`, `KHR_blend`, or `KHR_materials_common` extensions will be converted to glTF 2.0 with PBR materials by default. For the previous behavior pass in `--keepLegacyExtensions`.

### 3.0.5 - 2022-06-30

- Fixed handling of glTF models with the [`EXT_mesh_features`](https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features) and [`EXT_structural_metadata`](https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata) extensions.

### 3.0.4 - 2021-08-02

- Fixed buffer view alignment for `EXT_feature_metadata` extension. [#595](https://github.com/CesiumGS/gltf-pipeline/pull/595)

### 3.0.3 - 2021-07-24

- Fixed name of `KHR_materials_pbrSpecularGlossiness` extension in `addDefaults`. [#580](https://github.com/CesiumGS/gltf-pipeline/pull/580)
- Fixed glTF 1.0 to 2.0 conversion for buffers containing a placeholder data uri. [#578](https://github.com/CesiumGS/gltf-pipeline/pull/578)
- Fixed handling of glTF models with the [`EXT_meshopt_compression`](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_meshopt_compression) extension. [#593](https://github.com/CesiumGS/gltf-pipeline/pull/593)
- Fixed handling of glTF models with the [`EXT_feature_metadata`](https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata) extension. [#585](https://github.com/CesiumGS/gltf-pipeline/pull/585)

### 3.0.2 - 2020-12-07

- Added support for Draco 1.4.0. [#562](https://github.com/CesiumGS/gltf-pipeline/pull/562)

### 3.0.1 - 2020-11-14

- Locked Draco npm dependency to version 1.3.6 to avoid module initialization errors in 1.4.0. [#563](https://github.com/CesiumGS/gltf-pipeline/pull/563)

### 3.0.0 - 2020-07-22

- Breaking changes
  - Dropped support for CRN and KTX textures. [#550](https://github.com/CesiumGS/gltf-pipeline/pull/550)
  - Dropped support for `image.extras.compressedImage3DTiles`. [#550](https://github.com/CesiumGS/gltf-pipeline/pull/550)
- Added support for KTX2 textures. [#550](https://github.com/CesiumGS/gltf-pipeline/pull/550)

### 2.1.10 - 2020-05-11

- Improved accessor min/max for Draco attributes. [#540](https://github.com/CesiumGS/gltf-pipeline/pull/540)
- Updated to new Draco encode settings. [#538](https://github.com/CesiumGS/gltf-pipeline/pull/538)
- Fixed a bug where accessors used by `EXT_mesh_gpu_instancing` were being removed. [#535](https://github.com/CesiumGS/gltf-pipeline/pull/535)

### 2.1.9 - 2020-03-31

- Fixed a bug where unused nodes with used descendants would get deleted. [#533](https://github.com/CesiumGS/gltf-pipeline/pull/533)
- Fixed processing glTF 1.0 models that have multiple techniques with the same uniform name but different parameters. [#490](https://github.com/CesiumGS/gltf-pipeline/pull/490)
- Fixed writing duplicate resource that are referenced multiple times. [#483](https://github.com/CesiumGS/gltf-pipeline/pull/483)

### 2.1.8 - 2020-03-04

- Fixed a bug in `processGltf` and `gltfToGlb` where the user's `options` object was getting modified with internal options. [#528](https://github.com/CesiumGS/gltf-pipeline/pull/528)

### 2.1.7 - 2020-03-02

- Removed usage of deprecated function `Cesium.isArray`. [#526](https://github.com/CesiumGS/gltf-pipeline/pull/526)

### 2.1.6 - 2020-02-04

- Fixed a mistake in the 2.1.5 release where the changes from [#516](https://github.com/CesiumGS/gltf-pipeline/pull/516) were accidentally removed.

### 2.1.5 - 2020-02-04

- Added removal of unused textures, samplers, and images. [#516](https://github.com/CesiumGS/gltf-pipeline/pull/516)

### 2.1.4 - 2019-10-04

- Added removal of unused materials, nodes and meshes. [#465](https://github.com/CesiumGS/gltf-pipeline/pull/465)
- Added `keepUnusedElements` flag to keep unused materials, nodes and meshes. [#465](https://github.com/CesiumGS/gltf-pipeline/pull/465)

### 2.1.3 - 2019-03-21

- Fixed a crash when saving separate resources that would exceed the Node buffer size limit. [#468](https://github.com/CesiumGS/gltf-pipeline/pull/468)

### 2.1.2 - 2019-03-14

- Fixed reading absolute uris. [#466](https://github.com/CesiumGS/gltf-pipeline/pull/466)

### 2.1.1 - 2019-02-11

- Added ability to apply Draco compression to meshes without indices. [#424](https://github.com/CesiumGS/gltf-pipeline/pull/424)

### 2.1.0 - 2019-01-28

- Fixed a bug where nodes containing extensions or extras where being removed in the glTF 1.0 to 2.0 upgrade stage. [#431](https://github.com/CesiumGS/gltf-pipeline/pull/431)
- Added support for the `EXT_texture_webp` extension. [#450](https://github.com/CesiumGS/gltf-pipeline/pull/450)

### 2.0.1 - 2018-09-19

- Fixed a bug where the buffer `byteOffset` was not set properly when updating 1.0 accessor types to 2.0 allowed values. [#418](https://github.com/CesiumGS/gltf-pipeline/pull/418)
- Fixed a bug where bufferViews were not properly byte aligned when updating accessors from 1.0 to 2.0. [#421](https://github.com/CesiumGS/gltf-pipeline/pull/421)
- Fixed a bug in `removePipelineExtras` when run in the browser. [#422](https://github.com/CesiumGS/gltf-pipeline/pull/422)

### 2.0.0 - 2018-08-14

- Breaking changes
  - Project updated to process glTF 2.0 models. Any glTF 1.0 models will be upgraded to glTF 2.0 automatically and use the `KHR_techniques_webgl` and `KHR_blend` extensions.
  - The entire public API has changed. See usage examples in the project README.
  - Removed many pipeline stages in an effort to simplify the project:
    - Removed ambient occlusion baking.
    - Removed texture compression.
    - Removed support for the `KHR_materials_common` extension.
    - Removed support for the `WEB3D_quantized_attributes` extension.
    - Removed optimization stages.
    - Removed generate normals stages.
- Added support for `KHR_draco_mesh_compression`.

### 1.0.6 - 2018-08-14

- Fixed `UNSIGNED_SHORT` overflow when generating face normals.

### 1.0.5 - 2018-07-13

- Fixed a bug where percent-encoded characters (like %20) were not decoded before attempting to read a uri.

### 1.0.4 - 2018-05-30

- Fixed a bug where multiple inclusions of the same mime type lead to conflicts.

### 1.0.3 - 2018-03-28

- Fixed a bug where animations in glTF 0.8 assets where not being converted from axis angle to quaternion.
- Fixed a bug where generating normals and materials did not take image transparency into account

### 1.0.2 - 2017-09-27

- Fixed specular computation for certain models using the `KHR_materials_common` extension. [#309](https://github.com/CesiumGS/gltf-pipeline/pull/309)
- Added a `optimizeDrawCalls` flag to merge nodes and meshes more aggressively to minimize draw calls. [#308](https://github.com/CesiumGS/gltf-pipeline/pull/308)
- Added minimum lighting to diffuse when the `cesium` flag is enabled. [#313](https://github.com/CesiumGS/gltf-pipeline/pull/313)
- Added a check for normals arrtibute for mesh in `modelMaterialsCommon`. [#318](https://github.com/CesiumGS/gltf-pipeline/pull/318)
- Fixed generating duplicate accessors in `cesiumGeometryToGltfPrimitive`. [#321](https://github.com/CesiumGS/gltf-pipeline/pull/321)

### 1.0.1 - 2017-07-07

- Fix `gltf-pipeline` to work with CesiumJS 1.36 and newer.

### 1.0.0 - 2017-07-07

- Fixed issue where shader comparison in `MergeDuplicateProperties` would cause a crash. [#297](https://github.com/CesiumGS/gltf-pipeline/pull/297)
- Fixed an issue where `mergeBuffers` would not align buffer views to 4-byte boundaries. [#298](https://github.com/CesiumGS/gltf-pipeline/pull/298)
- Fixed an issue where face normal generation would crash for degenerate triangles. [#298](https://github.com/CesiumGS/gltf-pipeline/pull/298)

### 0.1.0-alpha15 - 2017-06-06

- Fixed the `removeNormals` stage so that it can operate independently of `generateNormals`. [#287](https://github.com/CesiumGS/gltf-pipeline/pull/287)
- Fixed an issue with writing attributes with double underscores, which is reserved in GLSL. [#286](https://github.com/CesiumGS/gltf-pipeline/pull/286)
- Fixed issue with transparent diffuse texture overriding the render state of other materials. [#284](https://github.com/CesiumGS/gltf-pipeline/pull/284)
- Fixed crash when loading a model with a huge number of textures. [#283](https://github.com/CesiumGS/gltf-pipeline/pull/283)

### 0.1.0-alpha14 - 2017-05-09

- Fixed byte offset alignment issue when loading converted models in CesiumJS. [#279](https://github.com/CesiumGS/gltf-pipeline/pull/279)
- Added case-insensitive regex checking for image extensions. [#278](https://github.com/CesiumGS/gltf-pipeline/pull/278)
- Added `mergeVertices` option to merge duplicate vertices. This operation is now disabled by default. [#276](https://github.com/CesiumGS/gltf-pipeline/pull/276)

### 0.1.0-alpha13 - 2017-04-27

- Fixed a bug in `processModelMaterialsCommon` that produced out-of-spec technique states. [#269](https://github.com/CesiumGS/gltf-pipeline/pull/269)

### 0.1.0-alpha12 - 2017-04-13

- Fixed issue with ambient occlusion not working correctly with other stages. [#267](https://github.com/CesiumGS/gltf-pipeline/pull/267)
- Fixed handling of binary glTF with special characters. [#253](https://github.com/CesiumGS/gltf-pipeline/pull/253)

### 0.1.0-alpha11 - 2017-03-07

- Added `compressTextures` stage to compress input textures to a variety of compressed texture formats.
- Optimized `mergeBuffers` to avoid repeated copies, drastically improving performance when there are lots of buffers to merge.
- Fixed a bug in `addPipelineExtras` that made it try to add extras to null objects.
- Expose `triangleAxisAlignedBoundingBoxOverlap`, an implementation of Tomas Akenine-Möller algorithm for determining if a triangle overlaps an axis aligned bounding box.
- Merged [gltf-statistics](https://github.com/CesiumGS/gltf-statistics) as a stage in the pipeline.
- Added `updateVersion` stage for patching glTF `0.8` -> `1.0` changes; `addDefaults` no longer calls `processModelMaterialsCommon`. [#223](https://github.com/CesiumGS/gltf-pipeline/pull/223)
- Added `build-cesium-combined` command to gulp file for generating simple files for other projects. [#231](https://github.com/CesiumGS/gltf-pipeline/pull/231).
- Change CesiumJS `Geometry`'s and `VertexFormat`'s `binormal` attribute to bitangent.
- Fixed a bug in `combinePrimitives` where combining primitives can overflow uint16 for the resulting indices. [#230](https://github.com/CesiumGS/gltf-pipeline/issues/230)
- Made `generateNormals` stage optional and added `smoothNormals` option for generating smooth normals if the model does not have normals. [#240](https://github.com/CesiumGS/gltf-pipeline/pull/240)
- `updateVersion` stage for upgrades the glTF version of an asset from `1.0` to `2.0`. [#223](https://github.com/CesiumGS/gltf-pipeline/pull/223)
  - All pipeline stages now operate on glTF `2.0` assets.

### 0.1.0-alpha10 - 2017-01-10

- Added `tangentsBitangents` generation option

### 0.1.0-alpha9 - 2017-01-03

- Fixed issue with embedding base64 encoded shader strings for assets using the KHR_materials_common extension

### 0.1.0-alpha8 - 2016-12-13

- Fixed issue with embedding base64 encoded shader strings inside the glTF.
- Added `-p` flag for preserving the glTF hierarchy. Optimization stages are not run when this flag is enabled.

### 0.1.0-alpha7 - 2016-12-08

- `modelMaterialsCommon` renamed to `processModelMaterialsCommon`.
- Added `generateModelMaterialsCommon` and command line `kmc` flags for generating models with the `KHR_materials_common` extension.

### 0.1.0-alpha6 - 2016-11-18

- Fixed `combinePrimitives` stage and re-added it to the pipeline. [#108](https://github.com/CesiumGS/gltf-pipeline/issues/108)
- Expose parsing argument arrays into an options object via `parseArguments`. [#183](https://github.com/CesiumGS/gltf-pipeline/pull/183)

### 0.1.0-alpha5 - 2016-11-02

- Added `MergeDuplicateProperties` for stages merging duplicate glTF properties, like materials and shaders. [#152](https://github.com/CesiumGS/gltf-pipeline/pull/152)
  - `mergeDuplicateAccessors` is now a part of this stage.
  - `RemoveUnusedProperties` stage names are changed from `removeUnusedXXX` to `removeXXX`. `MergeDuplicateProperties` conforms to this naming convention.
- `quantizedAttributes` has an optional `normalized` flag to use the glTF 1.0.1 `accessor.normalized` for a higher precision decode matrix. [#165](https://github.com/CesiumGS/gltf-pipeline/pull/165)
- Fixed an issue where pipeline extras are not removed when running `Pipeline.processJSON` and `Pipeline.processFile`. [#180](https://github.com/CesiumGS/gltf-pipeline/pull/180)
- Added support for generating hard normals with the `-f` flag and for removing normals with `-r`. [#173](https://github.com/CesiumGS/gltf-pipeline/pull/173)
- Preserve non-default shader attributes when generating shaders. [#175](https://github.com/CesiumGS/gltf-pipeline/pull/175)
- The `_3DTILESDIFFUSE` semantic is added to the model's technique when `optimizeForCesium` is true. [#174](https://github.com/CesiumGS/gltf-pipeline/pull/174)

### 0.1.0-alpha4 - 2016-08-25

- `cacheOptimization` no longer crashes on primitives without indices. [#154](https://github.com/CesiumGS/gltf-pipeline/issues/154)
- Public API is exposed via `index.js` [#153](https://github.com/CesiumGS/gltf-pipeline/issues/153)
  - Documentation has been added for all exposed functions.
  - `OptimizationStats` is removed from `removeUnused` stages.
  - `gltfPipeline.js` is now named `Pipeline.js`.
  - `bakeAmbientOcclusion.js` now directly exports the `bakeAmbientOcclusion` function.
  - `bakeAmbientOcclusion` now takes a glTF asset as its first parameter to match the function signature of other stages.
  - All `removeUnused` stages have been consolidated to `RemoveUnusedProperties` to clean up the global scope.
  - `readBufferComponentType` and `writeBufferComponentType` have been renamed to `readBufferComponent` and `writeBufferComponent` respectively.

### 0.1.0-alpha3 - 2016-07-25

- Converted the API to now use promises instead of callbacks. [#135](https://github.com/CesiumGS/gltf-pipeline/pull/135)

### 0.1.0-alpha2 - 2016-07-21

- Fixed an issue causing some compressed accessors to not render. [#148](https://github.com/CesiumGS/gltf-pipeline/pull/148)
- Fixed a quantization rounding issue. [#147](https://github.com/CesiumGS/gltf-pipeline/pull/147)

### 0.1.0-alpha1 - 2016-07-20

- Initial release.
