"use strict";

const { Check, RuntimeError } = require("cesium");
const os = require("os");
const path = require("path");
const { domainToUnicode, URL } = require("url");

module.exports = {
  fileURLToPath: fileURLToPath,
  pathToFileURL: pathToFileURL,
};

const isWindows = os.platform() === "win32";
const forwardSlashRegEx = /\//g;

const CHAR_LOWERCASE_A = 97;
const CHAR_LOWERCASE_Z = 122;
const CHAR_FORWARD_SLASH = 47;
const CHAR_BACKWARD_SLASH = 92;

const percentRegEx = /%/g;
const backslashRegEx = /\\/g;
const newlineRegEx = /\n/g;
const carriageReturnRegEx = /\r/g;
const tabRegEx = /\t/g;

// The following function is copied from Node.js implementation of url module
// https://github.com/nodejs/node/blob/7237eaa3353aacf284289c8b59b0a5e0fa5744bb/lib/internal/url.js#L1345-L1383
// pathToFileURL & fileURLToPath were added in 10.12 so we want to maintain ability run under older versions.
function fileURLToPath(path) {
  Check.defined("path", path);

  if (typeof path === "string") {
    path = new URL(path);
  }

  if (path.protocol !== "file:") {
    throw new RuntimeError("Expected path.protocol to start with file:");
  }
  return isWindows ? getPathFromURLWin32(path) : getPathFromURLPosix(path);
}

function pathToFileURL(filepath) {
  let resolved = path.resolve(filepath);
  // path.resolve strips trailing slashes so we must add them back
  const filePathLast = filepath.charCodeAt(filepath.length - 1);
  if (
    (filePathLast === CHAR_FORWARD_SLASH ||
      (isWindows && filePathLast === CHAR_BACKWARD_SLASH)) &&
    resolved[resolved.length - 1] !== path.sep
  ) {
    resolved += "/";
  }
  const outURL = new URL("file://");
  if (resolved.includes("%")) {
    resolved = resolved.replace(percentRegEx, "%25");
  }
  // in posix, "/" is a valid character in paths
  if (!isWindows && resolved.includes("\\")) {
    resolved = resolved.replace(backslashRegEx, "%5C");
  }
  if (resolved.includes("\n")) {
    resolved = resolved.replace(newlineRegEx, "%0A");
  }
  if (resolved.includes("\r")) {
    resolved = resolved.replace(carriageReturnRegEx, "%0D");
  }
  if (resolved.includes("\t")) {
    resolved = resolved.replace(tabRegEx, "%09");
  }
  outURL.pathname = resolved;
  return outURL;
}

function getPathFromURLWin32(url) {
  const hostname = url.hostname;
  let pathname = url.pathname;
  for (let n = 0; n < pathname.length; n++) {
    if (pathname[n] === "%") {
      const third = pathname.codePointAt(n + 2) | 0x20;
      if (
        (pathname[n + 1] === "2" && third === 102) || // 2f 2F /
        (pathname[n + 1] === "5" && third === 99)
      ) {
        // 5c 5C \
        throw new RuntimeError(
          "file URL must not include encoded \\ or / characters"
        );
      }
    }
  }
  pathname = pathname.replace(forwardSlashRegEx, "\\");
  pathname = decodeURIComponent(pathname);
  if (hostname !== "") {
    // If hostname is set, then we have a UNC path
    // Pass the hostname through domainToUnicode just in case
    // it is an IDN using punycode encoding. We do not need to worry
    // about percent encoding because the URL parser will have
    // already taken care of that for us. Note that this only
    // causes IDNs with an appropriate `xn--` prefix to be decoded.
    return `\\\\${domainToUnicode(hostname)}${pathname}`;
  }

  // Otherwise, it's a local path that requires a drive letter
  const letter = pathname.codePointAt(1) | 0x20;
  const sep = pathname[2];
  if (
    letter < CHAR_LOWERCASE_A ||
    letter > CHAR_LOWERCASE_Z || // a..z A..Z
    sep !== ":"
  ) {
    throw new RuntimeError("file URL must be absolute");
  }
  return pathname.slice(1);
}

function getPathFromURLPosix(url) {
  if (url.hostname !== "") {
    throw new RuntimeError("Invalid platform");
  }
  const pathname = url.pathname;
  for (let n = 0; n < pathname.length; n++) {
    if (pathname[n] === "%") {
      const third = pathname.codePointAt(n + 2) | 0x20;
      if (pathname[n + 1] === "2" && third === 102) {
        throw new RuntimeError(
          "file URL must not include encoded \\ or / characters"
        );
      }
    }
  }
  return decodeURIComponent(pathname);
}
