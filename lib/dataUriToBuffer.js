"use strict";
module.exports = dataUriToBuffer;

/**
 * Read a data uri string into a buffer.
 *
 * @param {String} dataUri The data uri.
 * @returns {Buffer}
 *
 * @private
 */
function dataUriToBuffer(dataUri) {
  const data = dataUri.slice(dataUri.indexOf(",") + 1);
  if (dataUri.indexOf("base64") >= 0) {
    return Buffer.from(data, "base64");
  }
  return Buffer.from(data, "utf8");
}
