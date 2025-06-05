import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import MapViewer from '../MapViewer.vue';

// Mock GLTFLoader to avoid loading real files
vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    load(url, onLoad) {
      onLoad && onLoad({ scene: {} });
    }
  }
}));

// Ensure cancelAnimationFrame exists for cleanup
if (typeof cancelAnimationFrame === 'undefined') {
  global.cancelAnimationFrame = vi.fn();
}

describe('MapViewer.vue', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls initThree on mount and registers resize listener', () => {
    const initSpy = vi.spyOn(MapViewer.methods, 'initThree').mockImplementation(function () {
      window.addEventListener('resize', this.onWindowResize);
    });
    vi.spyOn(MapViewer.methods, 'loadModel').mockImplementation(() => {});
    vi.spyOn(MapViewer.methods, 'animate').mockImplementation(() => {});

    const addSpy = vi.spyOn(window, 'addEventListener');

    const wrapper = mount(MapViewer, { props: { modelUrl: 'dummy.glb' } });

    expect(initSpy).toHaveBeenCalled();
    expect(addSpy).toHaveBeenCalledWith('resize', wrapper.vm.onWindowResize);

    wrapper.unmount();
  });

  it('unregisters resize event and disposes resources on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const cancelSpy = vi.spyOn(global, 'cancelAnimationFrame');

    const sceneTraverse = vi.fn();
    const rendererDispose = vi.fn();
    const controlsDispose = vi.fn();
    const controlsRemove = vi.fn();
    const canvas = document.createElement('canvas');
    const parent = document.createElement('div');
    parent.appendChild(canvas);

    const initSpy = vi.spyOn(MapViewer.methods, 'initThree').mockImplementation(function () {
      window.addEventListener('resize', this.onWindowResize);
      this.scene = { traverse: sceneTraverse };
      this.camera = {};
      this.renderer = { dispose: rendererDispose, domElement: canvas };
      this.controls = { dispose: controlsDispose, removeEventListener: controlsRemove };
    });
    vi.spyOn(MapViewer.methods, 'loadModel').mockImplementation(() => {});
    vi.spyOn(MapViewer.methods, 'animate').mockImplementation(function () {
      this.animationFrameId = 99;
    });

    const wrapper = mount(MapViewer, { props: { modelUrl: 'dummy.glb' } });
    expect(addSpy).toHaveBeenCalledWith('resize', wrapper.vm.onWindowResize);

    wrapper.unmount();

    expect(removeSpy).toHaveBeenCalledWith('resize', wrapper.vm.onWindowResize);
    expect(cancelSpy).toHaveBeenCalledWith(99);
    expect(controlsRemove).toHaveBeenCalledWith('change', wrapper.vm.onCameraChange);
    expect(controlsDispose).toHaveBeenCalled();
    expect(sceneTraverse).toHaveBeenCalled();
    expect(rendererDispose).toHaveBeenCalled();
    expect(wrapper.vm.scene).toBeNull();
    expect(wrapper.vm.camera).toBeNull();
    expect(wrapper.vm.renderer).toBeNull();
    expect(wrapper.vm.controls).toBeNull();
  });
});
