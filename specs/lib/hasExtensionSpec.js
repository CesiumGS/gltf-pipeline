'use strict';
const hasExtension = require('../../lib/hasExtension');

describe('hasExtension', () => {
    it('has extension', () => {
        const gltf = {
            extensionsUsed: [
                'extension1',
                'extension2'
            ]
        };
        expect(hasExtension(gltf, 'extension1')).toBe(true);
        expect(hasExtension(gltf, 'extension2')).toBe(true);
        expect(hasExtension(gltf, 'extension3')).toBe(false);

        const emptyGltf = {};
        expect(hasExtension(emptyGltf, 'extension1')).toBe(false);
    });
});
