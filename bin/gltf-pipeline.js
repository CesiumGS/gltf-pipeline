#!/usr/bin/env node
'use strict';
var Pipeline = require('../lib/Pipeline');
var parseArguments = require('../lib/parseArguments');

var processFileToDisk = Pipeline.processFileToDisk;

var args = process.argv;
args = args.slice(2, args.length);
var options = parseArguments(args);

console.time('optimize');
// Node automatically waits for all promises to terminate
processFileToDisk(options.inputPath, options.outputPath, options)
    .then(function() {
        console.timeEnd('optimize');
    });
