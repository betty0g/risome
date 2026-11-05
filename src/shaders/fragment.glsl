uniform sampler2D uImage;
uniform vec2 uResolution;
uniform float uTexture;
uniform vec3 uBlue;
uniform vec3 uRed;
uniform vec3 uYellow;
uniform float uSpacing;
uniform float uInkStrength; 
uniform float uRegistration;  
varying vec2 vUv;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec2 rotate(vec2 p, float angle) {
  return vec2(
    p.x * cos(angle) - p.y * sin(angle),
    p.x * sin(angle) + p.y * cos(angle)
  );
}

float halftone(vec2 pixel, float amount, float angle, float spacing) {
  vec2 rotated = rotate(pixel, radians(angle));
  vec2 cell = fract(rotated / spacing) * 2.0 - 1.0;
  float dist = length(cell);
  float radius = sqrt(amount) * uInkStrength; 
  return step(dist, radius) * step(0.02, amount);
}

float aastep(float threshold, float value) {
  float aa = fwidth(value);
  return smoothstep(threshold - aa, threshold + aa, value);
}

float darknessOf(vec3 c) {
  return 1.0 - dot(c, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec2 pixel = vUv * uResolution;

  // Misregistration
  vec2 blueShift = vec2(0.0, 0.0);
  vec2 redShift = vec2(2.0, -1.5) * uRegistration; 
  vec2 yellowShift = vec2(-1.0, 1.0) * uRegistration;

  // Read the photo per ink
  vec3 bluePhoto = texture2D(uImage, vUv - blueShift / uResolution).rgb;
  vec3 redPhoto = texture2D(uImage, vUv - redShift / uResolution).rgb;
  vec3 yellowPhoto = texture2D(uImage, vUv - yellowShift / uResolution).rgb;

  // Ink amounts
  float blueAmount = darknessOf(bluePhoto);
  float redAmount = smoothstep(0.5, 1.0, darknessOf(redPhoto));
  float yellowAmount = max(0.0, (yellowPhoto.r + yellowPhoto.g) / 2.0 - yellowPhoto.b);

  // Colors
  vec3 paper = vec3(0.96, 0.94, 0.89) * (1.0 - uTexture + uTexture * random(pixel));
  vec3 blue = uBlue;
  vec3 red = uRed;
  vec3 yellow = uYellow;

  // Dots
  float blueDots = halftone(pixel - blueShift, blueAmount, 15.0, uSpacing);
  float redDots = halftone(pixel - redShift, redAmount, 75.0, uSpacing);
  float yellowDots = halftone(pixel - yellowShift, yellowAmount, 45.0, uSpacing);

  // Print
  float blueInk = 0.85 + 0.15 * random(pixel + 50.0);
  float redInk = 0.85 + 0.15 * random(pixel + 120.0);
  float yellowInk = 0.85 + 0.15 * random(pixel + 200.0);

  vec3 color = paper;
  color *= mix(vec3(1.0), blue, blueDots * blueInk);
  color *= mix(vec3(1.0), red, redDots * redInk);
  color *= mix(vec3(1.0), yellow, yellowDots * yellowInk);

  gl_FragColor = vec4(color, 1.0);
}