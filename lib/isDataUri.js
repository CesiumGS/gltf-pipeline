'use strict';

module.exports = isDataUri;

/**
 * @private
 */
 function isDataUri(uri) {
    //Return true if the uri is a data uri
    return /^data\:/i.test(uri);
 }