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
var request = require('request');
var yargs = require('yargs');

var defined = Cesium.defined;
var argv = yargs.argv;

// Add third-party node module binaries to the system path
// since some tasks need to call them directly.
var environmentSeparator = process.platform === 'win32' ? ';' : ':';
var nodeBinaries = path.join(__dirname, 'node_modules', '.bin');
process.env.PATH += environmentSeparator + nodeBinaries;

var jsHintFiles = ['**/*.js', '!node_modules/**', '!coverage/**'];
var specFiles = ['**/*.js', '!node_modules/**', '!coverage/**'];

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
        ' -x "specs/** coverage/** index.js gulpfile.js"' +
        ' node_modules/jasmine/bin/jasmine.js' +
        ' JASMINE_CONFIG_PATH=specs/jasmine.json', {
        stdio: [process.stdin, process.stdout, process.stderr]
    });
    open('coverage/lcov-report/index.html');
});

function copyModule(module) {
    var tsName = module + '.d.ts';
    var srcUrl = 'https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/' + module + '/' + tsName;
    var desPath = path.join('TypeScriptDefinitions', tsName);

    request.get({
        url: srcUrl
    }, function (error, response) {
        if (error) {
            console.log(error);
            return;
        }
        if (response.statusCode >= 200 && response.statusCode < 300) {
            fsExtra.outputFileSync(desPath, response.body);
        }
    });
}

gulp.task('update-ts-definitions', function () {
    fsExtra.removeSync('TypeScriptDefinitions');
    var packageJson = require('./package.json');
    Object.keys(packageJson.dependencies).forEach(copyModule);
    Object.keys(packageJson.devDependencies).forEach(copyModule);
});
