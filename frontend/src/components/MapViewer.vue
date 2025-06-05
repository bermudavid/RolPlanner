<template>
  <div ref="mapContainer" class="map-viewer-container"></div>
</template>

<script>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { io } from 'socket.io-client';

export default {
  name: 'MapViewer',
  props: {
    modelUrl: {
      type: String,
      required: true,
    },
    sessionId: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      scene: null,
      camera: null,
      renderer: null,
      controls: null,
      animationFrameId: null,
      socket: null,
    };
  },
  mounted() {
    this.initThree();
    this.loadModel();
    this.animate();

    this.socket = io('http://localhost:3000/sessions');
    this.socket.emit('joinSession', { sessionId: this.sessionId });
    this.socket.on('cameraUpdate', payload => {
      if (payload.clientId !== this.socket.id) {
        this.updatePlayerView(payload.position, payload.quaternion);
      }
    });
  },
  beforeUnmount() {
    this.cleanupThree();
    if (this.socket) {
      this.socket.disconnect();
    }
  },
  watch: {
    modelUrl(newUrl, oldUrl) {
      if (newUrl !== oldUrl) {
        this.cleanupModel(); // Remove old model
        this.loadModel(); // Load new model
      }
    }
  },
  methods: {
    initThree() {
      const container = this.$refs.mapContainer;
      if (!container) {
        console.error("Map container not found");
        return;
      }

      // Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xcccccc);

      // Camera
      this.camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      );
      this.camera.position.set(0, 1, 5); // Adjusted for better initial view

      // Renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(this.renderer.domElement);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      this.scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 10, 7.5);
      this.scene.add(directionalLight);

      // Controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.screenSpacePanning = false;
      this.controls.minDistance = 1;
      this.controls.maxDistance = 500;
      this.controls.addEventListener('change', this.onCameraChange); // For camera sync placeholder

      // Handle resize
      window.addEventListener('resize', this.onWindowResize);
    },

    loadModel() {
      if (!this.modelUrl) return;

      const loader = new GLTFLoader();
      loader.load(
        this.modelUrl,
        (gltf) => {
          // Remove previous model if any
          if (this.loadedModel) {
            this.scene.remove(this.loadedModel);
          }
          this.loadedModel = gltf.scene;
          
          // Optional: Scale and center model
          const box = new THREE.Box3().setFromObject(this.loadedModel);
          const center = box.getCenter(new THREE.Vector3());
          this.loadedModel.position.sub(center); // Center the model
          
          // Optional: Auto-scale model to fit view (can be tricky)
          // const size = box.getSize(new THREE.Vector3());
          // const maxDim = Math.max(size.x, size.y, size.z);
          // const scale = 5 / maxDim; // Adjust '5' to desired viewing size
          // this.loadedModel.scale.set(scale, scale, scale);

          this.scene.add(this.loadedModel);
          console.log('Model loaded:', this.modelUrl);
        },
        undefined, // onProgress callback (optional)
        (error) => {
          console.error('An error happened during model loading:', error);
        }
      );
    },
    
    cleanupModel() {
        if (this.loadedModel) {
            this.scene.remove(this.loadedModel);
            // You might need to dispose geometries/materials if they are unique to this model
            // For simplicity here, we assume GLTFLoader handles disposal of its loaded resources
            // or that models are simple enough not to cause significant memory leaks on reload.
            this.loadedModel = null;
        }
    },

    animate() {
      this.animationFrameId = requestAnimationFrame(this.animate);
      if (this.controls) {
        this.controls.update();
      }
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    },

    onWindowResize() {
      if (this.camera && this.renderer && this.$refs.mapContainer) {
        const container = this.$refs.mapContainer;
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
      }
    },

    cleanupThree() {
      window.removeEventListener('resize', this.onWindowResize);
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      if (this.controls) {
        this.controls.removeEventListener('change', this.onCameraChange);
        this.controls.dispose();
      }
      // Dispose of scene objects, materials, geometries
      if (this.scene) {
        this.scene.traverse(object => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }
      if (this.renderer) {
        this.renderer.dispose();
        if (this.renderer.domElement && this.renderer.domElement.parentElement) {
           this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
        }
      }
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.controls = null;
      this.loadedModel = null; // Clear reference to the loaded model
    },

    // --- Camera Sync Placeholders ---
    onCameraChange() {
        // This function is called by OrbitControls on change
        this.sendCameraData(this.camera.position, this.camera.quaternion);
    },

    sendCameraData(position, quaternion) {
      if (this.socket) {
        this.socket.emit('cameraUpdate', {
          sessionId: this.sessionId,
          position: { x: position.x, y: position.y, z: position.z },
          quaternion: {
            x: quaternion.x,
            y: quaternion.y,
            z: quaternion.z,
            w: quaternion.w,
          },
        });
      }
    },

    updatePlayerView(position, quaternion) {
      if (this.camera) {
        this.camera.position.set(position.x, position.y, position.z);
        this.camera.quaternion.set(
          quaternion.x,
          quaternion.y,
          quaternion.z,
          quaternion.w,
        );
      }
      // Example: if you had an object representing another player's view:
      // otherPlayerCameraObject.position.set(position.x, position.y, position.z);
      // otherPlayerCameraObject.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
    },
  },
};
</script>

<style scoped>
.map-viewer-container {
  width: 100%;
  height: 500px; /* Adjust as needed */
  border: 1px solid #ccc;
}
</style>
