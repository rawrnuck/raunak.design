import * as THREE from "https://esm.sh/three@0.175.0";
import { GUI } from "https://esm.sh/dat.gui@0.7.9";
import Stats from "https://esm.sh/stats.js@0.17.0";

// Create renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create render targets for feedback
const rtParams = {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  type: THREE.FloatType
};

const renderTarget1 = new THREE.WebGLRenderTarget(
  window.innerWidth,
  window.innerHeight,
  rtParams
);

const renderTarget2 = renderTarget1.clone();

// Create scenes and cameras
const simulationScene = new THREE.Scene();
const renderScene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// Parameters for GUI
const params = {
  // Simulation type
  simulationType: "inkMarbling",

  // Common parameters
  forceIntensity: 4.0,
  decayRate: 0.99,
  feedbackStrength: 0.8,

  // Ink marbling parameters
  inkViscosity: 0.75,
  inkDiffusion: 0.65,
  turbulence: 1.2,
  flowIntensity: 1.0,

  // Realistic ink parameters
  inkEdgeDetail: 0.9,
  inkGranularity: 0.7,
  paperTexture: 0.8,
  lightAbsorption: 0.9,
  inkSurfaceTension: 0.85,

  // Color settings
  primaryColor: [0.01, 0.01, 0.03],
  accentColor: [0.3, 0.4, 0.7],
  colorIntensity: 6.0,
  colorSaturation: 0.9,

  // Auto-movement
  autoMove: true,
  autoMoveWhenInactive: true,
  movementRadius: 0.6,
  movementSpeed: 0.2,

  // Presets
  preset: "ink"
};

// Ink presets with enhanced contrast and realism
const presets = {
  ink: {
    primaryColor: [0.0, 0.0, 0.02],
    accentColor: [0.2, 0.3, 0.6],
    colorIntensity: 7.0,
    colorSaturation: 0.95
  },
  sumi: {
    primaryColor: [0.01, 0.01, 0.01],
    accentColor: [0.2, 0.2, 0.2],
    colorIntensity: 6.0,
    colorSaturation: 0.15
  },
  sepia: {
    primaryColor: [0.28, 0.12, 0.03],
    accentColor: [0.45, 0.25, 0.12],
    colorIntensity: 5.5,
    colorSaturation: 0.9
  },
  redInk: {
    primaryColor: [0.3, 0.01, 0.01],
    accentColor: [0.6, 0.15, 0.15],
    colorIntensity: 5.0,
    colorSaturation: 1.2
  },
  blueInk: {
    primaryColor: [0.01, 0.03, 0.3],
    accentColor: [0.15, 0.2, 0.7],
    colorIntensity: 5.5,
    colorSaturation: 1.1
  }
};

// Apply a preset
function applyPreset(presetName) {
  const preset = presets[presetName];
  if (!preset) return;

  params.primaryColor = [...preset.primaryColor];
  params.accentColor = [...preset.accentColor];
  params.colorIntensity = preset.colorIntensity;
  params.colorSaturation = preset.colorSaturation;
  params.preset = presetName;

  // Update uniforms
  if (renderMaterial && renderMaterial.uniforms) {
    renderMaterial.uniforms.primaryColor.value.set(...params.primaryColor);
    renderMaterial.uniforms.accentColor.value.set(...params.accentColor);
    renderMaterial.uniforms.colorIntensity.value = params.colorIntensity;
    renderMaterial.uniforms.colorSaturation.value = params.colorSaturation;
  }

  // Update GUI
  if (colorFolder && colorFolder.__controllers) {
    for (const controller of colorFolder.__controllers) {
      controller.updateDisplay();
    }
  }
}

// Mouse tracking with clear debug output
const mouse = new THREE.Vector2(0.5, 0.5); // Start in center
let mouseActive = false;
let lastMouseMoveTime = 0;

// Track mouse position with visual feedback
window.addEventListener("mousedown", (event) => {
  // Store normalized coordinates (0-1 range)
  mouse.x = event.clientX / window.innerWidth;
  mouse.y = 1.0 - event.clientY / window.innerHeight; // Flip Y for WebGL coordinates
  mouseActive = true;
  lastMouseMoveTime = performance.now();
  console.log("Mouse DOWN at:", mouse.x, mouse.y);
});

window.addEventListener("mousemove", (event) => {
  // Store normalized coordinates (0-1 range)
  mouse.x = event.clientX / window.innerWidth;
  mouse.y = 1.0 - event.clientY / window.innerHeight; // Flip Y for WebGL coordinates
  mouseActive = true;
  lastMouseMoveTime = performance.now();
});

window.addEventListener("mouseout", () => {
  mouseActive = false;
});

// Initialize with some data for ink marbling
const initTexture = function () {
  const size = 256;
  const data = new Float32Array(4 * size * size);

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const idx = (i * size + j) * 4;
      data[idx] = 0;
      data[idx + 1] = 0;
      data[idx + 2] = 0.02;
      data[idx + 3] = 0.5;
    }
  }

  const texture = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  texture.needsUpdate = true;
  return texture;
};

// The ink marbling shader
const inkMarblingMaterial = new THREE.ShaderMaterial({
  uniforms: {
    iFrame: { value: 0 },
    iResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight)
    },
    iTime: { value: 0 },
    iMouse: { value: new THREE.Vector4(0, 0, 0, 0) },
    iChannel0: { value: null },
    inkViscosity: { value: params.inkViscosity },
    inkDiffusion: { value: params.inkDiffusion },
    turbulence: { value: params.turbulence },
    flowIntensity: { value: params.flowIntensity },
    inkEdgeDetail: { value: params.inkEdgeDetail },
    inkGranularity: { value: params.inkGranularity },
    paperTexture: { value: params.paperTexture },
    lightAbsorption: { value: params.lightAbsorption },
    inkSurfaceTension: { value: params.inkSurfaceTension },
    forceIntensity: { value: params.forceIntensity },
    decayRate: { value: params.decayRate },
    feedbackStrength: { value: params.feedbackStrength },
    autoMove: { value: params.autoMove },
    autoMoveWhenInactive: { value: params.autoMoveWhenInactive },
    movementRadius: { value: params.movementRadius },
    movementSpeed: { value: params.movementSpeed }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform int iFrame;
    uniform vec2 iResolution;
    uniform float iTime;
    uniform vec4 iMouse;
    uniform sampler2D iChannel0;
    
    uniform float inkViscosity;
    uniform float inkDiffusion;
    uniform float turbulence;
    uniform float flowIntensity;
    uniform float inkEdgeDetail;
    uniform float inkGranularity;
    uniform float paperTexture;
    uniform float lightAbsorption;
    uniform float inkSurfaceTension;
    uniform float forceIntensity;
    uniform float decayRate;
    uniform float feedbackStrength;
    uniform bool autoMove;
    uniform bool autoMoveWhenInactive;
    uniform float movementRadius;
    uniform float movementSpeed;
    
    varying vec2 vUv;
    
    // Random functions
    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }
    
    // Get force center position
    vec2 getForceCenter(bool useAutoMovement) {
      // Return either mouse position or auto-movement position
      if (useAutoMovement) {
        float r = 0.2 + movementRadius * sin(iTime * 0.5);
        return vec2(
          0.5 + r * 0.5 * sin(iTime * movementSpeed),
          0.5 + r * 0.5 * cos(iTime * movementSpeed)
        );
      } else {
        // Return mouse position directly, already normalized
        return vec2(iMouse.x, iMouse.y);
      }
    }
    
    // Paper texture simulation
    float paperGrain(vec2 uv, float scale) {
      float n1 = noise(uv * 1500.0 * scale);
      float n2 = noise(uv * 3700.0 * scale);
      return mix(n1, n2, 0.6) * paperTexture;
    }
    
    // Create organic flow field
    vec2 organicFlow(vec2 p) {
      float noiseScale = 2.5;
      
      // Use multiple noise scales for more natural flow
      float n1 = noise(p * noiseScale + iTime * 0.2);
      float n2 = noise(p * noiseScale * 2.0 + iTime * 0.1 + 100.0);
      
      // Generate vector field from noise
      vec2 noiseGrad = vec2(n1 - n2, n2 - n1) * turbulence;
      
      return noiseGrad;
    }
    
    void main() {
      vec2 uv = vUv;
      vec2 pixelSize = 1.0 / iResolution.xy;
      
      // Get current state (R,G: flow, B: density, A: detail)
      vec4 data = texture2D(iChannel0, uv);
      vec2 flow = data.xy;
      float density = data.z;
      float detail = data.w;
      
      // Calculate force center position
      bool useAutoMovement = autoMove && (iMouse.z <= 0.5 || !autoMoveWhenInactive);
      vec2 forceCenter = getForceCenter(useAutoMovement);
      
      // Add ink from input
      vec2 toCenter = forceCenter - uv;
      float distToCenter = length(toCenter);
      
      if (distToCenter < 0.05) {
        float forceFactor = (0.05 - distToCenter) * 20.0 * forceIntensity;
        
        // Create a unique ink pattern
        float inkPattern = hash(vec2(iTime, distToCenter)) * 0.8 + 0.2;
        
        // Add density with grain
        float grain = 1.0 - (inkGranularity * 0.5 * noise(uv * 50.0 + vec2(iTime)));
        density += forceFactor * 0.5 * (0.7 + 0.3 * sin(iTime * 2.0)) * grain;
        
        // Add detail
        detail = mix(detail, inkPattern, forceFactor * 0.8);
        
        // Add directional flow
        if (iFrame > 0 && iMouse.z > 0.0) {
          vec2 mouseVel = (forceCenter - toCenter) * 0.1;
          flow += mouseVel * forceFactor * flowIntensity;
        }
      }
      
      // Get organic flow
      vec2 p = (uv * 2.0 - 1.0);
      p.x *= iResolution.x / iResolution.y;
      vec2 orgFlow = organicFlow(p) * 0.02;
      
      // Apply organic flow
      flow = mix(flow, orgFlow, 0.04);
      
      // Add density gradients for more interesting flow
      vec2 densityGrad;
      densityGrad.x = texture2D(iChannel0, uv + vec2(pixelSize.x, 0.0)).z - 
                     texture2D(iChannel0, uv - vec2(pixelSize.x, 0.0)).z;
      densityGrad.y = texture2D(iChannel0, uv + vec2(0.0, pixelSize.y)).z - 
                     texture2D(iChannel0, uv - vec2(0.0, pixelSize.y)).z;
      
      // Modulate by surface tension
      densityGrad *= (1.0 - inkSurfaceTension * 0.5);
      
      // Add turbulence
      flow += densityGrad * 0.03 * detail * turbulence;
      
      // Diffusion from neighbors
      vec4 n1 = texture2D(iChannel0, uv + vec2(pixelSize.x, 0.0));
      vec4 n2 = texture2D(iChannel0, uv - vec2(pixelSize.x, 0.0));
      vec4 n3 = texture2D(iChannel0, uv + vec2(0.0, pixelSize.y));
      vec4 n4 = texture2D(iChannel0, uv - vec2(0.0, pixelSize.y));
      
      // Calculate Laplacian for diffusion
      float laplacianD = (n1.z + n2.z + n3.z + n4.z - 4.0 * density);
      
      // Apply diffusion
      density += laplacianD * inkDiffusion * 0.02;
      
      // Paper interaction
      float paper = paperGrain(uv, 1.0);
      
      // Non-uniform diffusion for marbling
      float diffusionRate = inkDiffusion * (0.8 + 0.4 * detail + 0.2 * paper);
      density += laplacianD * diffusionRate * 0.01;
      
      // Advection - trace back along flow
      vec2 prevPos = uv - flow * 8.0 * pixelSize;
      
      if (prevPos.x >= 0.0 && prevPos.x <= 1.0 && prevPos.y >= 0.0 && prevPos.y <= 1.0) {
        vec4 prevData = texture2D(iChannel0, prevPos);
        
        // Advect with viscosity
        float advectionRate = mix(0.5, 0.95, inkViscosity);
        density = mix(density, prevData.z, advectionRate);
        detail = mix(detail, prevData.w, advectionRate - 0.1);
      }
      
      // Create sharp edges
      float sharp = 3.0 + 5.0 * inkEdgeDetail;
      float edgeThreshold = mix(0.3, 0.1, inkEdgeDetail);
      
      // Non-linear filtering for edges
      float inkEdge = smoothstep(edgeThreshold, 0.5, density * (1.0 + 0.2 * detail));
      density = mix(density, inkEdge, inkEdgeDetail * 0.7);
      
      // Create detail structure
      float detailStrength = mix(0.05, 0.2, inkGranularity);
      detail = mix(detail, density * (1.0 - density) * 4.0, detailStrength);
      
      // Light absorption
      float absorption = mix(0.5, 1.0, lightAbsorption);
      density = pow(density, 1.0 / absorption);
      
      // Add paper grain
      density *= (1.0 - paper * 0.15); 
      
      // Apply decay
      flow *= decayRate;
      density *= mix(0.995, decayRate, 0.7);
      
      // Boundary conditions
      float borderWidth = 0.02;
      if (uv.x < borderWidth || uv.x > 1.0 - borderWidth || 
          uv.y < borderWidth || uv.y > 1.0 - borderWidth) {
        flow *= 0.9;
      }
      
      // Limit flow speed
      float maxFlow = 0.1 * flowIntensity;
      if (length(flow) > maxFlow) {
        flow = normalize(flow) * maxFlow;
      }
      
      // Ensure density range
      density = clamp(density, 0.0, 1.0);
      
      // Output final state
      gl_FragColor = vec4(flow, density, detail);
    }
  `
});

// The renderer shader
const renderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    iResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight)
    },
    iTime: { value: 0 },
    iChannel0: { value: null },
    primaryColor: { value: new THREE.Vector3(...params.primaryColor) },
    accentColor: { value: new THREE.Vector3(...params.accentColor) },
    colorIntensity: { value: params.colorIntensity },
    colorSaturation: { value: params.colorSaturation }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec2 iResolution;
    uniform float iTime;
    uniform sampler2D iChannel0;
    uniform vec3 primaryColor;
    uniform vec3 accentColor;
    uniform float colorIntensity;
    uniform float colorSaturation;
    
    varying vec2 vUv;
    
    // Simple noise function
    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    
    // Paper grain simulation
    float paperGrain(vec2 uv) {
      float noise1 = hash(uv * 1234.0);
      float noise2 = hash(uv * 3456.0);
      return mix(noise1, noise2, 0.6) * 0.05;
    }
    
    void main() {
      vec2 uv = vUv;
      
      // Get simulation data
      vec4 data = texture2D(iChannel0, uv);
      
      // Extract density and detail
      float density = data.z;
      float detail = data.w;
      
      // Create paper background with grain
      float grain = paperGrain(uv * 1500.0) + paperGrain(uv * 4000.0) * 0.5;
      
      // Base paper color - warmer off-white for realism
      vec3 paperColor = vec3(0.98, 0.96, 0.94) * (1.0 - grain * 0.9);
      
      // Scale ink with detail for more variegation
      float inkIntensity = density * mix(0.9, 1.1, detail);
      
      // Apply ink color with more intensity for better visibility
      vec3 inkColor = primaryColor * (inkIntensity * colorIntensity * 1.2);
      
      // Add undertones with more variation
      inkColor += accentColor * inkIntensity * inkIntensity * detail * 0.9;
      
      // Enhanced edge highlighting for more realistic wet ink look
      float edgeHighlight = pow(density * (1.0 - density) * 5.0, 2.0) * 0.25;
      
      // Light effects at edges - more visible
      vec3 highlight = mix(accentColor, vec3(1.0), 0.6) * edgeHighlight;
      
      // Stronger tonal variation
      float toneVar = sin(uv.x * 8.0 + uv.y * 6.0 + iTime * 0.1) * 0.08 + 1.0;
      inkColor *= toneVar;
      
      // Sharper transition between paper and ink
      vec3 finalColor = mix(paperColor, inkColor, smoothstep(0.03, 0.92, inkIntensity));
      
      // Add highlights with more intensity
      finalColor += highlight * 1.3;
      
      // Add subtle refraction
      float refraction = (1.0 - density) * density * 4.0 * 0.015;
      vec2 refractionOffset = data.xy * refraction;
      vec3 refractedLight = texture2D(iChannel0, uv + refractionOffset).zzz * 0.1;
      finalColor += refractedLight * accentColor;
      
      // Ambient occlusion
      float ao = clamp(density * 0.2, 0.0, 0.1);
      finalColor *= (1.0 - ao);
      
      // Adjust saturation
      float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
      finalColor = mix(vec3(luminance), finalColor, colorSaturation);
      
      // Output final color
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
});

// Create quads for simulation and rendering
const simulationQuad = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  inkMarblingMaterial
);
simulationScene.add(simulationQuad);

const renderQuad = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  renderMaterial
);
renderScene.add(renderQuad);

// Add stats
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

// Add error handler
window.addEventListener("error", function (e) {
  console.error(
    "JavaScript error:",
    e.message,
    "at line",
    e.lineno,
    "in file",
    e.filename
  );
});

// Window resize handler
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height);
  renderTarget1.setSize(width, height);
  renderTarget2.setSize(width, height);

  if (inkMarblingMaterial && inkMarblingMaterial.uniforms)
    inkMarblingMaterial.uniforms.iResolution.value.set(width, height);
  if (renderMaterial && renderMaterial.uniforms)
    renderMaterial.uniforms.iResolution.value.set(width, height);
});

// Create GUI
const gui = new GUI();

// Simulation type selector
const typeFolder = gui.addFolder("Simulation Type");
typeFolder.add(params, "simulationType", {
  "Ink Marbling": "inkMarbling"
});
typeFolder.open();

// Color presets
const presetFolder = gui.addFolder("Color Presets");
presetFolder
  .add(params, "preset", {
    "Dark Ink": "ink",
    "Sumi-e": "sumi",
    Sepia: "sepia",
    "Blue Ink": "blueInk",
    "Red Ink": "redInk"
  })
  .onChange((value) => {
    applyPreset(value);
  });
presetFolder.open();

// Common parameters
const commonFolder = gui.addFolder("Common Parameters");
commonFolder.add(params, "forceIntensity", 0.1, 5.0).onChange((value) => {
  if (inkMarblingMaterial && inkMarblingMaterial.uniforms)
    inkMarblingMaterial.uniforms.forceIntensity.value = value;
});
commonFolder.add(params, "decayRate", 0.9, 0.999).onChange((value) => {
  if (inkMarblingMaterial && inkMarblingMaterial.uniforms)
    inkMarblingMaterial.uniforms.decayRate.value = value;
});
commonFolder.add(params, "feedbackStrength", 0.1, 0.99).onChange((value) => {
  if (inkMarblingMaterial && inkMarblingMaterial.uniforms)
    inkMarblingMaterial.uniforms.feedbackStrength.value = value;
});

// Ink Marbling parameters
const inkFolder = gui.addFolder("Ink Marbling Parameters");
inkFolder.add(params, "inkViscosity", 0.5, 0.99).onChange((value) => {
  if (inkMarblingMaterial && inkMarblingMaterial.uniforms)
    inkMarblingMaterial.uniforms.inkViscosity.value = value;
});
inkFolder.add(params, "inkDiffusion", 0.2, 1.0).onChange((value) => {
  if (inkMarblingMaterial && inkMarblingMaterial.uniforms)
    inkMarblingMaterial.uniforms.inkDiffusion.value = value;
});
inkFolder.add(params, "turbulence", 0.5, 3.0).onChange((value) => {
  if (inkMarblingMaterial && inkMarblingMaterial.uniforms)
    inkMarblingMaterial.uniforms.turbulence.value = value;
});
inkFolder.add(params, "flowIntensity", 0.1, 3.0).onChange((value) => {
  if (inkMarblingMaterial && inkMarblingMaterial.uniforms)
    inkMarblingMaterial.uniforms.flowIntensity.value = value;
});

// Realistic ink parameters
const realInkFolder = gui.addFolder("Realistic Ink Effects");
realInkFolder.add(params, "inkEdgeDetail", 0.0, 1.0).onChange((value) => {
  if (inkMarblingMaterial && inkMarblingMaterial.uniforms)
    inkMarblingMaterial.uniforms.inkEdgeDetail.value = value;
});
realInkFolder.add(params, "inkGranularity", 0.0, 1.0).onChange((value) => {
  if (inkMarblingMaterial && inkMarblingMaterial.uniforms)
    inkMarblingMaterial.uniforms.inkGranularity.value = value;
});
realInkFolder.add(params, "paperTexture", 0.0, 1.0).onChange((value) => {
  if (inkMarblingMaterial && inkMarblingMaterial.uniforms)
    inkMarblingMaterial.uniforms.paperTexture.value = value;
});
realInkFolder.add(params, "lightAbsorption", 0.5, 1.0).onChange((value) => {
  if (inkMarblingMaterial && inkMarblingMaterial.uniforms)
    inkMarblingMaterial.uniforms.lightAbsorption.value = value;
});
realInkFolder.add(params, "inkSurfaceTension", 0.5, 1.0).onChange((value) => {
  if (inkMarblingMaterial && inkMarblingMaterial.uniforms)
    inkMarblingMaterial.uniforms.inkSurfaceTension.value = value;
});

// Color settings
const colorFolder = gui.addFolder("Color Settings");
colorFolder.addColor(params, "primaryColor").onChange((value) => {
  renderMaterial.uniforms.primaryColor.value.set(...value);
});
colorFolder.addColor(params, "accentColor").onChange((value) => {
  renderMaterial.uniforms.accentColor.value.set(...value);
});
colorFolder.add(params, "colorIntensity", 1.0, 10.0).onChange((value) => {
  renderMaterial.uniforms.colorIntensity.value = value;
});
colorFolder.add(params, "colorSaturation", 0.0, 2.0).onChange((value) => {
  renderMaterial.uniforms.colorSaturation.value = value;
});

// Auto movement parameters
const movementFolder = gui.addFolder("Auto Movement");
movementFolder.add(params, "autoMove").onChange((value) => {
  if (inkMarblingMaterial && inkMarblingMaterial.uniforms)
    inkMarblingMaterial.uniforms.autoMove.value = value;
});
movementFolder.add(params, "autoMoveWhenInactive").onChange((value) => {
  if (inkMarblingMaterial && inkMarblingMaterial.uniforms)
    inkMarblingMaterial.uniforms.autoMoveWhenInactive.value = value;
});
movementFolder.add(params, "movementRadius", 0.1, 1.0).onChange((value) => {
  if (inkMarblingMaterial && inkMarblingMaterial.uniforms)
    inkMarblingMaterial.uniforms.movementRadius.value = value;
});
movementFolder.add(params, "movementSpeed", 0.01, 1.0).onChange((value) => {
  if (inkMarblingMaterial && inkMarblingMaterial.uniforms)
    inkMarblingMaterial.uniforms.movementSpeed.value = value;
});

// Open specific folders
commonFolder.open();
colorFolder.open();
movementFolder.open();
realInkFolder.open();
inkFolder.open();

// Initialize targets
let currentTarget = renderTarget1;
let previousTarget = renderTarget2;
let frameCount = 0;

// Create aliases for backward compatibility
window.fluidDynamicsMaterial = inkMarblingMaterial;
window.curlNoiseFlowMaterial = inkMarblingMaterial;

// Initialize first frame
const initialTexture = initTexture();
inkMarblingMaterial.uniforms.iChannel0.value = initialTexture;
renderer.setRenderTarget(previousTarget);
renderer.render(simulationScene, camera);

// Animation loop
function animate() {
  try {
    requestAnimationFrame(animate);

    // Update time
    const time = performance.now() * 0.001;

    // Update simulation shader uniforms
    if (inkMarblingMaterial && inkMarblingMaterial.uniforms) {
      inkMarblingMaterial.uniforms.iTime.value = time;
      inkMarblingMaterial.uniforms.iFrame.value = frameCount++;

      // Check if mouse is inactive
      const inactiveTime = time - lastMouseMoveTime / 1000;
      const isInactive = inactiveTime > 1.0;

      // Update mouse uniform - z component is 1.0 when active
      // No need to normalize mouse coordinates here, we already did that in the event listener
      const mouseUniform = new THREE.Vector4(
        mouse.x,
        mouse.y,
        mouseActive && !isInactive ? 1.0 : 0.0,
        0.0
      );

      // Log mouse position for debugging
      if (frameCount % 60 === 0 && mouseActive) {
        console.log(
          "Mouse position:",
          mouse.x,
          mouse.y,
          "Active:",
          mouseActive
        );
      }

      inkMarblingMaterial.uniforms.iMouse.value.copy(mouseUniform);

      // Pass previous frame
      inkMarblingMaterial.uniforms.iChannel0.value = previousTarget.texture;
    }

    // Update renderer time
    if (renderMaterial && renderMaterial.uniforms) {
      renderMaterial.uniforms.iTime.value = time;
    }

    // Render simulation to current target
    renderer.setRenderTarget(currentTarget);
    renderer.render(simulationScene, camera);

    // Render visualization
    renderMaterial.uniforms.iChannel0.value = currentTarget.texture;
    renderer.setRenderTarget(null);
    renderer.render(renderScene, camera);

    // Swap buffers
    const temp = currentTarget;
    currentTarget = previousTarget;
    previousTarget = temp;

    // Update stats
    stats.update();
  } catch (error) {
    console.error(
      "Animation error details:",
      error.name,
      error.message,
      error.stack
    );
  }
}

animate();

// Custom cursor implementation with throttling for better performance
const cursor = document.querySelector(".custom-cursor");
let lastCursorUpdate = 0;

// Make sure the cursor variable is defined
if (cursor) {
  document.addEventListener("mousemove", (e) => {
    // Throttle cursor updates to every 16ms (approx 60fps)
    const now = performance.now();
    if (now - lastCursorUpdate > 16) {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
      lastCursorUpdate = now;
    }
  });

  // Make cursor larger on hover over interactive elements
  document.addEventListener("mouseover", (e) => {
    if (
      e.target.tagName === "BUTTON" ||
      e.target.tagName === "A" ||
      e.target.classList.contains("interactive")
    ) {
      cursor.style.width = "calc(var(--cursor-size) * 2)";
      cursor.style.height = "calc(var(--cursor-size) * 2)";
    }
  });

  // Reset cursor size when not hovering over interactive elements
  document.addEventListener("mouseout", (e) => {
    if (
      e.target.tagName === "BUTTON" ||
      e.target.tagName === "A" ||
      e.target.classList.contains("interactive")
    ) {
      cursor.style.width = "var(--cursor-size)";
      cursor.style.height = "var(--cursor-size)";
    }
  });

  // Hide system cursor when custom cursor is active
  document.body.style.cursor = "none";

  // Handle cursor on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      // Position cursor in the center initially
      cursor.style.left = `${window.innerWidth / 2}px`;
      cursor.style.top = `${window.innerHeight / 2}px`;
    });
  } else {
    // DOM already loaded, position cursor now
    cursor.style.left = `${window.innerWidth / 2}px`;
    cursor.style.top = `${window.innerHeight / 2}px`;
  }
}