'use strict';
var mergeDuplicatePrograms = require('../../lib/mergeDuplicatePrograms');

describe('mergeDuplicatePrograms', function() {
    it('merges duplicate programs', function() {
        var gltf = {
            programs: {
                programOne: {
                    fragmentShader: 'FSOne',
                    vertexShader: 'VSOne'
                },
                programTwo: {
                    fragmentShader: 'FSOne',
                    vertexShader: 'VSOne'
                },
                programThree: {
                    fragmentShader: 'FSOne',
                    vertexShader: 'VSTwo'
                }
            },
            techniques: {
                techniqueOne: {
                    program: 'programOne'
                },
                techniqueTwo: {
                    program: 'programTwo'
                },
                techniqueThree: {
                    program: 'programThree'
                }
            }
        };
        mergeDuplicatePrograms(gltf);
        var programs = gltf.programs;
        expect(programs.programOne).toBeDefined();
        expect(programs.programTwo).not.toBeDefined();
        expect(programs.programThree).toBeDefined();
        var techniques = gltf.techniques;
        expect(techniques.techniqueOne.program).toBe('programOne');
        expect(techniques.techniqueTwo.program).toBe('programOne');
        expect(techniques.techniqueThree.program).toBe('programThree');
    });
});