'use strict';
var fs = require('fs');
var Promise = require('bluebird');
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

    beforeAll(function (done) {
        var names = Object.keys(testDags);
        var promise = Promise.each(names, function (name) {
            testDags[name] = addPipelineExtras(JSON.parse(fs.readFileSync(testDags[name])));
        });
        expect(promise, done).toResolve();
    });

    it('does not duplicate any nodes', function() {
        var dag = testDags.singleNode;
        convertDagToTree(dag);
        removePipelineExtras(dag);

        expect(dag.nodes).toEqual([{
            name: "A"
        }]);
    });

    it('does not duplicate any nodes in the tree', function() {
        var dag = testDags.tree;
        convertDagToTree(dag);
        removePipelineExtras(dag);

        expect(dag.nodes).toEqual([
            {
                children: [1, 2],
                name: 'A'
            },
            {
                name: 'B'
            },
            {
                name: 'C'
            }
        ]);
    });

    it('duplicates one node', function() {
        var dag = testDags.singleDuplicate;
        convertDagToTree(dag);
        removePipelineExtras(dag);

        expect(dag.nodes).toEqual([
            {
                children: [
                    1,
                    2
                ],
                name: 'A'
            }, {
                children: [
                    3
                ],
                name: 'B'
            }, {
                children: [
                    4
                ],
                name: 'C'
            }, {
                name: 'D'
            }, {
                name: 'D'
            }
        ]);
    });

    it('duplicates a subgraph', function() {
        var dag = testDags.subgraphDuplicate;

        convertDagToTree(dag);
        removePipelineExtras(dag);
        
        expect(dag.nodes).toEqual([
            {
                children: [
                    1,
                    2
                ],
                name: 'A'
            }, {
                children: [
                    3
                ],
                name: 'B'
            }, {
                children: [
                    7
                ],
                name: 'C'
            }, {
                children: [
                    4,
                    5
                ],
                name: 'D'
            }, {
                children: [
                    6
                ],
                name: 'E'
            }, {
                children: [
                    12
                ],
                name: 'F'
            }, {
                name: 'G'
            }, {
                children: [
                    8,
                    9
                ],
                name: 'D'
            }, {
                children: [
                    10
                ],
                name: 'E'
            }, {
                children: [
                    11
                ],
                name: 'F'
            }, {
                name: 'G'
            }, {
                name: 'G'
            }, {
                name: 'G'
            }
        ]);
    });

    it('converts a DAG with two roots', function() {
        var dag = testDags.twoRoots;

        convertDagToTree(dag);
        removePipelineExtras(dag);

        expect(dag.nodes).toEqual([
            {
                children: [
                    2
                ],
                name: 'B'
            }, {
                children: [
                    7
                ],
                name: 'C'
            }, {
                children: [
                    3,
                    4
                ],
                name: 'D'
            }, {
                children: [
                    5
                ],
                name: 'E'
            }, {
                children: [
                    6
                ],
                name: 'F'
            }, {
                name: 'G'
            }, {
                name: 'G'
            }, {
                children: [
                    8,
                    9
                ],
                name: 'D'
            }, {
                children: [
                    10
                ],
                name: 'E'
            }, {
                children: [
                    11
                ],
                name: 'F'
            }, {
                name: 'G'
            }, {
                name: 'G'
            }
        ]);
    });
});
