'use strict';
var fs = require('fs');
var async = require('async');
var convertDagToTree = require('../../lib/convertDagToTree');
var addPipelineExtras = require('../../lib/addPipelineExtras');
var removePipelineExtras = require('../../lib/removePipelineExtras');
var singleNodePath = './specs/data/dagToTree/DagTestSingleNode.gltf';
var treePath = './specs/data/dagToTree/DagTestTree.gltf';
var singleDuplicatePath = './specs/data/dagToTree/DagTestSingleDuplicate.gltf';
var subgraphDuplicatePath = './specs/data/dagToTree/DagTestSubgraphDuplicate.gltf';
var twoRootsPath = './specs/data/dagToTree/DagTestTwoRoots.gltf';

describe('convertDagToTree', function() {
    var testDags = {
        singleNode: singleNodePath,
        tree: treePath,
        singleDuplicate: singleDuplicatePath,
        subgraphDuplicate: subgraphDuplicatePath,
        twoRoots: twoRootsPath
    };

    beforeAll(function(done) {
        async.each(Object.keys(testDags), function(name, callback) {
            fs.readFile(testDags[name], function(err, data) {
                if (err) {
                    callback(err);
                }
                else {
                    testDags[name] = addPipelineExtras(JSON.parse(data));
                    callback();
                }
            });
        }, function(err) {
            if (err) {
                throw err;
            }

            done();
        });
    });

    it('does not duplicate any nodes', function() {
        var dag = testDags.singleNode;
        convertDagToTree(dag);
        removePipelineExtras(dag);

        expect(dag.nodes).toEqual({
            "A": {}
        });
    });

    it('does not duplicate any nodes in the tree', function() {
        var dag = testDags.tree;
        convertDagToTree(dag);
        removePipelineExtras(dag);

        expect(dag.nodes).toEqual({
            "A": { "children": ["B", "C"] },
            "B": {},
            "C": {}
        });
    });

    it('duplicates one node', function() {
        var dag = testDags.singleDuplicate;
        convertDagToTree(dag);
        removePipelineExtras(dag);

        expect(dag.nodes.D_1).toBeDefined();
        expect(dag.nodes.A.children).toEqual(["B", "C"]);
        expect(dag.nodes.B.children).toEqual(["D"]);
        expect(dag.nodes.C.children).toEqual(["D_1"]);
        expect(dag.nodes.D.children).not.toBeDefined();
    });

    it('duplicates a subgraph', function() {
        var dag = testDags.subgraphDuplicate;

        convertDagToTree(dag);
        removePipelineExtras(dag);

        expect(dag.nodes.D_1).toBeDefined();
        expect(dag.nodes.E_1).toBeDefined();
        expect(dag.nodes.F_1).toBeDefined();
        expect(dag.nodes.G_1).toBeDefined();
        expect(dag.nodes.G_2).toBeDefined();
        expect(dag.nodes.G_3).toBeDefined();

        expect(dag.nodes.A.children).toEqual(["B", "C"]);
        expect(dag.nodes.B.children).toEqual(["D"]);
        expect(dag.nodes.C.children).toEqual(["D_1"]);
        expect(dag.nodes.D.children).toEqual(["E", "F"]);
        expect(dag.nodes.D_1.children).toEqual(["E_1", "F_1"]);
        expect(dag.nodes.E.children).toEqual(["G"]);
        expect(dag.nodes.F.children).toEqual(["G_2"]);
        expect(dag.nodes.E_1.children).toEqual(["G_1"]);
        expect(dag.nodes.F_1.children).toEqual(["G_3"]);
    });

    it('converts a DAG with two roots', function() {
        var dag = testDags.twoRoots;

        convertDagToTree(dag);
        removePipelineExtras(dag);

        expect(dag.nodes.D_1).toBeDefined();
        expect(dag.nodes.E_1).toBeDefined();
        expect(dag.nodes.F_1).toBeDefined();
        expect(dag.nodes.G_1).toBeDefined();
        expect(dag.nodes.G_2).toBeDefined();
        expect(dag.nodes.G_3).toBeDefined();

        expect(dag.nodes.B.children).toEqual(["D"]);
        expect(dag.nodes.C.children).toEqual(["D_1"]);
        expect(dag.nodes.D.children).toEqual(["E", "F"]);
        expect(dag.nodes.D_1.children).toEqual(["E_1", "F_1"]);
        expect(dag.nodes.E.children).toEqual(["G"]);
        expect(dag.nodes.F.children).toEqual(["G_1"]);
        expect(dag.nodes.E_1.children).toEqual(["G_2"]);
        expect(dag.nodes.F_1.children).toEqual(["G_3"]);
    });
});