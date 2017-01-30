'use strict';
var DependencyGraph = require('../../lib/DependencyGraph');

describe('DependencyGraph', function() {
    var nodes = [];
    var dg = new DependencyGraph();

    beforeAll(function(done) {
        var node0 = {
            name : 'node0',
            runBefore : [],
            runImmediatelyBefore : [],
            runImmediatelyAfter : [],
            runAfter : []
        };

        var node1 = {
            name : 'node1',
            runBefore : ['node0'],
            runImmediatelyBefore : [],
            runImmediatelyAfter : [],
            runAfter : ['node3']
        };

        var node2 = {
            name : 'node2',
            runBefore : ['node1'],
            runImmediatelyBefore : ['node4'],
            runImmediatelyAfter : ['node5'],
            runAfter : []
        };

        var node3 = {
            name : 'node3',
            runBefore : ['node5', 'node0'],
            runImmediatelyBefore : [],
            runImmediatelyAfter : [],
            runAfter : ['node4']
        };

        var node4 = {
            name : 'node4',
            runBefore : [],
            runImmediatelyBefore : [],
            runImmediatelyAfter : [],
            runAfter : []
        };

        var node5 = {
            name : 'node5',
            runBefore : [],
            runImmediatelyBefore : ['node0', 'node1'],
            runImmediatelyAfter : [],
            runAfter : []
        };

        dg.addNode(node0);
        dg.addNode(node1);
        dg.addNode(node2);
        dg.addNode(node3);
        dg.addNode(node4);
        dg.addNode(node5);

        done();
    });

    it('should return for simple pipeline', function(){
        var options = {
            dryRun: true
        };

        var pipelineBeforeFinish = ['node0', 'node1', 'node4', 'node2', 'node0', 'node1', 'node5'];
        var pipelineAfterFinish = ['node0', 'node1', 'node4', 'node2', 'node0', 'node1', 'node5', 'node3', 'node4'];

        dg.runStage(dg.nodes.node2, undefined, options);
        expect(dg.pipeline).toEqual(pipelineBeforeFinish);

        dg.finish(undefined, options);
        expect(dg.pipeline).toEqual(pipelineAfterFinish);
    });
});
