precision mediump float;

varying vec4 v_pos;
varying vec2 v_tex;

uniform vec2 VIEWPORTSIZE;
uniform sampler2D texture;
uniform float pixelSize;

uniform sampler2D fadeTexture;
uniform float fadeProgress;

void main()
{
/* Bevel effect, disabled for now (Should move to a post processing system?)
	float width = v_tex.x * VIEWPORTSIZE.x;
	float height = v_tex.y * VIEWPORTSIZE.y;
	
	vec4 bevel = vec4(0.0, 0.0, 0.0, 0.0);
	
	float pixLocX = mod(width, pixelSize);
	float pixLocY = mod(height, pixelSize);
	
	if(pixLocY >= pixelSize - 1.0 || pixLocX >= pixelSize - 1.0 )
		bevel = vec4(0.05, 0.05, 0.05, 0.0);
	
	if(pixLocY <= 1.0 || pixLocX <= 1.0)
		bevel = vec4(-0.05, -0.05, -0.05, 0.0);
*/
	vec4 color;
	if(fadeProgress > texture2D(fadeTexture, v_tex).r)
		color = vec4(0.0, 0.0, 0.0, 1.0);
	else
		color = texture2D(texture, v_tex);

	//gl_FragColor = color + bevel;

	gl_FragColor = color;
}