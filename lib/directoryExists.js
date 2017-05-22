'use strict';
var fsExtra = require('fs-extra');

module.exports = directoryExists;

/**
 * @private
 */
function directoryExists(directory) {
    return fsExtra.stat(directory)
        .then(function(stats) {
            return stats.isDirectory();
        })
        .catch(function(err) {
            // If the directory doesn't exist the error code is ENOENT.
            // Otherwise something else went wrong - permission issues, etc.
            if (err.code !== 'ENOENT') {
                throw err;
            }
            return false;
        });
}
