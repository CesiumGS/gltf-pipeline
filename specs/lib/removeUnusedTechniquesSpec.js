'use strict';

var removeUnusedTechniques = require('../../').removeUnusedTechniques;
var OptimizationStatistics = require('../../').OptimizationStatistics;

describe('removeUnusedTechniques', function() {
    it('removes a technique', function() {
        var gltf = {
            "materials": {
                "Effect-Texture": {
                    "name": "Texture",
                    "technique": "technique0",
                    "values": {
                        "diffuse": "texture_Image0001"
                    }
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
                },
                "unusedTechniqueId": {
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
        removeUnusedTechniques(gltf, stats);
        expect(gltf.techniques.unusedTechniqueId).not.toBeDefined();
        expect(stats.numberRemoved.techniques).toEqual(1);
    });

    it('does not remove any techniques', function() {
        var gltf = {
            "materials": {
                "Effect-Texture": {
                    "name": "Texture",
                    "technique": "technique0",
                    "values": {
                        "diffuse": "texture_Image0001"
                    }
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
        removeUnusedTechniques(gltf, stats);
        expect(gltf.techniques.technique0).toBeDefined();
        expect(stats.numberRemoved.techniques).toEqual(0);
    });
});