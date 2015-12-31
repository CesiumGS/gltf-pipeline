'use strict';

module.exports = definedNotNull;

function definedNotNull(value) {
    return (value !== undefined) && (value !== null);
}