#define PI 3.14159265358979
precision highp float;

uniform float uTime;
uniform float uProgress;       // 0=void, 1=full singularity
uniform vec2  uResolution;
uniform float uDistortion;     // 0-1 gravitational lensing strength

in vec2 vUv;
out vec4 pc_FragColor;

// ── Noise Functions ───────────────────────────────────────────────────────────
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
    float f = 0.0;
    float w = 0.5;
    for (int i = 0; i < 5; i++) {
        f += w * noise(p);
        p *= 2.0;
        w *= 0.5;
    }
    return f;
}

// ── Color Temperature ────────────────────────────────────────────────────────
vec3 tempColor(float t) {
    // Deep orange/gold for interstellar look
    vec3 cold  = vec3(0.0, 0.0, 0.0);
    vec3 hot   = vec3(1.0, 0.6, 0.2);
    vec3 core  = vec3(1.0, 0.9, 0.8);
    if (t < 0.5) return mix(cold, hot, t * 2.0);
    return mix(hot, core, (t - 0.5) * 2.0);
}

void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 uvAspect = uv;
    uvAspect.x = (uv.x - 0.5) * aspect + 0.5;

    vec2 d = uvAspect - vec2(0.5);
    float dist = length(d);

    // Event Horizon (Black Hole)
    float eventHorizonRadius = 0.05 * uProgress;
    
    // Gravitational Lensing Warp
    float lensStrength = uDistortion * 0.05 * uProgress;
    // Warp spacetime heavily near the event horizon
    vec2 warpedUv = uvAspect;
    if (dist > eventHorizonRadius) {
        float warp = lensStrength / (dist * dist + 0.001);
        warpedUv -= normalize(d) * warp;
    }

    float warpedDist = length(warpedUv - vec2(0.5));

    // Accretion Disk (FBM Noise rotated around center)
    float angle = atan(warpedUv.y - 0.5, warpedUv.x - 0.5);
    float diskRadius = warpedDist;
    
    // Rotate the disk based on distance (differential rotation)
    angle += uTime * (0.5 / (diskRadius + 0.01));
    
    vec2 polarUv = vec2(angle * 3.0, diskRadius * 20.0);
    float noiseVal = fbm(polarUv - vec2(uTime * 2.0, 0.0));
    
    // Shape the disk
    float diskAlpha = smoothstep(0.3, 0.05, abs(diskRadius - 0.15)) * uProgress;
    diskAlpha *= smoothstep(eventHorizonRadius + 0.01, eventHorizonRadius + 0.05, diskRadius);
    
    float diskIntensity = noiseVal * diskAlpha * 2.0;

    // Photon Ring (Extremely bright thin ring right outside event horizon)
    float ringDist = abs(diskRadius - eventHorizonRadius - 0.005);
    float ring = smoothstep(0.005, 0.0, ringDist) * uProgress * 2.0;

    // Core Singularity (Pure black inside event horizon)
    float isInside = step(diskRadius, eventHorizonRadius);
    
    // Background Starfield (warped by lensing)
    float stars = pow(hash(warpedUv * 300.0), 20.0) * 2.0;
    
    // Combine everything
    vec3 col = tempColor(diskIntensity);
    col += tempColor(0.8) * ring;
    
    // Mix stars in background
    vec3 finalCol = col + vec3(stars) * (1.0 - isInside) * (1.0 - diskAlpha);
    
    // Absolute black inside event horizon
    finalCol *= (1.0 - isInside);
    
    // Global fade via uProgress
    finalCol *= smoothstep(0.0, 0.2, uProgress);

    pc_FragColor = vec4(finalCol, 1.0);
}
