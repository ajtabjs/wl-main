precision mediump float;

uniform sampler2D texture;

varying vec3 v_pos;
varying vec2 v_tex;
varying vec4 v_col;

void main()
{
	vec4 color = texture2D(texture, v_tex);

	gl_FragColor = color;
}