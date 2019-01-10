'use strict';

const Cesium = require('cesium');

const defined = Cesium.defined;
const defaultValue = Cesium.defaultValue;

module.exports = function expectPrommise(promise, done) {
    return {
        toResolve: function toResolve() {
            return promise
                .then(done)
                .catch(function(err){
                    done.fail('Expected promise to resolve' + err);
                });
        },
        toResolveWith: function toResolveWith(expectedValue) {
            return promise
                .then(function (result) {
                    expect(result).toEqual(expectedValue);
                    done();
                })
                .catch(function(err){
                    done.fail('Expected promise to resolve' + err);
                });
        },
        toRejectWith: function toRejectWith(ErrorType, errorMessage) {
            const typeName = defaultValue(ErrorType.displayName, ErrorType.name);

            promise
                .then(function () {
                    done.fail('expected promise to reject with ' + typeName);
                })
                .catch(function (error) {
                    if (!(error instanceof ErrorType)) {
                        done.fail(defaultValue(defaultValue(error.displayName, error.name), ErrorType) + ' to be instance of ' + typeName);
                        console.log(error);
                    }

                    if (defined(errorMessage)) {
                        expect(error.message).toEqual(errorMessage);
                    }
                    done();
                });
        }
    };
};
