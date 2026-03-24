precision mediump float;

uniform mat4 VIEW;
uniform mat4 PROJ;

attribute vec4 a_pos;

void main()
{
	gl_Position = PROJ * VIEW * a_pos;
}