precision mediump float;

uniform vec2 VIEWPORTSIZE;
uniform float TIME;

varying vec2 v_tex;
varying vec4 v_col;
varying vec4 v_screen;

uniform sampler2D texture;

void main()
{
	vec4 color = texture2D(texture, v_tex);
	
	if(color.a == 0.0)
		discard;
	
	gl_FragColor = color * v_col;
}