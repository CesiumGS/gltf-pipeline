'use strict';
var hasExtension = require('../../lib/hasExtension');

describe('hasExtension', function() {
    it('has extension', function() {
        var gltf = {
            extensionsUsed : [
                'extension1',
                'extension2'
            ]
        };
        expect(hasExtension(gltf, 'extension1')).toBe(true);
        expect(hasExtension(gltf, 'extension2')).toBe(true);
        expect(hasExtension(gltf, 'extension3')).toBe(false);

        var emptyGltf = {};
        expect(hasExtension(emptyGltf, 'extension1')).toBe(false);
    });
});
