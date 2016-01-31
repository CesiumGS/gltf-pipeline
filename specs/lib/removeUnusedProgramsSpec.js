'use strict';

var removeUnusedPrograms = require('../../').removeUnusedPrograms;
var OptimizationStatistics = require('../../').OptimizationStatistics;

describe('removeUnusedPrograms', function() {
    it('removes a program', function() {
        var gltf = {
            "programs": {
                "program_0": {
                    "attributes": [
                        "a_position"
                    ],
                    "fragmentShader": "CesiumTexturedBoxTest0FS",
                    "vertexShader": "CesiumTexturedBoxTest0VS"
                },
                "unusedProgramId": {
                    "attributes": [
                        "a_position"
                    ],
                    "fragmentShader": "CesiumTexturedBoxTest0FS",
                    "vertexShader": "CesiumTexturedBoxTest0VS"
                }
            },
            "techniques": {
                "technique0": {
                    "attributes": {
                        "a_position": "position"
                    },
                    "parameters": {
                        "modelViewMatrix": {
                            "semantic": "MODELVIEW",
                            "type": 35676
                        },
                        "projectionMatrix": {
                            "semantic": "PROJECTION",
                            "type": 35676
                        }
                    },
                    "program": "program_0",
                    "states": {
                        "enable": [
                            2929,
                            2884
                        ]
                    },
                    "uniforms": {
                        "u_modelViewMatrix": "modelViewMatrix",
                        "u_projectionMatrix": "projectionMatrix"
                    }
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedPrograms(gltf, stats);
        expect(gltf.programs.unusedProgramId).not.toBeDefined();
        expect(stats.numberRemoved.programs).toEqual(1);
    });

    it('does not remove any programs', function() {
        var gltf = {
            "programs": {
                "program_0": {
                    "attributes": [
                        "a_position"
                    ],
                    "fragmentShader": "CesiumTexturedBoxTest0FS",
                    "vertexShader": "CesiumTexturedBoxTest0VS"
                }
            },
            "techniques": {
                "technique0": {
                    "attributes": {
                        "a_position": "position"
                    },
                    "parameters": {
                        "modelViewMatrix": {
                            "semantic": "MODELVIEW",
                            "type": 35676
                        },
                        "projectionMatrix": {
                            "semantic": "PROJECTION",
                            "type": 35676
                        }
                    },
                    "program": "program_0",
                    "states": {
                        "enable": [
                            2929,
                            2884
                        ]
                    },
                    "uniforms": {
                        "u_modelViewMatrix": "modelViewMatrix",
                        "u_projectionMatrix": "projectionMatrix"
                    }
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedPrograms(gltf, stats);
        expect(gltf.programs.program_0).toBeDefined();
        expect(stats.numberRemoved.programs).toEqual(0);
    });
});