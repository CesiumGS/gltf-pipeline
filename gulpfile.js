'use strict';

var Cesium = require('cesium');
var child_process = require('child_process');
var dependencyTree = require('dependency-tree');
var fsExtra = require('fs-extra');
var gulp = require('gulp');
var Jasmine = require('jasmine');
var JasmineSpecReporter = require('jasmine-spec-reporter').SpecReporter;
var open = require('open');
var path = require('path');
var Promise = require('bluebird');
var yargs = require('yargs');

var defined = Cesium.defined;
var argv = yargs.argv;

// Add third-party node module binaries to the system path
// since some tasks need to call them directly.
var environmentSeparator = process.platform === 'win32' ? ';' : ':';
var nodeBinaries = path.join(__dirname, 'node_modules', '.bin');
process.env.PATH += environmentSeparator + nodeBinaries;

var specFiles = ['**/*.js', '!node_modules/**', '!coverage/**', '!doc/**', '!bin/**', '!dist/**'];

gulp.task('test', function (done) {
    var jasmine = new Jasmine();
    jasmine.loadConfigFile('specs/jasmine.json');
    jasmine.addReporter(new JasmineSpecReporter({
        displaySuccessfulSpec: !defined(argv.suppressPassed) || !argv.suppressPassed
    }));
    jasmine.execute();
    jasmine.onComplete(function (passed) {
        done(argv.failTaskOnError && !passed ? 1 : 0);
    });
});

gulp.task('test-watch', function () {
    gulp.watch(specFiles).on('change', function () {
        // We can't simply depend on the test task because Jasmine
        // does not like being run multiple times in the same process.
        try {
            child_process.execSync('jasmine JASMINE_CONFIG_PATH=specs/jasmine.json', {
                stdio: [process.stdin, process.stdout, process.stderr]
            });
        } catch (exception) {
            console.log('Tests failed to execute.');
        }
    });
});

gulp.task('coverage', function () {
    fsExtra.removeSync('coverage/server');
    child_process.execSync('nyc' +
        ' --all' +
        ' --reporter=lcov' +
        ' --dir coverage' +
        ' -x "specs/**" -x "bin/**" -x "coverage/**" -x "doc/**" -x "dist/**" -x "index.js" -x "gulpfile.js"' +
        ' node_modules/jasmine/bin/jasmine.js' +
        ' JASMINE_CONFIG_PATH=specs/jasmine.json', {
        stdio: [process.stdin, process.stdout, process.stderr]
    });
    open('coverage/lcov-report/index.html');
});

gulp.task('cloc', function() {
    var cmdLine;
    var clocPath = path.join('node_modules', 'cloc', 'lib', 'cloc');

    // Run cloc on primary Source files only
    var source = new Promise(function(resolve, reject) {
        cmdLine = 'perl ' + clocPath + ' --quiet --progress-rate=0' +
            ' lib/ bin/';

        child_process.exec(cmdLine, function(error, stdout, stderr) {
            if (error) {
                console.log(stderr);
                return reject(error);
            }
            console.log('Source:');
            console.log(stdout);
            resolve();
        });
    });

    // If running cloc on source succeeded, also run it on the tests.
    return source.then(function() {
        return new Promise(function(resolve, reject) {
            cmdLine = 'perl ' + clocPath + ' --quiet --progress-rate=0' +
                ' specs/lib/';
            child_process.exec(cmdLine, function(error, stdout, stderr) {
                if (error) {
                    console.log(stderr);
                    return reject(error);
                }
                console.log('Specs:');
                console.log(stdout);
                resolve();
            });
        });
    });
});

function amdify(source, subDependencyMapping) {
    var fullMatch;
    var variableName;
    var requireVariable;
    var requirePath;

    source = source.replace(/\r\n/g, '\n');
    var outputSource = source;

    // find module exports
    var returnValue;
    var findModuleExportsRegex = /module.exports\s*=\s*(.*?);\n/;
    var findModuleExports = findModuleExportsRegex.exec(source);
    if (defined(findModuleExports && findModuleExports.length > 0)) {
        fullMatch = findModuleExports[0];
        returnValue = findModuleExports[1];
        // remove module.exports from output source
        outputSource = outputSource.replace(fullMatch, '');
    }

    // create require mapping for dependencies
    var findRequireRegex = /var\s+(.+?)\s*=\s*require\('(.+?)'\);\n/g;
    var findRequire = findRequireRegex.exec(source);
    var requireMapping = {};
    while (defined(findRequire) && findRequire.length > 0) {
        fullMatch = findRequire[0];
        variableName = findRequire[1];
        requirePath = findRequire[2];
        requireMapping[variableName] = requirePath;
        // remove requires from output source
        outputSource = outputSource.replace(fullMatch, '');
        findRequire = findRequireRegex.exec(source);
    }
    // find places where sub-dependencies are pulled from a require
    var subdependencyMapping = {};
    var removeRequireMapping = [];
    for (requireVariable in requireMapping) {
        if (requireMapping.hasOwnProperty(requireVariable)) {
            requirePath = requireMapping[requireVariable];
            var findSubdependencyString = 'var\\s+(.+?)\\s*?=\\s*?' + requireVariable + '\\.(.+?);\n';
            var findSubdependencyRegex = new RegExp(findSubdependencyString, 'g');
            var findSubdependency = findSubdependencyRegex.exec(source);
            while (defined(findSubdependency) && findSubdependency.length > 0) {
                var mapping = subDependencyMapping[requirePath];
                if (!defined(mapping)) {
                    throw new Error('Build Failed: Module sub-dependency found for ' + requirePath + ' with no defined mapping behavior.');
                }
                removeRequireMapping.push(requireVariable);
                fullMatch = findSubdependency[0];
                variableName = findSubdependency[1];
                var subdependencyPath = findSubdependency[2];
                subdependencyMapping[variableName] = mapping.prefix + subdependencyPath;
                // remove sub-dependency declarations from output source
                outputSource = outputSource.replace(fullMatch, '');
                findSubdependency = findSubdependencyRegex.exec(source);
            }
        }
    }
    // Top-level modules can be removed if mapped
    while (removeRequireMapping.length > 0) {
        var removeVariableName = removeRequireMapping.pop();
        delete requireMapping[removeVariableName];
    }
    // join sub-dependencies with requireMapping
    for (var subdependencyVariable in subdependencyMapping) {
        if (subdependencyMapping.hasOwnProperty(subdependencyVariable)) {
            requireMapping[subdependencyVariable] = subdependencyMapping[subdependencyVariable];
        }
    }
    // amdify source
    // indent
    outputSource = outputSource.replace(/\n/g, '\n    ');
    // wrap define header
    var variables = [];
    var paths = [];
    for (var variable in requireMapping) {
        if (requireMapping.hasOwnProperty(variable)) {
            variables.push(variable);
            paths.push(requireMapping[variable]);
        }
    }
    var defineHeader = 'define([], function() {\n    ';
    if (paths.length > 0) {
        var definePathsHeader = '\'' + paths.join('\',\n        \'') + '\'';
        var defineVariablesHeader = variables.join(',\n        ');
        defineHeader =
            'define([\n' +
            '        ' + definePathsHeader + '\n' +
            '    ], function(\n' +
            '        ' + defineVariablesHeader + ') {\n    ';
    }
    var defineFooter = '\n});\n';
    if (defined(returnValue)) {
        defineFooter = '\n    return ' + returnValue + ';' + defineFooter;
    }
    outputSource = defineHeader + outputSource + defineFooter;
    // remove repeat newlines
    outputSource = outputSource.replace(/\n\s*\n/g, '\n\n');
    return outputSource;
}

gulp.task('build-cesium', function () {
    var basePath = 'lib';
    var outputDir = 'dist/cesium';
    var files = [
        'addDefaults.js',
        'addPipelineExtras.js',
        'ForEach.js',
        'parseGlb.js',
        'removePipelineExtras.js',
        'updateVersion.js'
    ];

    var subDependencyMapping = {
        cesium : {
            prefix : '../../Core/'
        }
    };

    var filesToAmdify = {};
    Promise.map(files, function (fileName) {
        var filePath = path.join(basePath, fileName);

        // Get list of dependant files
        filesToAmdify[filePath] = true;
        return dependencyTree.toList({
            filename : filePath,
            directory : basePath,
            filter: function(path) {
                return path.indexOf('node_modules') === -1;
            }
        }).forEach(function (dependency) {
            filesToAmdify[path.relative(__dirname, dependency)] = true;
        });
    }).then(function () {
        return Promise.map(Object.keys(filesToAmdify), function(filePath) {
            var fileName = path.relative(basePath, filePath);
            return fsExtra.readFile(filePath)
                .then(function (buffer) {
                    var source = buffer.toString();
                    source = amdify(source, subDependencyMapping);
                    var outputPath = path.join(outputDir, fileName);
                    return fsExtra.outputFile(outputPath, source);
                });
        });
    });
});
