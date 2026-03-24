precision highp float;

attribute vec4 a_pos;
attribute vec2 a_tex;

varying vec4 v_pos;
varying vec2 v_tex;

void main()
{
	v_pos = a_pos;
	v_tex = a_tex;
	gl_Position = a_pos;
}