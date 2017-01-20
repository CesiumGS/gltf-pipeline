'use strict';

var Cesium = require('cesium');
var child_process = require('child_process');
var fsExtra = require('fs-extra');
var gulp = require('gulp');
var gulpJshint = require('gulp-jshint');
var Jasmine = require('jasmine');
var JasmineSpecReporter = require('jasmine-spec-reporter');
var open = require('open');
var path = require('path');
var Promise = require('bluebird');
var yargs = require('yargs');

var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;
var argv = yargs.argv;

var fsExtraReadFile = Promise.promisify(fsExtra.readFile);
var fsExtraOutputFile = Promise.promisify(fsExtra.outputFile);

// Add third-party node module binaries to the system path
// since some tasks need to call them directly.
var environmentSeparator = process.platform === 'win32' ? ';' : ':';
var nodeBinaries = path.join(__dirname, 'node_modules', '.bin');
process.env.PATH += environmentSeparator + nodeBinaries;

var jsHintFiles = ['**/*.js', '!node_modules/**', '!coverage/**', '!doc/**', '!dist/**'];
var specFiles = ['**/*.js', '!node_modules/**', '!coverage/**', '!dist/**'];

gulp.task('jsHint', function () {
    var stream = gulp.src(jsHintFiles)
        .pipe(gulpJshint())
        .pipe(gulpJshint.reporter('jshint-stylish'));

    if (argv.failTaskOnError) {
        stream = stream.pipe(gulpJshint.reporter('fail'));
    }

    return stream;
});

gulp.task('jsHint-watch', function () {
    gulp.watch(jsHintFiles, ['jsHint']);
});

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
        //We can't simply depend on the test task because Jasmine
        //does not like being run multiple times in the same process.
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
    child_process.execSync('istanbul' +
        ' cover' +
        ' --include-all-sources' +
        ' --dir coverage' +
        ' -x "specs/** coverage/** dist/** index.js gulpfile.js"' +
        ' node_modules/jasmine/bin/jasmine.js' +
        ' JASMINE_CONFIG_PATH=specs/jasmine.json', {
        stdio: [process.stdin, process.stdout, process.stderr]
    });
    open('coverage/lcov-report/index.html');
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
                    throw new DeveloperError('Build Failed: Module sub-dependency found for ' + requirePath + ' with no defined mapping behavior.');
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
    var definePathsHeader = '\'' + paths.join('\',\n        \'') + '\'';
    var defineVariablesHeader = variables.join(',\n        ');
    var defineHeader = '/*global define*/\n' +
        'define([\n' +
        '        ' + definePathsHeader + '\n' +
        '    ], function(\n' +
        '        ' + defineVariablesHeader + ') {\n    ';
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
        'addExtensionsUsed.js',
        'addPipelineExtras.js',
        'byteLengthForComponentType.js',
        'findAccessorMinMax.js',
        'getAccessorByteStride.js',
        'getUniqueId.js',
        'numberOfComponentsForType.js',
        'parseBinaryGltf.js',
        'processModelMaterialsCommon.js',
        'techniqueParameterForSemantic.js'
    ];
    var subDependencyMapping = {
        cesium : {
            prefix : '../../Core/'
        }
    };
    Promise.map(files, function(fileName) {
        var filePath = path.join(basePath, fileName);
        return fsExtraReadFile(filePath)
            .then(function(buffer) {
                var source = buffer.toString();
                source = amdify(source, subDependencyMapping);
                var outputPath = path.join(outputDir, fileName);
                return fsExtraOutputFile(outputPath, source);
            });
    });
});
