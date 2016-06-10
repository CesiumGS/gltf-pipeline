'use strict';
var fs = require('fs');
var path = require('path');
var Cesium = require('cesium');
var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;

module.exports = runStages;

var dependenciesDirectory = './dependencies';
var cachedFunctions = {};
var cachedConfigurations = {};
var defaultConfig = {
    before: [],
    after: []
};

/**
 * Run a series of pipeline stages resolving their pre-processing and post-processing stages.
 * @param {Object} [gltf] A javascript object holding a glTF hierarchy.
 * @param {Array} [configuration] An array of strings specifying the names of the stages to run.
 * @param {Object} [stageFunctions=undefined] Optional parameter allowing for a global set of cached stage functions
 * @param {Object} [stageConfigurations=undefined] Optional parameter allowing for a global set of cached stage configurations
 *
 * @returns {Array} A history of the series of stages that were run.
 */
function runStages(gltf, stages, stageFunctions, stageConfigurations) {
    if (defined(stageFunctions)) {
        cachedFunctions = stageFunctions;
    }
    if (defined(stageConfigurations)) {
        cachedConfigurations = stageConfigurations;
    }
    var completed = {};
    var post = {
        length : 0
    };
    var history = [];
    if (defined(stages)) {
        var numStages = stages.length;
        // Run the stages
        for (var i = 0; i < numStages; i++) {
            var stage = stages[i];
            if (needToRunStage(stage, completed)) {
                runStage(gltf, stages[i], completed, post, history);
            }
        }
        // Handle post-processing
        while (post.length > 0) {
            for (var postStage in post) {
                if (post.hasOwnProperty(postStage) && postStage !== 'length') {
                    if (needToRunStage(postStage, completed)) {
                        runStage(gltf, postStage, completed, post, history);
                    }
                }
            }
        }
    }
    return history;
}

function runStage(gltf, stage, completed, post, history) {
    var i;
    var preProcessingStages = getPreProcessingStages(stage);
    var numPreProcessingStages = preProcessingStages.length;
    // Run pre-processing stages if they haven't been run
    for (i = 0; i < numPreProcessingStages; i++) {
        var preProcessingStage = preProcessingStages[i];
        if (needToRunStage(preProcessingStage, completed)) {
            runStage(gltf, preProcessingStage, completed, post, history);
        }
    }
    // Run the stage
    getStageFunction(stage)(gltf);
    if (defined(post[stage]) && post[stage]) {
        // Satisfies the post dependency from another stage
        post[stage] = false;
        post.length--;
    }
    history.push(stage);
    completed[stage] = true;
    var postProcessingStages = getPostProcessingStages(stage);
    var numPostProcessingStages = postProcessingStages.length;
    // Add the post-processing stages for later
    for (i = 0; i < numPostProcessingStages; i++) {
        var postProcessingStage = postProcessingStages[i];
        var alreadyAdded = defaultValue(post[postProcessingStage], false);
        if (!alreadyAdded) {
            post[postProcessingStage] = true;
            post.length++;
            // If this stage was run before, it needs to be run again
            completed[postProcessingStage] = false;
        }
    }
}

function needToRunStage(stage, completed) {
    var ran = completed[stage];
    if(!defined(ran)) {
        return true;
    }
    return !ran;
}

function getPreProcessingStages(stage) {
    var config = getStageConfiguration(stage);
    return defaultValue(config.before, []);
}

function getPostProcessingStages(stage) {
    var config = getStageConfiguration(stage);
    return defaultValue(config.after, []);
}

function getStageConfiguration(stage) {
    var config = cachedConfigurations[stage];
    if (!defined(config)) {
        cacheStageConfiguration(stage);
        config = cachedConfigurations[stage];
    }
    return config;
}

function cacheStageConfiguration(stage) {
    var path = path.join(dependenciesDirectory, stage + '.json');
    try {
        var stringData = fs.readFileSync(path, {encoding: 'utf8'});
        var json = JSON.parse(stringData);
        cachedConfigurations[stage] = json;
    } catch (e) {
        cachedConfigurations[stage] = defaultConfig;
    }
}

function getStageFunction(stage) {
    var stageFunction = cachedFunctions[stage];
    if (!defined(stageFunction)) {
        cacheStageFunction(stage);
        stageFunction = cachedFunctions[stage];
    }
    return stageFunction;
}

function cacheStageFunction(stage) {
    var stageFunction = require('./' + stage);
    cachedFunctions[stage] = stageFunction;
}