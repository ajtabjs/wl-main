precision mediump float;

uniform mat4 WORLDVIEWPROJ;

attribute vec3 a_pos;
attribute vec2 a_tex;
attribute vec4 a_col;

varying vec2 v_tex;
varying vec4 v_col;
varying vec4 v_screen;

void main()
{
	v_tex = a_tex;
	v_col = a_col;
	v_screen = WORLDVIEWPROJ * vec4(a_pos, 1.0);
	gl_Position = v_screen;
}