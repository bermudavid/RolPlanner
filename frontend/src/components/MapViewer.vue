<template>
  <canvas ref="mapContainer" class="map-viewer-canvas"></canvas>
</template>

<script>
export default {
  name: 'MapViewer',
  props: {
    modelUrl: { // Although modelUrl is not used in this WebGPU example,
                 // we keep it to maintain component's prop interface
      type: String,
      required: true,
    },
  },
  data() {
    return {
      gpuAdapter: null,
      gpuDevice: null,
      gpuContext: null,
      gpuPipeline: null,
      vertexBuffer: null,
      indexBuffer: null,
      indexCount: 0,

      // Camera state
      cameraPhi: Math.PI / 4, // Pitch
      cameraTheta: Math.PI / 4, // Yaw
      cameraDistance: 5.0,
      cameraTarget: [0, 0, 0], // Look at origin
      viewMatrix: new Float32Array(16),
      projectionMatrix: new Float32Array(16),
      cameraUniformBuffer: null,
      cameraBindGroupLayout: null, // To store the layout for pipeline creation
      cameraBindGroup: null,

      // Lighting state
      lightDirection: new Float32Array([0.5, 1.0, 0.75]), // Example directional light
      lightColor: new Float32Array([1.0, 1.0, 1.0, 1.0]), // White light (vec4 for alignment if needed, though vec3 in shader)
      lightUniformBuffer: null,
      lightBindGroupLayout: null, // To store the layout for pipeline creation
      lightBindGroup: null,

      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0,

      animationFrameId: null, // To control the render loop
    };
  },
  async mounted() {
    console.log('MapViewer mounted, initial model URL:', this.modelUrl);
    this.setupEventListeners();
    await this.initWebGPU();
    if (this.gpuDevice) {
      // initCameraResources and initLightingResources are now called within initWebGPU
      this.updateCameraMatrices();
      await this.loadWebGPUModel(this.modelUrl);
      this.updateLightUniforms(); // Write initial light data
      this.renderWebGPU();
    }
  },
  beforeUnmount() {
    console.log('MapViewer beforeUnmount');
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.removeEventListeners();
    if (this.vertexBuffer) this.vertexBuffer.destroy();
    if (this.indexBuffer) this.indexBuffer.destroy();
    if (this.cameraUniformBuffer) this.cameraUniformBuffer.destroy();
    if (this.lightUniformBuffer) this.lightUniformBuffer.destroy();
    if (this.depthTexture) this.depthTexture.destroy();
    if (this.gpuPipeline) {
      // GPURenderPipeline does not have a destroy() method.
      // It's cleaned up by GC when no longer referenced.
      // console.log("Pipeline object would be released by GC.");
    }
    // GPUDevice also does not have a destroy() method.
    // Context loss might be handled by listening to `this.gpuDevice.lost`.
    console.log("WebGPU resources cleaned up.");
  },
  watch: {
    async modelUrl(newUrl, oldUrl) {
      if (newUrl !== oldUrl && this.gpuDevice) {
        console.log(`Model URL changed from ${oldUrl} to ${newUrl}. Reloading model.`);
        if (this.vertexBuffer) this.vertexBuffer.destroy();
        if (this.indexBuffer) this.indexBuffer.destroy();
        this.vertexBuffer = null;
        this.indexBuffer = null;
        this.indexCount = 0;
        await this.loadWebGPUModel(newUrl);
        // Camera matrices don't need update unless model loading affects camera target/distance
      }
    },
    // Watch for camera parameters changes to update matrices
    cameraPhi() { this.updateCameraMatrices(); },
    cameraTheta() { this.updateCameraMatrices(); },
    cameraDistance() { this.updateCameraMatrices(); },
  },
  methods: {
    setupEventListeners() {
      const canvas = this.$refs.mapContainer;
      if (!canvas) return;
      canvas.addEventListener('mousedown', this.handleMouseDown);
      canvas.addEventListener('mousemove', this.handleMouseMove);
      canvas.addEventListener('mouseup', this.handleMouseUp);
      canvas.addEventListener('mouseleave', this.handleMouseUp);
      canvas.addEventListener('wheel', this.handleWheel, { passive: false });
      window.addEventListener('resize', this.handleResize);
    },
    removeEventListeners() {
      const canvas = this.$refs.mapContainer;
      if (canvas) { // Check if canvas still exists
        canvas.removeEventListener('mousedown', this.handleMouseDown);
        canvas.removeEventListener('mousemove', this.handleMouseMove);
        canvas.removeEventListener('mouseup', this.handleMouseUp);
        canvas.removeEventListener('mouseleave', this.handleMouseUp);
        canvas.removeEventListener('wheel', this.handleWheel);
      }
      window.removeEventListener('resize', this.handleResize);
    },

    handleResize() {
      const canvas = this.$refs.mapContainer;
      if (!canvas || !this.gpuDevice || !this.gpuContext) return;

      // Get the device pixel ratio
      const devicePixelRatio = window.devicePixelRatio || 1;

      // Set the desired display size (css pixels)
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      // Set the actual size of the canvas buffer (physical pixels)
      const newWidth = Math.floor(displayWidth * devicePixelRatio);
      const newHeight = Math.floor(displayHeight * devicePixelRatio);

      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        console.log(`Canvas resized to: ${canvas.width}x${canvas.height}, display: ${displayWidth}x${displayHeight}`);

        // 1. Update Projection Matrix
        this.updateCameraMatrices(); // This will use the new canvas aspect ratio

        // 2. Recreate Depth Texture
        if (this.depthTexture) {
          this.depthTexture.destroy();
        }
        this.depthTexture = this.gpuDevice.createTexture({
          size: [canvas.width, canvas.height],
          format: 'depth24plus',
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        console.log("Depth texture recreated due to resize.");

        // 3. The swap chain's current texture is obtained per frame in renderWebGPU,
        // so it should adapt automatically to the new canvas size.
        // gpuContext.configure might be needed if presentationFormat changes or for specific behaviors,
        // but often not strictly for size changes if the underlying device/format is stable.
        // For now, we assume the current configuration is fine.

        // 4. If not in a continuous render loop, a redraw would be needed here.
        // Since we are, it will pick up changes on the next frame.
      }
    },

    handleMouseDown(event) {
      this.isDragging = true;
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    },
    handleMouseMove(event) {
      if (!this.isDragging) return;
      const dx = event.clientX - this.lastMouseX;
      const dy = event.clientY - this.lastMouseY;

      this.cameraTheta += dx * 0.01; // Adjust sensitivity as needed
      this.cameraPhi += dy * 0.01;

      // Clamp phi to avoid flipping
      this.cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraPhi));

      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
      // updateCameraMatrices is called by watchers
    },
    handleMouseUp() {
      this.isDragging = false;
    },
    handleWheel(event) {
      event.preventDefault(); // Prevent page scrolling
      const delta = Math.sign(event.deltaY);
      this.cameraDistance += delta * 0.5; // Adjust sensitivity
      this.cameraDistance = Math.max(1.0, Math.min(20.0, this.cameraDistance)); // Clamp distance
      // updateCameraMatrices is called by watchers
    },

    // Matrix Math (Simplified)
    createLookAtMatrix(eye, target, up) {
      const zAxis = new Float32Array(3);
      zAxis[0] = eye[0] - target[0];
      zAxis[1] = eye[1] - target[1];
      zAxis[2] = eye[2] - target[2];
      let len = Math.hypot(zAxis[0], zAxis[1], zAxis[2]);
      if (len > 0) { zAxis[0] /= len; zAxis[1] /= len; zAxis[2] /= len; }

      const xAxis = new Float32Array(3);
      xAxis[0] = up[1] * zAxis[2] - up[2] * zAxis[1];
      xAxis[1] = up[2] * zAxis[0] - up[0] * zAxis[2];
      xAxis[2] = up[0] * zAxis[1] - up[1] * zAxis[0];
      len = Math.hypot(xAxis[0], xAxis[1], xAxis[2]);
      if (len > 0) { xAxis[0] /= len; xAxis[1] /= len; xAxis[2] /= len; }

      const yAxis = new Float32Array(3);
      yAxis[0] = zAxis[1] * xAxis[2] - zAxis[2] * xAxis[1];
      yAxis[1] = zAxis[2] * xAxis[0] - zAxis[0] * xAxis[2];
      yAxis[2] = zAxis[0] * xAxis[1] - zAxis[1] * xAxis[0];

      return new Float32Array([
        xAxis[0], yAxis[0], zAxis[0], 0,
        xAxis[1], yAxis[1], zAxis[1], 0,
        xAxis[2], yAxis[2], zAxis[2], 0,
        -(xAxis[0] * eye[0] + xAxis[1] * eye[1] + xAxis[2] * eye[2]),
        -(yAxis[0] * eye[0] + yAxis[1] * eye[1] + yAxis[2] * eye[2]),
        -(zAxis[0] * eye[0] + zAxis[1] * eye[1] + zAxis[2] * eye[2]),
        1,
      ]);
    },
    createPerspectiveMatrix(fovYRadians, aspect, near, far) {
      const f = 1.0 / Math.tan(fovYRadians / 2);
      const rangeInv = 1 / (near - far);
      return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0,
      ]);
    },

    updateCameraMatrices() {
      if (!this.gpuDevice) return;

      const eyeX = this.cameraTarget[0] + this.cameraDistance * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
      const eyeY = this.cameraTarget[1] + this.cameraDistance * Math.cos(this.cameraPhi);
      const eyeZ = this.cameraTarget[2] + this.cameraDistance * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
      const eye = [eyeX, eyeY, eyeZ];

      this.viewMatrix.set(this.createLookAtMatrix(eye, this.cameraTarget, [0, 1, 0])); // Up = Y axis

      const canvas = this.$refs.mapContainer;
      const aspect = canvas ? canvas.clientWidth / canvas.clientHeight : 1;
      this.projectionMatrix.set(this.createPerspectiveMatrix(Math.PI / 4, aspect, 0.1, 100.0)); // 45deg FOV

      if (this.cameraUniformBuffer) {
        // Order: view matrix, then projection matrix
        const cameraData = new Float32Array(32); // 2 * 16 floats
        cameraData.set(this.viewMatrix, 0);
        cameraData.set(this.projectionMatrix, 16);
        this.gpuDevice.queue.writeBuffer(this.cameraUniformBuffer, 0, cameraData);
      }
       // console.log("Camera matrices updated and written to buffer");
    },

    async initWebGPU() {
      const canvas = this.$refs.mapContainer;
      // ... (rest of initWebGPU, adapter, device, context setup remains similar)
      if (!canvas) {
        console.error('Canvas element not found!');
        return;
      }

      if (!navigator.gpu) {
        console.error('WebGPU not supported on this browser!');
        alert('WebGPU not supported. Please use a browser that supports WebGPU.');
        return;
      }

      try {
        this.gpuAdapter = await navigator.gpu.requestAdapter();
        if (!this.gpuAdapter) {
          console.error('Failed to get GPU adapter.');
          alert('Failed to get GPU adapter.');
          return;
        }

        this.gpuDevice = await this.gpuAdapter.requestDevice();
        if (!this.gpuDevice) {
          console.error('Failed to get GPU device.');
          alert('Failed to get GPU device.');
          return;
        }

        this.gpuContext = canvas.getContext('webgpu');
        if (!this.gpuContext) {
          console.error('Failed to get WebGPU context from canvas.');
          alert('Failed to get WebGPU context.');
          return;
        }

        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        this.gpuContext.configure({
          device: this.gpuDevice,
          format: presentationFormat,
          alphaMode: 'opaque',
        });

        // Create render pipeline (shaders might be defined here or loaded)
        // Pipeline creation now happens after camera resources are potentially initialized
        // if its layout depends on bind groups defined in initCameraResources.
        // For simplicity, we'll ensure initCameraResources is called before createRenderPipeline if needed.
        // Or, pass necessary layouts to createRenderPipeline.

        // No, createRenderPipeline is called from initWebGPU or after it.
        // initCameraResources creates the bind group layout needed by the pipeline.
        // So, call initCameraResources first, then createRenderPipeline.
        // This is handled by the order in mounted().

        console.log('WebGPU core initialized successfully. Presentation format:', presentationFormat);
        // Pipeline is created in mounted() after initCameraResources if it depends on camera BGL
        // Actually, createRenderPipeline IS called from initWebGPU in the previous version.
        // Let's stick to that but pass the cameraBindGroupLayout to it.
        // Or, make cameraBindGroupLayout a component property.

        // Simpler: initCameraResources will make cameraBindGroupLayout available.
        // createRenderPipeline will then use this.cameraBindGroupLayout.
        // This is already implicitly handled by the order in mounted().

        // The original call to createRenderPipeline was here. Let's keep it that way.
        // It means initCameraResources must be called before this point if pipeline depends on it.
        // The current `mounted` order is: initWebGPU -> initCameraResources -> updateCameraMatrices -> loadModel -> render.
        // This means initWebGPU should not call createRenderPipeline if it needs camera BGL.
        // Let's adjust: initWebGPU only sets up device/context.
        // Pipeline creation will be in mounted or a separate step after initCameraResources.

        // For now, let's assume createRenderPipeline is called from mounted AFTER initCameraResources.
        // So remove it from here.
        // NO, the previous version of the code called createRenderPipeline from initWebGPU.
        // Let's ensure the camera BGL is ready before that.
        // The most straightforward way: initCameraResources() is called from initWebGPU()
        // before createRenderPipeline().

        // this.initCameraResources(); // Call it here!
        // Then createRenderPipeline can use this.cameraBindGroupLayout
        // this.createRenderPipeline(presentationFormat); // This was the original structure.
        // The `mounted` calls initWebGPU, which internally calls initCameraResources and createRenderPipeline.

        // Revised plan for initWebGPU:
        // 1. Get adapter, device, context.
        // 2. Configure context.
        // 3. Call initCameraResources() to setup camera UBO and BGL.
        // 4. Call initLightingResources() to setup light UBO and BGL.
        // 5. Call createRenderPipeline() which uses both BGLs.

        this.initCameraResources();
        this.initLightingResources(); // Create UBO, BGL for lighting
        this.createRenderPipeline(presentationFormat);

        console.log('WebGPU initialized with camera, lighting resources and pipeline.');

      } catch (error)
      {
        console.error('Error initializing WebGPU or related resources:', error);
        alert(`Error initializing WebGPU or related resources: ${error.message}`);
      }
    },

    initCameraResources() {
        if (!this.gpuDevice) return;
        this.cameraUniformBuffer = this.gpuDevice.createBuffer({
            size: 2 * 16 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.cameraBindGroupLayout = this.gpuDevice.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'uniform' },
            }],
        });
        this.cameraBindGroup = this.gpuDevice.createBindGroup({
            layout: this.cameraBindGroupLayout,
            entries: [{
                binding: 0,
                resource: { buffer: this.cameraUniformBuffer },
            }],
        });
        console.log("Camera resources (UBO, BGL, BG) created.");
    },

    initLightingResources() {
        if (!this.gpuDevice) return;
        // Light direction (vec3) + Light color (vec3, but use vec4 for buffer alignment if issues arise)
        // WGSL vec3 is 12 bytes. Two vec3s would be 24 bytes.
        // A common practice is to pad to vec4 boundaries (16 bytes) if mixing types,
        // but for two vec3s, it might be fine. Let's use 3 floats for direction, 3 for color.
        // Total size: (3 + 3) floats * 4 bytes/float = 24 bytes.
        // Let's ensure shader struct matches this tightly packed layout or use explicit padding/offsets.
        // Shader struct LightUniforms: direction: vec3<f32>, color: vec3<f32>
        // Total size: (3 floats for direction + 3 floats for color) * 4 bytes/float = 24 bytes.
        const lightDataSize = (3 + 3) * 4;

        this.lightUniformBuffer = this.gpuDevice.createBuffer({
            size: lightDataSize, // 24 bytes
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.lightBindGroupLayout = this.gpuDevice.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT, // Light info used in fragment shader
                buffer: { type: 'uniform' },
            }],
        });
        this.lightBindGroup = this.gpuDevice.createBindGroup({
            layout: this.lightBindGroupLayout,
            entries: [{
                binding: 0,
                resource: { buffer: this.lightUniformBuffer },
            }],
        });
        console.log("Lighting resources (UBO, BGL, BG) created.");
    },

    updateLightUniforms() {
        if (!this.gpuDevice || !this.lightUniformBuffer) return;
        // Data must match the layout expected by the shader's uniform block.
        // Shader: direction: vec3<f32>, color: vec3<f32>
        // Buffer: lightDir (Float32Array len 3), lightColor (Float32Array len 3, but buffer expects up to 4 for padding)
        const lightData = new Float32Array(3 + 4); // 3 for dir, 4 for color (padded)
        lightData.set(this.lightDirection, 0); // x, y, z
        lightData.set(this.lightColor.slice(0,3), 4); // r, g, b (skip w from lightColor if it's vec4)
                                                     // offset is in Float32Array elements, so 4 means after x,y,z and a padding float if needed.
                                                     // If shader struct is tightly packed vec3, vec3, then buffer should be too.
                                                     // Let's make buffer data reflect shader struct: vec3, vec3.
        const tightLightData = new Float32Array(3 + 3); // dir: vec3, color: vec3
        tightLightData.set(this.lightDirection, 0);
        tightLightData.set(this.lightColor, 3); // If lightColor is already vec3. Our data is vec4, so slice.
        tightLightData.set(this.lightColor.slice(0,3), 3);


        this.gpuDevice.queue.writeBuffer(this.lightUniformBuffer, 0, tightLightData);
        // console.log("Light uniforms updated.");
    },


    createRenderPipeline(presentationFormat) {
      if (!this.gpuDevice || !this.cameraBindGroupLayout || !this.lightBindGroupLayout) {
        console.error('GPU device or required bind group layouts not available for creating render pipeline.');
        return;
      }

      const vertexShaderWGSL = `
        struct CameraUniforms {
            viewMat: mat4x4<f32>,
            projMat: mat4x4<f32>,
        };
        @group(0) @binding(0) var<uniform> camera: CameraUniforms;

        struct VertexOutput {
            @builtin(position) position : vec4<f32>,
            @location(0) worldNormal: vec3<f32>,
        };

        @vertex
        fn main(@location(0) modelPos: vec3<f32>,
                @location(1) modelNormal: vec3<f32>) -> VertexOutput {
            var output: VertexOutput;
            output.position = camera.projMat * camera.viewMat * vec4<f32>(modelPos, 1.0);
            // For now, assume modelNormal is already in world space if no model matrix.
            // Or transform normal: (inverse transpose of model matrix) * modelNormal
            output.worldNormal = modelNormal; // Pass through, assuming it's world normal
            return output;
        }
      `;

      const fragmentShaderWGSL = `
        struct LightUniforms {
            direction: vec3<f32>, // Expecting 3 floats
            color: vec3<f32>,     // Expecting 3 floats
            // Total 6 floats = 24 bytes. Matches tightLightData buffer.
        };
        @group(1) @binding(0) var<uniform> light: LightUniforms;

        @fragment
        fn main(@location(0) worldNormal: vec3<f32>) -> @location(0) vec4<f32> {
            let baseColor = vec4<f32>(0.1, 0.6, 0.9, 1.0); // Original model color
            let N = normalize(worldNormal);
            let L = normalize(light.direction);
            let diffuseIntensity = max(dot(N, L), 0.0);
            let finalColor = baseColor.rgb * light.color * diffuseIntensity;
            return vec4<f32>(finalColor, baseColor.a);
        }
      `;

      const vertexModule = this.gpuDevice.createShaderModule({ code: vertexShaderWGSL });
      const fragmentModule = this.gpuDevice.createShaderModule({ code: fragmentShaderWGSL });

      const pipelineLayout = this.gpuDevice.createPipelineLayout({
        bindGroupLayouts: [this.cameraBindGroupLayout, this.lightBindGroupLayout], // Group 0 for Camera, Group 1 for Light
      });

      this.gpuPipeline = this.gpuDevice.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
          module: vertexModule,
          entryPoint: 'main',
          buffers: [
            {
              // arrayStride: 3 * 4, // vec3<f32> for position
              // attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }],
              arrayStride: 6 * 4, // pos (vec3) + normal (vec3) = 6 floats
              attributes: [
                { shaderLocation: 0, offset: 0, format: 'float32x3' }, // Position
                { shaderLocation: 1, offset: 3 * 4, format: 'float32x3' }, // Normal
              ],
            },
          ],
        },
        fragment: {
          module: fragmentModule,
          entryPoint: 'main',
          targets: [{ format: presentationFormat }],
        },
        primitive: {
          topology: 'triangle-list',
          cullMode: 'back',
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
        },
      });
      console.log('Render pipeline created/updated with camera and lighting uniforms.');
    },

    async loadWebGPUModel(modelUrl) {
      console.log('Loading WebGPU model (hardcoded cube with normals):', modelUrl);
      if (!this.gpuDevice) {
        console.error("GPU device not available for model loading.");
        return;
      }
      try {
        // Cube vertices: position (x,y,z) and normal (nx,ny,nz)
        // Each face has unique vertices because normals are face-specific for a sharp-edged cube
        const vertices = new Float32Array([
          // Front face (+Z)
          -0.5, -0.5,  0.5,  0.0,  0.0,  1.0, // Bottom-left
           0.5, -0.5,  0.5,  0.0,  0.0,  1.0, // Bottom-right
           0.5,  0.5,  0.5,  0.0,  0.0,  1.0, // Top-right
          -0.5,  0.5,  0.5,  0.0,  0.0,  1.0, // Top-left
          // Back face (-Z)
          -0.5, -0.5, -0.5,  0.0,  0.0, -1.0,
          -0.5,  0.5, -0.5,  0.0,  0.0, -1.0,
           0.5,  0.5, -0.5,  0.0,  0.0, -1.0,
           0.5, -0.5, -0.5,  0.0,  0.0, -1.0,
          // Top face (+Y)
          -0.5,  0.5, -0.5,  0.0,  1.0,  0.0,
          -0.5,  0.5,  0.5,  0.0,  1.0,  0.0,
           0.5,  0.5,  0.5,  0.0,  1.0,  0.0,
           0.5,  0.5, -0.5,  0.0,  1.0,  0.0,
          // Bottom face (-Y)
          -0.5, -0.5, -0.5,  0.0, -1.0,  0.0,
           0.5, -0.5, -0.5,  0.0, -1.0,  0.0,
           0.5, -0.5,  0.5,  0.0, -1.0,  0.0,
          -0.5, -0.5,  0.5,  0.0, -1.0,  0.0,
          // Right face (+X)
           0.5, -0.5, -0.5,  1.0,  0.0,  0.0,
           0.5,  0.5, -0.5,  1.0,  0.0,  0.0,
           0.5,  0.5,  0.5,  1.0,  0.0,  0.0,
           0.5, -0.5,  0.5,  1.0,  0.0,  0.0,
          // Left face (-X)
          -0.5, -0.5, -0.5, -1.0,  0.0,  0.0,
          -0.5, -0.5,  0.5, -1.0,  0.0,  0.0,
          -0.5,  0.5,  0.5, -1.0,  0.0,  0.0,
          -0.5,  0.5, -0.5, -1.0,  0.0,  0.0,
        ]);
        // Indices for the 24 vertices (6 faces, 4 vertices per face)
        const indices = new Uint16Array([
           0,  1,  2,  0,  2,  3, // Front
           4,  5,  6,  4,  6,  7, // Back
           8,  9, 10,  8, 10, 11, // Top
          12, 13, 14, 12, 14, 15, // Bottom
          16, 17, 18, 16, 18, 19, // Right
          20, 21, 22, 20, 22, 23, // Left
        ]);
        this.indexCount = indices.length;

        this.vertexBuffer = this.gpuDevice.createBuffer({
          size: vertices.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
          mappedAtCreation: true,
        });
        new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices);
        this.vertexBuffer.unmap();

        this.indexBuffer = this.gpuDevice.createBuffer({
          size: indices.byteLength,
          usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
          mappedAtCreation: true,
        });
        new Uint16Array(this.indexBuffer.getMappedRange()).set(indices);
        this.indexBuffer.unmap();
        console.log('Cube model (with normals) buffers created.');
      } catch (error) {
        console.error('Error loading model (hardcoded cube with normals):', error);
        this.vertexBuffer = null; this.indexBuffer = null; this.indexCount = 0;
      }
    },

    renderWebGPU() {
      if (!this.gpuDevice || !this.gpuContext || !this.gpuPipeline ||
          !this.vertexBuffer || !this.indexBuffer ||
          !this.cameraBindGroup || !this.lightBindGroup) {
        console.warn('WebGPU components not fully ready for rendering. Skipping frame.');
        if (this.animationFrameId) { // Only request next frame if loop is active
             this.animationFrameId = requestAnimationFrame(this.renderWebGPU);
        }
        return;
      }

      const canvas = this.$refs.mapContainer;
      // Ensure canvas physical size is up-to-date (e.g. if handleResize was just called)
      // This check might be redundant if handleResize correctly updates canvas.width/height
      // and these are used for depth texture creation.
      if (this.depthTexture && (this.depthTexture.width !== canvas.width || this.depthTexture.height !== canvas.height)) {
          console.warn("Depth texture size mismatch with canvas physical size. Recreating depth texture.");
          if (this.depthTexture) this.depthTexture.destroy();
          this.depthTexture = this.gpuDevice.createTexture({
              size: [canvas.width, canvas.height],
              format: 'depth24plus',
              usage: GPUTextureUsage.RENDER_ATTACHMENT,
          });
      } else if (!this.depthTexture && canvas.width > 0 && canvas.height > 0) {
          // Initial creation if not already done (e.g. if canvas had 0 size initially)
           this.depthTexture = this.gpuDevice.createTexture({
              size: [canvas.width, canvas.height],
              format: 'depth24plus',
              usage: GPUTextureUsage.RENDER_ATTACHMENT,
          });
          console.log("Depth texture created (initial).");
      }

      if (!this.depthTexture) {
          console.warn("Depth texture not available (canvas might be zero size). Skipping frame.");
          if (this.animationFrameId) {
              this.animationFrameId = requestAnimationFrame(this.renderWebGPU);
          }
          return;
      }

      const commandEncoder = this.gpuDevice.createCommandEncoder();
      const textureView = this.gpuContext.getCurrentTexture().createView();

      const renderPassDescriptor = {
        colorAttachments: [{
            view: textureView,
            clearValue: { r: 0.1, g: 0.1, b: 0.2, a: 1.0 },
            loadOp: 'clear',
            storeOp: 'store',
        }],
        depthStencilAttachment: { // Attach depth texture view
            view: this.depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
      };

      const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
      passEncoder.setPipeline(this.gpuPipeline);
      passEncoder.setBindGroup(0, this.cameraBindGroup); // Set camera uniform bind group
      passEncoder.setVertexBuffer(0, this.vertexBuffer);
      passEncoder.setIndexBuffer(this.indexBuffer, 'uint16');
      passEncoder.drawIndexed(this.indexCount, 1, 0, 0, 0);
      passEncoder.end();

      this.gpuDevice.queue.submit([commandEncoder.finish()]);
      this.animationFrameId = requestAnimationFrame(this.renderWebGPU); // Continuous render loop
    },
  },
};
</script>

<style scoped>
.map-viewer-canvas {
  width: 100%;
  height: 500px;
  border: 1px solid #000;
  background-color: #333;
  cursor: grab; /* Indicate interactivity */
}
.map-viewer-canvas:active {
    cursor: grabbing;
}
</style>
