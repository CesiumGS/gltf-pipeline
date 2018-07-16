'use strict';
var removeExtension = require('../../lib/removeExtension');

describe('removeExtension', function() {
    it('removes extension', function() {
        var gltf = {
            extensionsRequired: [
                'extension1',
                'extension2',
                'extension3'
            ],
            extensionsUsed: [
                'extension1',
                'extension2',
                'extension3'
            ],
            extensions: {
                extension1: {
                    value: 9
                },
                extension2: [0, 1, 2]
            }
        };
        var extension1 = removeExtension(gltf, 'extension1');
        expect(gltf.extensionsRequired).toEqual(['extension2', 'extension3']);
        expect(gltf.extensionsUsed).toEqual(['extension2', 'extension3']);
        expect(gltf.extensions).toEqual({
            extension2: [0, 1, 2]
        });
        expect(extension1).toEqual({
            value: 9
        });

        var extension2 = removeExtension(gltf, 'extension2');
        expect(gltf.extensionsRequired).toEqual(['extension3']);
        expect(gltf.extensionsUsed).toEqual(['extension3']);
        expect(gltf.extensions).toBeUndefined();
        expect(extension2).toEqual([0, 1,2]);

        var extension3 = removeExtension(gltf, 'extension3');
        expect(gltf.extensionsRequired).toBeUndefined();
        expect(gltf.extensionsUsed).toBeUndefined();
        expect(gltf.extensions).toBeUndefined();
        expect(extension3).toBeUndefined();

        var emptyGltf = {};
        removeExtension(gltf, 'extension1');
        expect(emptyGltf).toEqual({});
    });
});
