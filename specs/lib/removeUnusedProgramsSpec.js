'use strict';

var removeUnusedPrograms = require('../../').removeUnusedPrograms;
var OptimizationStatistics = require('../../').OptimizationStatistics;

describe('removeUnusedPrograms', function() {
    it('removes a program', function() {
        var gltf = {
            "programs": {
                "program_0": {
                    "attributes": [
                        "a_normal",
                        "a_position",
                        "a_texcoord0"
                    ],
                    "fragmentShader": "CesiumTexturedBoxTest0FS",
                    "vertexShader": "CesiumTexturedBoxTest0VS"
                },
                "unusedProgramId": {
                    "attributes": [
                        "a_normal",
                        "a_position",
                        "a_texcoord0"
                    ],
                    "fragmentShader": "CesiumTexturedBoxTest0FS",
                    "vertexShader": "CesiumTexturedBoxTest0VS"
                }
            },
            "techniques": {
                "technique0": {
                    "attributes": {
                        "a_normal": "normal",
                        "a_position": "position",
                        "a_texcoord0": "texcoord0"
                    },
                    "parameters": {
                        "diffuse": {
                            "type": 35678
                        },
                        "modelViewMatrix": {
                            "semantic": "MODELVIEW",
                            "type": 35676
                        },
                        "normal": {
                            "semantic": "NORMAL",
                            "type": 35665
                        },
                        "normalMatrix": {
                            "semantic": "MODELVIEWINVERSETRANSPOSE",
                            "type": 35675
                        },
                        "position": {
                            "semantic": "POSITION",
                            "type": 35665
                        },
                        "projectionMatrix": {
                            "semantic": "PROJECTION",
                            "type": 35676
                        },
                        "shininess": {
                            "type": 5126
                        },
                        "specular": {
                            "type": 35666
                        },
                        "texcoord0": {
                            "semantic": "TEXCOORD_0",
                            "type": 35664
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
                        "u_diffuse": "diffuse",
                        "u_modelViewMatrix": "modelViewMatrix",
                        "u_normalMatrix": "normalMatrix",
                        "u_projectionMatrix": "projectionMatrix",
                        "u_shininess": "shininess",
                        "u_specular": "specular"
                    }
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedPrograms(gltf, stats);
        expect(gltf.programs.unusedProgramId).not.toBeDefined();
        expect(stats.numberOfProgramsRemoved).toEqual(1);
    });

    it('does not remove any programs', function() {
        var gltf = {
            "programs": {
                "program_0": {
                    "attributes": [
                        "a_normal",
                        "a_position",
                        "a_texcoord0"
                    ],
                    "fragmentShader": "CesiumTexturedBoxTest0FS",
                    "vertexShader": "CesiumTexturedBoxTest0VS"
                }
            },
            "techniques": {
                "technique0": {
                    "attributes": {
                        "a_normal": "normal",
                        "a_position": "position",
                        "a_texcoord0": "texcoord0"
                    },
                    "parameters": {
                        "diffuse": {
                            "type": 35678
                        },
                        "modelViewMatrix": {
                            "semantic": "MODELVIEW",
                            "type": 35676
                        },
                        "normal": {
                            "semantic": "NORMAL",
                            "type": 35665
                        },
                        "normalMatrix": {
                            "semantic": "MODELVIEWINVERSETRANSPOSE",
                            "type": 35675
                        },
                        "position": {
                            "semantic": "POSITION",
                            "type": 35665
                        },
                        "projectionMatrix": {
                            "semantic": "PROJECTION",
                            "type": 35676
                        },
                        "shininess": {
                            "type": 5126
                        },
                        "specular": {
                            "type": 35666
                        },
                        "texcoord0": {
                            "semantic": "TEXCOORD_0",
                            "type": 35664
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
                        "u_diffuse": "diffuse",
                        "u_modelViewMatrix": "modelViewMatrix",
                        "u_normalMatrix": "normalMatrix",
                        "u_projectionMatrix": "projectionMatrix",
                        "u_shininess": "shininess",
                        "u_specular": "specular"
                    }
                }
            }
        };

        var stats = new OptimizationStatistics();
        removeUnusedPrograms(gltf, stats);
        expect(gltf.programs.program_0).toBeDefined();
        expect(stats.numberOfProgramsRemoved).toEqual(0);
    });
});