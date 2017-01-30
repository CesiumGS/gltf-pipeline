'use strict';
var Cesium = require('cesium');

var defined = Cesium.defined;
var defaultValue = Cesium.defaultValue;
var DeveloperError = Cesium.DeveloperError;

module.exports = DependencyGraph;

/**
 * A node for pipeline stage.
 *
 * @property {String} name Stores the stage function name.
 * @property {Array} runBefore Stages that need to run at least once before this stage.
 * @property {Array} runImmediatelyBefore Stages that need to run exactly before this stage, irrespective of whether they have run before or not.
 * @property {Array} runImmediatelyAfter Stages that need to run exactly after this stage, irrespective of whether they have run before or not.
 * @property {Array} runAfter Stages that need to run at least once after this stage.
 * @property {Boolean} hasRun True if this stage has run at least once.
 * @property {Boolean} needsToRun True if this stage needs to run at least once in the future.
 *
 * @constructor
 *
 * @see DependencyGraph
 */
function DependencyGraphNode() {
    this.name = '';
    this.runBefore = [];
    this.runImmediatelyBefore = [];
    this.runImmediatelyAfter = [];
    this.runAfter = [];

    // replace with enum this.state = [neverRun, hasRun, needsToRun]?
    this.hasRun = false;
    this.needsToRun = false;
}

/**
 * A dependency graph to run the required stages.
 *
 * @property {Object} nodes An object mapping node names to DependencyGraphNodes.
 * @property {Array} pipeline Stores the order of execution in an array of node names.
 *
 * @constructor
 *
 * @see DependencyGraphNode
 */
function DependencyGraph() {
    this.nodes = {};

    this.pipeline = [];
}

/**
 * Add a node to the dependency graph which can then be invoked later using runStage().
 *
 * @property {Object} node A stage node to add to the dependency graph.
 *
 * @constructor
 *
 * @see DependencyGraphNode
 * @see DependencyGraph.runStage
 */
DependencyGraph.prototype.addNode = function(node) {
    var newNode = new DependencyGraphNode();

    newNode.name = node.name;
    newNode.runBefore = node.runBefore;
    newNode.runImmediatelyBefore = node.runImmediatelyBefore;
    newNode.runImmediatelyAfter = node.runImmediatelyAfter;
    newNode.runAfter = node.runAfter;

    newNode.hasRun = false;
    newNode.needsToRun = false;

    // Add newNode to nodes
    this.nodes[newNode.name] = newNode;
};

DependencyGraph.prototype.runStage = function(node, gltf, options) {

    if(!defined(node)) {
        throw new DeveloperError('node has not been defined');
    }

    if(!this.nodes.hasOwnProperty(node.name)) {
        throw new DeveloperError('node has not been added to Dependency Graph');
    }

    var currentNode = node;
    var nodeName;
    var i;

    // runBefore: Stages that need to be run before the current stage
    for(i = 0; i < currentNode.runBefore.length; ++i) {
        nodeName = currentNode.runBefore[i];
        if (!this.nodes[nodeName].hasRun || this.nodes[nodeName].needsToRun) {
            this.runStage(this.nodes[nodeName], gltf, options);
        }
    }

    // runImmediatelyBefore: Stages that should run immediately before the current stage
    for(i = 0; i < currentNode.runImmediatelyBefore.length; ++i) {
        nodeName = currentNode.runImmediatelyBefore[i];
        this.runStage(this.nodes[nodeName], gltf, options);
    }

    // Now run this stage
    if(!defined(options.dryRun)) {
        // TODO figure out how to call the function
        // The function is of the form 'currentNode.name' + '.run'
        // On a browser it can be run using window, but this is not available in node.js
        // "Bad" option is to use a giant switch case
        console.log('Stage to execute : ' + currentNode.name);  // Here to avoid jsHint Warning
    }
    this.pipeline.push(currentNode.name);
    currentNode.needsToRun = false;
    currentNode.hasRun = true;

    // runImmediatelyAfter: Stages that should be run immediately after the current stage
    for(i = 0; i < currentNode.runImmediatelyAfter.length; ++i) {
        nodeName = currentNode.runImmediatelyAfter[i];
        this.runStage(this.nodes[nodeName], gltf, options);
    }

    // runAfter: Stages that need to be run after the current stage - Just set needsToRun = true
    // Any stage with a needsToRun can only be evaluated by:
    // * A runBefore or runImmediatelyBefore or runImmediatelyAfter call
    // * An explicit call to that stage
    // * End of the pipeline (finish()) -> Which makes an explicit call to that stage
    for(i = 0; i < currentNode.runAfter.length; ++i) {
        nodeName = currentNode.runAfter[i];
        if(options.finishRunAfter) { // This option is needed for finish(). We do not want runAfter calls making other needsToRun options during finish
            this.runStage(this.nodes[nodeName], gltf, options);
        } else {
            this.nodes[nodeName].needsToRun = true;
        }
    }
};

DependencyGraph.prototype.finish = function(gltf, options) {
    // Add options.finishRunAfter to execute all other runAfters calls by runAfters currently in pipeline
    options = defaultValue(options, {});
    options.finishRunAfter = true;

    var nodeName;
    for(var i in this.nodes) {
        if(this.nodes.hasOwnProperty(i)) {
            nodeName = this.nodes[i].name;
            if (this.nodes[nodeName].needsToRun) {
                this.runStage(this.nodes[nodeName], gltf, options);
            }
        }
    }
};
