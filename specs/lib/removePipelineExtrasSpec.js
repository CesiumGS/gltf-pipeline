"use strict";
const Cesium = require("@propelleraero/cesium");
const addPipelineExtras = require("../../lib/addPipelineExtras");
const removePipelineExtras = require("../../lib/removePipelineExtras");

const WebGLConstants = Cesium.WebGLConstants;

describe("removePipelineExtras", () => {
  it("removes pipeline extras", () => {
    const gltf = {
      buffers: [
        {
          byteLength: 100,
        },
      ],
      extensions: {
        KHR_techniques_webgl: {
          shaders: [
            {
              type: WebGLConstants.VERTEX_SHADER,
              uri: "data:,",
            },
          ],
        },
      },
    };
    const gltfWithExtrasRemoved = removePipelineExtras(addPipelineExtras(gltf));
    expect(gltfWithExtrasRemoved.buffers[0].extras).toBeUndefined();
    expect(
      gltfWithExtrasRemoved.extensions.KHR_techniques_webgl.shaders[0].extras
    ).toBeUndefined();
  });
});
