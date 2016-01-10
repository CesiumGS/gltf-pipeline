(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.gltfPipeline = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports = {
	removeUnusedImages : require('./lib/removeUnusedImages'),
    OptimizationStatistics : require('./lib/OptimizationStatistics')
};
},{"./lib/OptimizationStatistics":2,"./lib/removeUnusedImages":4}],2:[function(require,module,exports){
(function (process){
'use strict';

module.exports = OptimizationStatistics;

function OptimizationStatistics() {
    this.numberOfImagesRemoved = 0;
}

OptimizationStatistics.prototype.print = function(stats) {
    process.stdout.write('Images removed: ' + this.numberOfImagesRemoved);
};
}).call(this,require('_process'))
},{"_process":5}],3:[function(require,module,exports){
'use strict';

module.exports = definedNotNull;

function definedNotNull(value) {
    return (value !== undefined) && (value !== null);
}
},{}],4:[function(require,module,exports){
'use strict';
var definedNotNull = require('./definedNotNull');

module.exports = removeUnusedImages;

function removeUnusedImages(gltf, stats) {
    var usedImageIds = {};
    var textures = gltf.textures;

    // Build hash of used images by iterating through textures
    if (definedNotNull(textures)) {
        for (var textureId in textures) {
            if (textures.hasOwnProperty(textureId)) {
                var id = textures[textureId].source;
                usedImageIds[id] = true;
            }
        }
    }

    // Iterate through images and remove those that are not in the hash
    var numberOfImagesRemoved = 0;
    var images = gltf.images;
    if (definedNotNull(images)) {
        var usedImages = {};

        for (var imageId in images) {
            if (images.hasOwnProperty(imageId)) {
                // If this image is in the hash, then keep it in the glTF asset
                if (definedNotNull(usedImageIds[imageId])) {
                    usedImages[imageId] = images[imageId];
                } else {
                    ++numberOfImagesRemoved;
                }
            }
        }

        if (definedNotNull(stats)) {
            stats.numberOfImagesRemoved += numberOfImagesRemoved;
        }

        gltf.images = usedImages;
    }

// TODO: remove orphan uris

    return gltf;
}
},{"./definedNotNull":3}],5:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[1])(1)
});