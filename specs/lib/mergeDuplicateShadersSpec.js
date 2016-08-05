'use strict';
var Cesium = require('cesium');

var WebGLConstants = Cesium.WebGLConstants;

var mergeDuplicateShaders = require('../../lib/mergeDuplicateShaders');

describe('mergeDuplicateShaders', function() {
    var testShaderBufferOne = new Buffer('test shader one', 'utf8');
    var testShaderBufferTwo = new Buffer('test shader two', 'utf8');
    it('merges duplicate shaders', function() {
        var gltf = {
            programs : {
                programOne : {
                    fragmentShader : 'FSOne',
                    vertexShader : 'VSOne'
                },
                programTwo : {
                    fragmentShader : 'FSTwo',
                    vertexShader : 'VSTwo'
                }
            },
            shaders : {
                VSOne : {
                    type : WebGLConstants.VERTEX_SHADER,
                    extras : {
                        _pipeline : {
                            source : testShaderBufferOne
                        }
                    }
                },
                FSOne : {
                    type : WebGLConstants.FRAGMENT_SHADER,
                    extras : {
                        _pipeline : {
                            source : testShaderBufferOne
                        }
                    }
                },
                VSTwo : {
                    type : WebGLConstants.VERTEX_SHADER,
                    extras : {
                        _pipeline : {
                            source : testShaderBufferTwo
                        }
                    }
                },
                FSTwo : {
                    type : WebGLConstants.FRAGMENT_SHADER,
                    extras : {
                        _pipeline : {
                            source : testShaderBufferOne
                        }
                    }
                }
            }
        };
        mergeDuplicateShaders(gltf);
        var programs = gltf.programs;
        var shaders = gltf.shaders;
        expect(shaders.VSOne).toBeDefined();
        expect(shaders.FSOne).toBeDefined();
        expect(shaders.VSTwo).toBeDefined();
        expect(shaders.FSTwo).not.toBeDefined();
        expect(programs.programOne.fragmentShader).toBe('FSOne');
        expect(programs.programOne.vertexShader).toBe('VSOne');
        expect(programs.programTwo.fragmentShader).toBe('FSOne');
        expect(programs.programTwo.vertexShader).toBe('VSTwo');
    });
});