precision mediump float;

// Varyings.
varying vec2 v_pixelCoord;
varying vec2 v_texCoord;

// Default shader values.
uniform vec3 CAMERAPOSITION;
uniform vec2 VIEWPORTSIZE;
uniform float TIME;
uniform float ZOOM;

// Tile sizes.
uniform float tileSize;

// Sprites texture.
uniform sampler2D sprites;
uniform vec2 spritesSize;
// Map texture.
uniform sampler2D map;
uniform vec2 mapSize;

void main()
{
	// Sample map data.
	vec4 tile = texture2D(map, v_texCoord) * 255.0;
	
	if(tile.z > 0.0)
	{
		// Calculate current frame.
		float curFrame = floor(mod(TIME / (tile.a / 255.0), tile.z));
		
		if(curFrame >= tile.z)
			curFrame = 0.0;
		
		// Add offset to x-coord.
		tile.x += curFrame;
	}
	
	// calculate the UV-space coordinate.
	vec2 spriteOffset = floor(tile.xy) * tileSize;
	vec2 spriteCoord = mod(v_pixelCoord / ZOOM, tileSize);
	
	gl_FragColor = texture2D(sprites, (spriteOffset + spriteCoord) * (1.0 / spritesSize));
}