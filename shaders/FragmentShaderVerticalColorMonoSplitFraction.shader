// FragmentShaderVerticalColorMonoSplitFractionShader.shader - Split
//  screen into color/black-and-white vertically

// Author: Ayodeji Oshinnaiye

varying mediump vec2 vTextureCoord;
uniform sampler2D uSampler;

uniform mediump float splitFraction;

void main() {
	mediump vec4 baseTexel = texture2D(uSampler, vTextureCoord);
	
	mediump float clampedSplitFraction = clamp(splitFraction, 0.0, 1.0);
	
	const mediump float kRedMonoPortion = 0.30;
	const mediump float kGreenMonoPortion = 0.59;
	const mediump float kBlueMonoPortion = (1.0 - (kRedMonoPortion + kGreenMonoPortion));
	
	mediump float monoIntensity = (kRedMonoPortion * baseTexel.x) + (kGreenMonoPortion * baseTexel.y) +
		(kBlueMonoPortion * baseTexel.z);
	mediump vec4 monoTexel = vec4(vec3(monoIntensity), baseTexel.w);

	mediump float colorMultiplier = floor(clamp((vTextureCoord.y - (1.0 - clampedSplitFraction)) + 1.0, 0.0, 1.0));

	gl_FragColor.w = baseTexel.w;
	gl_FragColor.xyz = (colorMultiplier * baseTexel.xyz) + ((1.0 - colorMultiplier) * monoTexel.xyz);
}