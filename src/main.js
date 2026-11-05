import * as THREE from "three";
import vertexShader from "./shaders/vertex.glsl?raw";
import fragmentShader from "./shaders/fragment.glsl?raw";

THREE.ColorManagement.enabled = false;

let renderer, scene, camera, material;

init();

// Setup 

function init() {
  const canvas = document.getElementById("canvas");
  document.getElementById("exportBtn").addEventListener("click", exportPNG);

  renderer = new THREE.WebGLRenderer({ canvas, preserveDrawingBuffer: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  connectColor("blueInk", "uBlue");
  connectColor("redInk", "uRed");
  connectColor("yellowInk", "uYellow");

  material = new THREE.ShaderMaterial({
    uniforms: {
      uImage: { value: null },
      uResolution: { value: new THREE.Vector2() },
      uSpacing: { value: 4.0 },
      uInkStrength: { value: 1.2 },
      uRegistration: { value: 1.0 },
      uTexture: { value: 0.04 },
      uBlue: { value: new THREE.Color("#3d5588") },
      uRed: { value: new THREE.Color("#f15060") },
      uYellow: { value: new THREE.Color("#ffe800") },
    },
    vertexShader,
    fragmentShader,
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);

  // Events
  document.getElementById("fileInput").addEventListener("change", onFileChange);
  connectSlider("spacing", "uSpacing");
  connectSlider("inkStrength", "uInkStrength");
  connectSlider("registration", "uRegistration");
  connectSlider("texture", "uTexture");
}

// Upload 

function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => setImage(img);
  img.src = URL.createObjectURL(file);
}

function setImage(img) {
  const longest = Math.max(img.width, img.height);
  const scale = Math.min(1, 1200 / longest);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  renderer.setSize(w, h, false);

  const texture = new THREE.Texture(img);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  material.uniforms.uImage.value = texture;
  material.uniforms.uResolution.value.set(w, h);

  render();
}

// Controls

function connectSlider(id, uniformName) {
  const slider = document.getElementById(id);
  if (!slider) {
    console.log(`No slider with id "${id}"`);
    return;
  }
  slider.addEventListener("input", (e) => {
    material.uniforms[uniformName].value = e.target.valueAsNumber;
    render();
  });
}

function connectColor(id, uniformName) {
  const picker = document.getElementById(id);
  if (!picker) {
    console.log(`No color picker with id "${id}"`);
    return;
  }
  picker.addEventListener("input", (e) => {
    material.uniforms[uniformName].value.set(e.target.value);
    render();
  });
}

// Render 

function render() {
  renderer.render(scene, camera);
}

function exportPNG() {
  render();
  renderer.domElement.toBlob((blob) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "risome.png";
    link.click();
  });
}