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
                        "diffuse": "texture_Image0001",
                        "shininess": 256,
                        "specular": [
                            0.2,
                            0.2,
                            0.2,
                            1
                        ]
                    }
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
                },
                "unusedTechniqueId": {
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
        removeUnusedTechniques(gltf, stats);
        expect(gltf.techniques.unusedTechniqueId).not.toBeDefined();
        expect(stats.numberOfTechniquesRemoved).toEqual(1);
    });

    it('does not remove any techniques', function() {
        var gltf = {
            "materials": {
                "Effect-Texture": {
                    "name": "Texture",
                    "technique": "technique0",
                    "values": {
                        "diffuse": "texture_Image0001",
                        "shininess": 256,
                        "specular": [
                            0.2,
                            0.2,
                            0.2,
                            1
                        ]
                    }
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
        removeUnusedTechniques(gltf, stats);
        expect(gltf.techniques.technique0).toBeDefined();
        expect(stats.numberOfTechniquesRemoved).toEqual(0);
    });
});