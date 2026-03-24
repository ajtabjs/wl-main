precision mediump float;

varying vec2 v_tex;
varying vec4 v_col;

uniform sampler2D texture;

void main()
{
	vec4 color = texture2D(texture, v_tex);
	
	if(color.a == 0.0)
		discard;
	
	gl_FragColor = color * v_col;
}