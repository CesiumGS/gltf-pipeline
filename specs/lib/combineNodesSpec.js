'use strict';
var fs = require('fs');
var clone = require('clone');
var addPipelineExtras = require('../../lib/addPipelineExtras');
var loadGltfUris = require('../../lib/loadGltfUris');
var combineNodes = require('../../lib/combineNodes');
var writeGltf = require('../../lib/writeGltf');
var entireTreePath = './specs/data/combineObjects/combineNodesEntireTree.gltf';
var animatedRootPath = './specs/data/combineObjects/combineNodesAnimatedRoot.gltf';
var twoSubtreesPath = './specs/data/combineObjects/combineNodesTwoSubtrees.gltf';
var separateAncestorsPath = './specs/data/combineObjects/combineNodesSeparateAncestors.gltf';

describe('combineNodes', function() {
    var entireTree, animatedRoot, twoSubtrees, separateAncestors;

    beforeAll(function(done) {
        fs.readFile(entireTreePath, function(err, data) {
            entireTree = JSON.parse(data);
            addPipelineExtras(entireTree);
            loadGltfUris(entireTree);

            fs.readFile(animatedRootPath, function(err, data) {
                animatedRoot = JSON.parse(data);
                addPipelineExtras(animatedRoot);
                loadGltfUris(animatedRoot);

                fs.readFile(twoSubtreesPath, function(err, data) {
                    twoSubtrees = JSON.parse(data);
                    addPipelineExtras(twoSubtrees);
                    loadGltfUris(twoSubtrees);

                    fs.readFile(separateAncestorsPath, function(err, data) {
                        separateAncestors = JSON.parse(data);
                        addPipelineExtras(separateAncestors);
                        loadGltfUris(separateAncestors);

                        done();
                    });
                });
            });
        });
    });

    it('combines an entire tree with no animated nodes', function(done) {
        var entireTreeCopy = clone(entireTree);
        combineNodes(entireTreeCopy, false);
        writeGltf(entireTreeCopy, './combinedOutputEntireTree.gltf', true, true, function() {
            expect(Object.keys(entireTreeCopy.nodes).length).toEqual(1);
            expect(entireTreeCopy.nodes.node_3).toBeDefined();
            expect(entireTreeCopy.nodes.node_3.children).toEqual([]);
            expect(entireTreeCopy.nodes.node_3.meshes).toEqual(["Geometry-mesh002", "Geometry-mesh002_0"]);
            expect(entireTreeCopy.nodes.node_3.matrix).toEqual([1,0,0,0,0,0,-1,0,0,1,0,0,0,0,0,1]);

            expect(entireTreeCopy.meshes['Geometry-mesh002_0']).toBeDefined();
            expect(entireTreeCopy.accessors['Geometry-mesh002_POSITION_accessor_0']).toBeDefined();
            expect(entireTreeCopy.bufferViews['Geometry-mesh002_POSITION_bufferView_0']).toBeDefined();
            expect(entireTreeCopy.buffers['Geometry-mesh002_POSITION_buffer_0']).toBeDefined();
            done();
        });
    });

    it('preserves a node with a camera', function(done) {
        var entireTreeCopy = clone(entireTree);
        combineNodes(entireTreeCopy, true);
        writeGltf(entireTreeCopy, './combinedOutputEntireTreeCamera.gltf', true, true, function() {
            expect(Object.keys(entireTreeCopy.nodes).length).toEqual(2);
            expect(entireTreeCopy.nodes.node_3).toBeDefined();
            expect(entireTreeCopy.nodes['Geometry-mesh002Node_0']).toBeDefined();
            expect(entireTreeCopy.nodes.node_3.children).toEqual(['Geometry-mesh002Node_0']);
            expect(entireTreeCopy.nodes.node_3.meshes).toEqual(["Geometry-mesh002_0"]);
            expect(entireTreeCopy.nodes.node_3.matrix).toEqual([1,0,0,0,0,0,-1,0,0,1,0,0,0,0,0,1]);

            done();
        });
    });

    it('combines a tree with an animated root', function(done) {
        combineNodes(animatedRoot, false);
        writeGltf(animatedRoot, './combinedOutputAnimatedRoot.gltf', true, true, function() {
            expect(Object.keys(animatedRoot.nodes).length).toEqual(5);
            expect(animatedRoot.nodes['Geometry-mesh020Node']).toBeDefined();
            expect(animatedRoot.nodes['Geometry-mesh020Node_1']).not.toBeDefined();
            expect(animatedRoot.nodes['Geometry-mesh020Node_2']).not.toBeDefined();
            expect(animatedRoot.nodes['Geometry-mesh020Node_3']).not.toBeDefined();
            expect(animatedRoot.nodes['Geometry-mesh020Node_4']).not.toBeDefined();
            expect(animatedRoot.nodes['Geometry-mesh020Node'].children).toEqual([]);
            expect(animatedRoot.nodes['Geometry-mesh020Node'].meshes).toEqual([
                "Geometry-mesh020",
                "Geometry-mesh020_0",
                "Geometry-mesh020_1",
                "Geometry-mesh020_2",
                "Geometry-mesh020_3"
            ]);

            done();
        });
    });

    it('combines two separate animated subtrees', function(done) {
        combineNodes(twoSubtrees, false);
        writeGltf(twoSubtrees, './combinedOutputTwoSubtrees.gltf', true, true, function() {
            expect(Object.keys(twoSubtrees.nodes).length).toEqual(6);
            expect(twoSubtrees.nodes['Geometry-mesh019Node'].children).toEqual([
                "Geometry-mesh020Node_rotation",
                "Geometry-mesh020Node_translation"
            ]);
            expect(twoSubtrees.nodes['Geometry-mesh020Node_rotation']).toBeDefined();
            expect(twoSubtrees.nodes['Geometry-mesh020Node_translation']).toBeDefined();

            expect(twoSubtrees.nodes['Geometry-mesh020Node_rotation'].children).toEqual([]);
            expect(twoSubtrees.nodes['Geometry-mesh020Node_rotation'].meshes).toEqual([
                "Geometry-mesh020",
                "Geometry-mesh020_0",
                "Geometry-mesh020_1"
            ]);
            expect(twoSubtrees.nodes['Geometry-mesh020Node_translation'].children).toEqual([]);
            expect(twoSubtrees.nodes['Geometry-mesh020Node_translation'].meshes).toEqual([
                "Geometry-mesh020",
                "Geometry-mesh020_2",
                "Geometry-mesh020_3"
            ]);

            done();
        });
    });

    it('does not combine the ancestors of the animated node', function(done) {
        combineNodes(separateAncestors, false);
        writeGltf(separateAncestors, './combinedOutputSeparateAncestors.gltf', true, true, function() {
            expect(Object.keys(separateAncestors.nodes).length).toEqual(6);
            expect(separateAncestors.nodes['Geometry-mesh019Node']).toBeDefined();
            expect(separateAncestors.nodes.rootChild).not.toBeDefined();
            expect(separateAncestors.nodes.ancestor).toBeDefined();
            expect(separateAncestors.nodes.ancestorChild).not.toBeDefined();
            expect(separateAncestors.nodes['Geometry-mesh020Node']).toBeDefined();

            expect(separateAncestors.nodes['Geometry-mesh019Node'].children).toEqual(['ancestor']);
            expect(separateAncestors.nodes['Geometry-mesh019Node'].meshes).toEqual([
                "Geometry-mesh019",
                "Geometry-mesh019_0"
            ]);

            expect(separateAncestors.nodes.ancestor.children).toEqual(['Geometry-mesh020Node']);
            expect(separateAncestors.nodes.ancestor.meshes).toEqual(["Geometry-mesh019"]);
            done();
        });
    });
});