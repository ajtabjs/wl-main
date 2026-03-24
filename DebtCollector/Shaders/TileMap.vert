precision mediump float;

// Attributes.
attribute vec4 a_pos;
attribute vec2 a_tex;

// Default shader values.
uniform vec3 CAMERAPOSITION;
uniform vec2 VIEWPORTSIZE;
uniform float ZOOM;

// Tile size.
uniform float tileSize;
uniform float parallax;
uniform vec2 offset;
uniform vec2 mapSize;

// Varyings.
varying vec2 v_pixelCoord;
varying vec2 v_texCoord;

void main()
{
	float zoom = ZOOM / parallax;

	v_pixelCoord = (a_tex * VIEWPORTSIZE) + vec2((-offset.x + CAMERAPOSITION.x) * zoom - VIEWPORTSIZE.x / 2.0, mapSize.y * tileSize * zoom + ((offset.y + -CAMERAPOSITION.y) * zoom - VIEWPORTSIZE.y / 2.0));
	v_texCoord = v_pixelCoord * (1.0 / mapSize) * (1.0 / tileSize);
	v_texCoord /= ZOOM;
	
	gl_Position = vec4(a_pos.xy, 0.0, 1.0);
}