precision mediump float;

// Engine given
uniform mat4 WORLDVIEWPROJ;

// Attibutes
attribute vec3 a_pos;
attribute vec2 a_tex;
attribute vec4 a_col;

varying vec3 v_pos;
varying vec2 v_tex;
varying vec4 v_col;

void main()
{
	// Set varyings
	v_pos = a_pos;
	v_tex = a_tex;
	v_col = a_col;
	gl_Position = WORLDVIEWPROJ * vec4(v_pos, 1.0);
}