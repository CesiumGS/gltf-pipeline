'use strict';
var Cesium = require('cesium');
var Promise = require('bluebird');
var addDefaults = require('./addDefaults');
var addPipelineExtras = require('./addPipelineExtras');
var getStatistics = require('./getStatistics');
var readResources = require('./readResources');
var removeDefaults = require('./removeDefaults');
var removePipelineExtras = require('./removePipelineExtras');
var updateVersion = require('./updateVersion');
var writeResources = require('./writeResources');
var compressDracoMeshes = require('./compressDracoMeshes');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

module.exports = processGltf;

/**
 * Run a glTF through the gltf-pipeline.
 *
 * @param {Object} gltf A javascript object containing a glTF asset. The glTF is modified in place.
 * @param {Object} [options] An object with the following properties:
 * @param {String} [options.resourceDirectory] The path for reading separate resources.
 * @param {String} [options.name] The name of the glTF asset, for writing separate resources.
 * @param {Boolean} [options.separate = false] Write separate buffers, shaders, and textures instead of embedding them in the glTF.
 * @param {Boolean} [options.separateTextures = false] Write out separate textures only.
 * @param {Boolean} [options.checkTransparency = false] Do a more exhaustive check for texture transparency by looking at the alpha channel of each pixel.
 * @param {Boolean} [options.secure = false] Prevent the converter from reading separate resources from outside of the <code>resourceDirectory</code>.
 * @param {Boolean} [options.stats = false] Print statistics to console for input and output glTF files.
 * @param {Object} [options.dracoOptions] Options to pass to the compressDracoMeshes stage. If undefined, stage is not run.
 * @param {Stage[]) [options.customStages] Custom stages to run on the glTF asset.
 * @param {Logger} [options.logger] A callback function for handling logged messages. Defaults to console.log.
 *
 * @returns {Promise} A promise that resolves to the processed glTF and a dictionary containing separate resources.
 */
function processGltf(gltf, options) {
    var defaults = processGltf.defaults;
    options = defaultValue(options, {});
    options.separateBuffers = defaultValue(options.separate, defaults.separate);
    options.separateShaders = defaultValue(options.separate, defaults.separate);
    options.separateTextures = defaultValue(options.separateTextures, defaults.separateTextures) || options.separate;
    options.checkTransparency = defaultValue(options.checkTransparency, defaults.checkTransparency);
    options.secure = defaultValue(options.secure, defaults.secure);
    options.stats = defaultValue(options.stats, defaults.stats);
    options.logger = defaultValue(options.logger, getDefaultLogger());
    options.separateResources = {};
    options.customStages = defaultValue(options.customStages, []);

    var preStages = [
        addPipelineExtras,
        readResources,
        updateVersion,
        addDefaults
    ];

    var postStages = [
        writeResources,
        removePipelineExtras,
        removeDefaults
    ];

    var pipelineStages = getStages(options);
    var stages = preStages.concat(options.customStages, pipelineStages, postStages);

    printStats(gltf, options, false);

    return Promise.each(stages, function(stage) {
        return stage(gltf, options);
    }).then(function() {
        printStats(gltf, options, true);
        return {
            gltf: gltf,
            separateResources: options.separateResources
        };
    });
}

function printStats(gltf, options, processed) {
    if (options.stats) {
        options.logger(processed ? 'Statistics after:' : 'Statistics before:');
        options.logger(getStatistics(gltf).toString());
    }
}

function getStages(options) {
    var stages = [];
    if (defined(options.dracoOptions)) {
        stages.push(compressDracoMeshes);
    }
    return stages;
}

function getDefaultLogger() {
    return function(message) {
        console.log(message);
    };
}

/**
 * Default values that will be used when calling processGltf(options) unless specified in the options object.
 */
processGltf.defaults = {
    /**
     * Gets or sets whether to write out separate buffers, shaders, and textures instead of embedding them in the glTF
     * @type Boolean
     * @default false
     */
    separate: false,
    /**
     * Gets or sets whether to write out separate textures only.
     * @type Boolean
     * @default false
     */
    separateTextures: false,
    /**
     * Gets or sets whether the converter will do a more exhaustive check for texture transparency by looking at the alpha channel of each pixel.
     * @type Boolean
     * @default false
     */
    checkTransparency: false,
    /**
     * Gets or sets whether the source model can reference paths outside of its directory.
     * @type Boolean
     * @default false
     */
    secure: false,
    /**
     * Gets or sets whether to print statistics to console for input and output glTF files.
     * @type Boolean
     * @default false
     */
    stats: false,
    /**
     * Gets or sets whether to compress the meshes using Draco. Adds the KHR_draco_mesh_compression extension.
     * @type Boolean
     * @default false
     */
    compressDracoMeshes: false
};

/**
 * A callback function that logs messages.
 * @callback Logger
 *
 * @param {String} message The message to log.
 */

/**
 * A stage that processes a glTF asset.
 * @callback Stage
 *
 * @param {Object} gltf The glTF asset.
 * @returns {Promise|Object} The glTF asset or a promise that resolves to the glTF asset.
 */
