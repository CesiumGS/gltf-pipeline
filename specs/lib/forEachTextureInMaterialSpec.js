"use strict";
const forEachTextureInMaterial = require("../../lib/forEachTextureInMaterial");

describe("forEachTextureInMaterial", () => {
  function collectIndices(material) {
    const indices = [];
    forEachTextureInMaterial(material, (index) => {
      indices.push(index);
    });
    return indices;
  }

  it("visits pbrMetallicRoughness textures", () => {
    const material = {
      pbrMetallicRoughness: {
        baseColorTexture: { index: 0 },
        metallicRoughnessTexture: { index: 1 },
      },
    };
    expect(collectIndices(material)).toEqual([0, 1]);
  });

  it("visits top level textures", () => {
    const material = {
      emissiveTexture: { index: 0 },
      normalTexture: { index: 1 },
      occlusionTexture: { index: 2 },
    };
    expect(collectIndices(material)).toEqual([0, 1, 2]);
  });

  it("visits KHR_materials_clearcoat textures", () => {
    const material = {
      extensions: {
        KHR_materials_clearcoat: {
          clearcoatTexture: { index: 0 },
          clearcoatRoughnessTexture: { index: 1 },
          clearcoatNormalTexture: { index: 2 },
        },
      },
    };
    expect(collectIndices(material)).toEqual([0, 1, 2]);
  });

  it("visits KHR_materials_anisotropy texture", () => {
    const material = {
      extensions: {
        KHR_materials_anisotropy: {
          anisotropyTexture: { index: 3 },
        },
      },
    };
    expect(collectIndices(material)).toEqual([3]);
  });

  it("visits KHR_materials_sheen textures", () => {
    const material = {
      extensions: {
        KHR_materials_sheen: {
          sheenColorTexture: { index: 0 },
          sheenRoughnessTexture: { index: 1 },
        },
      },
    };
    expect(collectIndices(material)).toEqual([0, 1]);
  });

  it("visits KHR_materials_iridescence textures", () => {
    const material = {
      extensions: {
        KHR_materials_iridescence: {
          iridescenceTexture: { index: 0 },
          iridescenceThicknessTexture: { index: 1 },
        },
      },
    };
    expect(collectIndices(material)).toEqual([0, 1]);
  });

  it("visits KHR_materials_volume texture", () => {
    const material = {
      extensions: {
        KHR_materials_volume: {
          thicknessTexture: { index: 4 },
        },
      },
    };
    expect(collectIndices(material)).toEqual([4]);
  });

  it("visits KHR_materials_specular and KHR_materials_transmission textures", () => {
    const material = {
      extensions: {
        KHR_materials_specular: {
          specularTexture: { index: 0 },
          specularColorTexture: { index: 1 },
        },
        KHR_materials_transmission: {
          transmissionTexture: { index: 2 },
        },
      },
    };
    expect(collectIndices(material)).toEqual([0, 1, 2]);
  });

  it("returns early when the handler returns a value", () => {
    const material = {
      extensions: {
        KHR_materials_clearcoat: {
          clearcoatTexture: { index: 5 },
          clearcoatRoughnessTexture: { index: 6 },
        },
      },
    };
    const result = forEachTextureInMaterial(material, (index) => index);
    expect(result).toBe(5);
  });
});
