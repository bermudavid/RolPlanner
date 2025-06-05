<template> 
  <div class="map-viewer-wrapper">
    <div ref="mapContainer" class="map-viewer-container">
        <p v-if="modelLoadError" class="error-message">{{ modelLoadError }}</p>
    </div>
    <div v-if="loadingProgress < 1" class="loading-overlay">
      <div class="spinner" />
      <p>{{ Math.round(loadingProgress * 100) }}%</p>
    </div>
  </div>
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
      loadingProgress: 0, 
      modelLoadError: null,
      resizeObserver: null,
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
      this.resizeObserver = new ResizeObserver(() => {
        this.onWindowResize();
      });
      this.resizeObserver.observe(container);
    },

    loadModel() {
      if (!this.modelUrl) return;
 
      this.loadingProgress = 0; 
      // reset any previous error
      this.modelLoadError = null;
 
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
          this.loadingProgress = 1;
        },
        (xhr) => {
          if (xhr.lengthComputable) {
            this.loadingProgress = xhr.loaded / xhr.total;
          }
          this.modelLoadError = null;
        },
        (error) => {
          console.error('An error happened during model loading:', error);
          this.modelLoadError = `Failed to load model: ${error?.message || error}`;
        }
      );
    },
    
    cleanupModel() {
      if (!this.loadedModel) return;

      // Traverse the loaded model and dispose geometries, materials and textures
      this.loadedModel.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }

          if (child.material) {
            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];

            materials.forEach((mat) => {
              // dispose textures attached to the material
              Object.keys(mat).forEach((key) => {
                const value = mat[key];
                if (value && value.isTexture) {
                  value.dispose();
                }
              });

              mat.dispose();
            });
          }
        }
      });

      // Remove the model from the scene and clear reference
      this.scene.remove(this.loadedModel);
      this.loadedModel = null;
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
      if (this.resizeObserver && this.$refs.mapContainer) {
        this.resizeObserver.unobserve(this.$refs.mapContainer);
        this.resizeObserver.disconnect();
      }
      this.resizeObserver = null;
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
.map-viewer-wrapper {
  position: relative;
}

.map-viewer-container {
  width: 100%;
  height: 100%;
  border: 1px solid #ccc;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.error-message {
  color: #ff6b6b;
  background-color: rgba(255, 107, 107, 0.1);
  border: 1px solid #ff6b6b;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
  text-align: center;
  font-size: 14px;
}
</style>
