'use strict';
var os = require('os');
var path = require('path');
var uuid = require('uuid');

module.exports = getTempDirectory;

/**
 * @private
 */
function getTempDirectory() {
    var tempDirectory = os.tmpdir();
    var randomId = uuid.v4();
    return path.join(tempDirectory, randomId);
}
