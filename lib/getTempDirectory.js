'use strict';
const os = require('os');
const path = require('path');
const uuid = require('uuid');

module.exports = getTempDirectory;

/**
 * @private
 */
function getTempDirectory() {
    const tempDirectory = os.tmpdir();
    const randomId = uuid.v4();
    return path.join(tempDirectory, randomId);
}
