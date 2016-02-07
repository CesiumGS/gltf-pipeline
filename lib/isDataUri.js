'use strict';

module.exports = isDataUri;

/**
 * @private
 */
 function isDataUri(uri) {
    return /^data\:/i.test(uri);
 }