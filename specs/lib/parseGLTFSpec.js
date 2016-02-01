'use strict';

var parseGLTF = require('../../lib/parseGLTF');

describe('parseGLTF', function() {
    it('loads two shaders', function(done) {
        var gltf = '{' +
            '"shaders": {' +
                '"CesiumTexturedBoxTest0FS": {' +
                    '"type": 35632,' +
                    '"uri": "CesiumTexturedBoxTest0FS.glsl"' +
                '},' +
                '"CesiumTexturedBoxTest0VS": {' +
                    '"type": 35633,' +
                    '"uri": "CesiumTexturedBoxTest0VS.glsl"' +
                '}' +
            '}' +
        '}';
        var frag = 'precision highp float;\n' +
        'varying vec3 v_normal;\n' +
        'varying vec2 v_texcoord0;\n' +
        'uniform sampler2D u_diffuse;\n' +
        'uniform vec4 u_specular;\n' +
        'uniform float u_shininess;\n' +
        'void main(void) {\n' +
        'vec3 normal = normalize(v_normal);\n' +
        'vec4 color = vec4(0., 0., 0., 0.);\n' +
        'vec4 diffuse = vec4(0., 0., 0., 1.);\n' +
        'vec4 specular;\n' +
        'diffuse = texture2D(u_diffuse, v_texcoord0);\n' +
        'specular = u_specular;\n' +
        'diffuse.xyz *= max(dot(normal,vec3(0.,0.,1.)), 0.);\n' +
        'color.xyz += diffuse.xyz;\n' +
        'color = vec4(color.rgb * diffuse.a, diffuse.a);\n' +
        'gl_FragColor = color;\n' +
        '}';
        var vert = 'precision highp float;\n' +
        'attribute vec3 a_position;\n' +
        'attribute vec3 a_normal;\n' +
        'varying vec3 v_normal;\n' +
        'uniform mat3 u_normalMatrix;\n' +
        'uniform mat4 u_modelViewMatrix;\n' +
        'uniform mat4 u_projectionMatrix;\n' +
        'attribute vec2 a_texcoord0;\n' +
        'varying vec2 v_texcoord0;\n' +
        'void main(void) {\n' +
        'vec4 pos = u_modelViewMatrix * vec4(a_position,1.0);\n' +
        'v_normal = u_normalMatrix * a_normal;\n' +
        'v_texcoord0 = a_texcoord0;\n' +
        'gl_Position = u_projectionMatrix * pos;\n' +
        '}';

        gltf = parseGLTF('./specs/data/boxTexturedUnoptimized', gltf, function(loadId, uri) {
            expect(gltf[loadId][uri]).toBeDefined();
            if (uri === 'CesiumTexturedBoxTest0FS.glsl') {
                expect(gltf[loadId][uri].toString()).toEqual(frag);
            }
            if (uri === 'CesiumTexturedBoxTest0VS.glsl') {
                expect(gltf[loadId][uri].toString()).toEqual(vert);
            }
            done();
        });
    });
});