'use strict';
var runStages = require('../../lib/runStages');

var stage1 = function() {};
var stage2 = function() {};
var stage3 = function() {};
var stage4 = function() {};
var stageFunctions = {
    stage1 : stage1,
    stage2 : stage2,
    stage3 : stage3,
    stage4 : stage4
};

describe('runStages', function() {
    it('runs stages with no dependencies', function() {
        var stageConfigurations = {
            stage1 : {},
            stage2 : {},
            stage3 : {}
        };
        var stages = ['stage1', 'stage2', 'stage3'];
        var history = runStages(undefined, stages, stageFunctions, stageConfigurations);
        expect(history.length).toEqual(3);
        expect(history).toEqual(['stage1', 'stage2', 'stage3']);
    });

    it('resolves pre-processing stage', function() {
        var stageConfigurations = {
            stage1 : {},
            stage2 : {},
            stage3 : {
                before : ['stage1']
            }
        };
        var stages = ['stage2', 'stage3'];
        var history = runStages(undefined, stages, stageFunctions, stageConfigurations);
        expect(history.length).toEqual(3);
        expect(history).toEqual(['stage2', 'stage1', 'stage3']);
    });

    it('resolves post-processing stage', function() {
        var stageConfigurations = {
            stage1 : {},
            stage2 : {},
            stage3 : {
                after : ['stage1']
            }
        };
        var stages = ['stage2', 'stage3'];
        var history = runStages(undefined, stages, stageFunctions, stageConfigurations);
        expect(history.length).toEqual(3);
        expect(history).toEqual(['stage2', 'stage3', 'stage1']);
    });

    it('ignores duplicate pre-processing stage', function() {
        var stageConfigurations = {
            stage1 : {},
            stage2 : {
                before : ['stage1']
            },
            stage3 : {
                before : ['stage1']
            }
        };
        var stages = ['stage2', 'stage3'];
        var history = runStages(undefined, stages, stageFunctions, stageConfigurations);
        expect(history.length).toEqual(3);
        expect(history).toEqual(['stage1', 'stage2', 'stage3']);
    });

    it('ignores duplicate post-processing stage', function() {
        var stageConfigurations = {
            stage1 : {},
            stage2 : {
                after : ['stage1']
            },
            stage3 : {
                after : ['stage1']
            }
        };
        var stages = ['stage2', 'stage3'];
        var history = runStages(undefined, stages, stageFunctions, stageConfigurations);
        expect(history.length).toEqual(3);
        expect(history).toEqual(['stage2', 'stage3', 'stage1']);
    });

    it('resolved nested pre-processing stages', function() {
        var stageConfigurations = {
            stage1 : {
                before : ['stage2']
            },
            stage2 : {
                before : ['stage3']
            },
            stage3 : {
                after : []
            }
        };
        var stages = ['stage1'];
        var history = runStages(undefined, stages, stageFunctions, stageConfigurations);
        expect(history.length).toEqual(3);
        expect(history).toEqual(['stage3', 'stage2', 'stage1']);
    });

    it('resolves nested post-processing stages', function() {
        var stageConfigurations = {
            stage1 : {
                after : ['stage2']
            },
            stage2 : {
                after : ['stage3']
            },
            stage3 : {
                after : []
            }
        };
        var stages = ['stage1'];
        var history = runStages(undefined, stages, stageFunctions, stageConfigurations);
        expect(history.length).toEqual(3);
        expect(history).toEqual(['stage1', 'stage2', 'stage3']);
    });
});