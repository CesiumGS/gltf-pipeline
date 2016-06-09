precision highp float;
attribute vec4 a_position;
attribute vec3 a_normal;
varying vec3 v_normal;
uniform mat3 u_normalMatrix;
uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;
void main(void) {
vec4 pos = u_modelViewMatrix * a_position;
v_normal = u_normalMatrix * a_normal;
gl_Position = u_projectionMatrix * pos;
}
