'use strict';

var jshint = require('gulp-jshint');
var gulp = require('gulp');
var Jasmine = require('jasmine');
var JasmineSpecReporter = require('jasmine-spec-reporter');

var jsHintFiles = ['index.js', 'bin/*.js', 'lib/*.js', 'specs/*.js', '!node_modules/**', '!build/**', '!coverage/**'];

gulp.task('default', ['jsHint']);

gulp.task('jsHint', function() {
    return gulp.src(jsHintFiles)
        .pipe(jshint.extract('auto'))
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('jsHint-watch', function() {
    gulp.watch(jsHintFiles).on('change', function(event) {
        gulp.src(event.path)
            .pipe(jshint.extract('auto'))
            .pipe(jshint())
            .pipe(jshint.reporter('jshint-stylish'));
    });
});

gulp.task('test', function (done) {
    var jasmine = new Jasmine();
    jasmine.loadConfigFile('spec/support/jasmine.json');
    jasmine.addReporter(new JasmineSpecReporter());
    jasmine.execute();
    jasmine.onComplete(function() {
        done();
    });
});
