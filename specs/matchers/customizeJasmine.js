/*global define*/
define([
    './addDefaultMatchers',
    './equalsMethodEqualityTester'
], function (addDefaultMatchers,
             equalsMethodEqualityTester) {
    'use strict';

    return function (env) {
        env.beforeEach(function () {
            addDefaultMatchers(true).call(env);
            env.addCustomEqualityTester(equalsMethodEqualityTester);
        });
    };
});
