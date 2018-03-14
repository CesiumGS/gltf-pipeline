'use strict';
var addDefaults = require('../../lib/addDefaults');
var getStatistics = require('../../lib/getStatistics');
var readGltf = require('../../lib/readGltf');

describe('getStatistics', function() {
    it('should return stats for simple box test', function(done){
        expect(readGltf('specs/data/boxTexturedUnoptimized/CesiumTexturedBoxTest.gltf')
            .then(function(gltf) {
                var stats = getStatistics(gltf);

                expect(stats.buffersSizeInBytes).toEqual(840);
                expect(stats.numberOfImages).toEqual(1);
                expect(stats.numberOfExternalRequests).toEqual(4);

                expect(stats.numberOfDrawCalls).toEqual(1);
                expect(stats.numberOfRenderedPrimitives).toEqual(12);

                expect(stats.numberOfNodes).toEqual(4);
                expect(stats.numberOfMeshes).toEqual(1);
                expect(stats.numberOfMaterials).toEqual(1);
                expect(stats.numberOfAnimations).toEqual(0);
            }), done).toResolve();
    });

    it('works with rigged test', function(done) {
        expect(readGltf('specs/data/riggedSimpleUnoptimized/riggedSimple.gltf')
            .then(function(gltf) {
                var stats = getStatistics(addDefaults(gltf));

                expect(stats.buffersSizeInBytes).toEqual(10468);
                expect(stats.numberOfImages).toEqual(0);
                expect(stats.numberOfExternalRequests).toEqual(3);

                expect(stats.numberOfDrawCalls).toEqual(1);
                expect(stats.numberOfRenderedPrimitives).toEqual(188);

                expect(stats.numberOfNodes).toEqual(5);
                expect(stats.numberOfMeshes).toEqual(1);
                expect(stats.numberOfMaterials).toEqual(1);
                expect(stats.numberOfAnimations).toEqual(2);
            }), done).toResolve();
    });
});
