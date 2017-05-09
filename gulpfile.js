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

function excludeCompressedTextures(jasmine) {
    var excludedSpecs = ['compressTexturesSpec.js', 'compressTexturesMultipleFormatsSpec.js'];
    var specFiles = jasmine.specFiles;
    var specsLength = specFiles.length;
    var excludedLength = excludedSpecs.length;
    for (var i = specsLength - 1; i >= 0; --i) {
        for (var j = 0; j < excludedLength; ++j) {
            if (specFiles[i].indexOf(excludedSpecs[j]) > -1) {
                specFiles.splice(i, 1);
                break;
            }
        }
    }
}

gulp.task('test', function (done) {
    var jasmine = new Jasmine();
    jasmine.loadConfigFile('specs/jasmine.json');
    if (defined(argv.excludeCompressedTextures)) {
        // Exclude compressTexturesSpec for Travis builds
        // Travis runs Ubuntu 12.04.5 which has glibc 2.15, while crunch requires glibc 2.22 or higher
        excludeCompressedTextures(jasmine);
    }
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

    // Exclude compressTexturesSpec from coverage for Travis builds
    // Travis runs Ubuntu 12.04.5 which has glibc 2.15, while crunch requires glibc 2.22 or higher
    var additionalExcludes = '';
    if (defined(argv.excludeCompressedTextures)) {
        additionalExcludes += '-x "specs/lib/compressTexturesSpec.js"';
        additionalExcludes += '-x "specs/lib/compressTexturesMultipleFormatsSpec.js"';
    }

    child_process.execSync('istanbul' +
        ' cover' +
        ' --include-all-sources' +
        ' --dir coverage' +
        ' -x "specs/**" -x "bin/**" -x "coverage/**" -x "dist/**" -x "index.js" -x "gulpfile.js"' + additionalExcludes +
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
    var defineHeader = '/*global define*/\n' +
            'define([], function() {\n    ';
    if (paths.length > 0) {
        var definePathsHeader = '\'' + paths.join('\',\n        \'') + '\'';
        var defineVariablesHeader = variables.join(',\n        ');
        defineHeader = '/*global define*/\n' +
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

function combine(source) {
    var fullMatch;
    var variableName;
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

    // combine source
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
    var defineHeader = '/*global define*/\n' +
        'var ' + returnValue + ' = (function() {\n    ';
    var defineFooter = '\n}());\n';
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
        'addExtensionsRequired.js',
        'addExtensionsUsed.js',
        'addPipelineExtras.js',
        'addToArray.js',
        'byteLengthForComponentType.js',
        'findAccessorMinMax.js',
        'ForEach.js',
        'getAccessorByteStride.js',
        'getStatistics.js',
        'numberOfComponentsForType.js',
        'parseBinaryGltf.js',
        'processModelMaterialsCommon.js',
        'removePipelineExtras.js',
        'removeExtensionsRequired.js',
        'removeExtensionsUsed.js',
        'techniqueParameterForSemantic.js',
        'updateVersion.js'
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

gulp.task('build-cesium-combine', function () {
    var basePath = 'lib';
    var outputDir = 'dist/cesium-combined';
    var files = [
        'getStatistics.js'
    ];
    Promise.map(files, function(fileName) {
        var filePath = path.join(basePath, fileName);
        return fsExtraReadFile(filePath)
            .then(function(buffer) {
                var source = buffer.toString();
                source = combine(source);
                var outputPath = path.join(outputDir, fileName);
                return fsExtraOutputFile(outputPath, source);
            });
    });
});
