'use strict';
const fsExtra = require('fs-extra');
const gltfToGlb = require('../../lib/gltfToGlb');

const gltfPath = 'specs/data/2.0/box-textured-embedded/box-textured-embedded.gltf';

describe('gltfToGlb', () => {
    it('gltfToGlb', async() => {
        spyOn(console, 'log');
        const gltf = fsExtra.readJsonSync(gltfPath);
        const options = {
            separateTextures: true,
            stats: true
        };
        const results = await gltfToGlb(gltf, options);
        const glb = results.glb;
        const separateResources = results.separateResources;
        expect(Buffer.isBuffer(glb)).toBe(true);
        expect(Object.keys(separateResources).length).toBe(1);
        expect(console.log).toHaveBeenCalled();

        // Header + JSON header + JSON content + binary header + binary content
        const glbLength = glb.readUInt32LE(8);
        const jsonChunkLength = glb.readUInt32LE(12);
        const binaryChunkLength = glb.readUInt32LE(12 + 8 + jsonChunkLength);
        const expectedLength = 12 + 8 + jsonChunkLength + 8 + binaryChunkLength;
        expect(glbLength).toBe(expectedLength);
        expect(glb.length).toBe(expectedLength);
    });

    it('gltfToGlb with separate resources', async () => {
        spyOn(console, 'log');
        const gltf = fsExtra.readJsonSync(gltfPath);
        const options = {
            separate: true,
            stats: true
        };
        const results = await gltfToGlb(gltf, options);
        const glb = results.glb;
        const separateResources = results.separateResources;
        expect(Buffer.isBuffer(glb)).toBe(true);
        expect(Object.keys(separateResources).length).toBe(2);
        expect(console.log).toHaveBeenCalled();

        // Header + JSON header + JSON content. No binary header or content.
        const glbLength = glb.readUInt32LE(8);
        const jsonChunkLength = glb.readUInt32LE(12);
        const expectedLength = 12 + 8 + jsonChunkLength;
        expect(glbLength).toBe(expectedLength);
        expect(glb.length).toBe(expectedLength);
    });
});
