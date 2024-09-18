import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { useContextt } from './ContextProvider';

const ThreeDPreview = ({ url }) => {
  const { preloadedModel, setPreloadedModel, modalLoad, setModelLoad } = useContextt();
  const sceneRef = useRef(null);
  const interactingRef = useRef(false);
  const modelRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const composerRef = useRef(null);
  const controlsRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  useEffect(() => {
    if (!preloadedModel) {
      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          setPreloadedModel(gltf.scene);
        },
        undefined,
        (error) => {
          console.error('Error preloading 3D model:', error);
        }
      );
    }
  }, [url, preloadedModel, setPreloadedModel]);

  useEffect(() => {
    if (!preloadedModel) return;

    if (sceneRef.current) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, 0, 0.1, 1000);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(600, 500);
      renderer.physicallyCorrectLights = true;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.5;
      rendererRef.current = renderer;

      sceneRef.current.innerHTML = '';
      sceneRef.current.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
      scene.add(ambientLight);

      const directionalLight1 = new THREE.DirectionalLight(0xffffff, 2);
      directionalLight1.position.set(1, 1, 1).normalize();
      scene.add(directionalLight1);

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight2.position.set(-1, -1, -1).normalize();
      scene.add(directionalLight2);

      const composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(600, 500),
        1.5,
        0.4,
        0.85
      );
      composer.addPass(bloomPass);
      composerRef.current = composer;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      controls.screenSpacePanning = false;
      controls.minDistance = 1;
      controls.maxDistance = 10;
      controlsRef.current = controls;

      controls.addEventListener('start', () => (interactingRef.current = true));
      controls.addEventListener('end', () => (interactingRef.current = false));

      modelRef.current = preloadedModel;
      updateModelScale();
      scene.add(preloadedModel);

      const box = new THREE.Box3().setFromObject(preloadedModel);
      const center = box.getCenter(new THREE.Vector3());
      preloadedModel.position.sub(center);

      camera.position.set(2, 1, 5);
      camera.lookAt(center);

      const animate = () => {
        animationFrameIdRef.current = requestAnimationFrame(animate);
        if (!interactingRef.current) {
          preloadedModel.rotation.y += 0.01;
        }
        controls.update();
        composer.render();
      };
      animate();
      setModelLoad(false);

      const handleResize = () => {
        const renderer = rendererRef.current;
        const camera = cameraRef.current;
        const composer = composerRef.current;
        if (sceneRef.current && renderer && camera && composer) {
          const width = sceneRef.current.clientWidth;
          renderer.setSize(width, 500);
          composer.setSize(width, 500);
          camera.aspect = width / 500;
          camera.updateProjectionMatrix();
        }
        updateModelScale();
      };

      const handleScroll = () => {
        const canvas = rendererRef.current?.domElement;
        if (canvas) {
          const { top, bottom } = canvas.getBoundingClientRect();
          const windowHeight = window.innerHeight;

          const isVisible = top < windowHeight && bottom > windowHeight * 0.27;

          canvas.style.transition = 'opacity 0.5s';
          canvas.style.opacity = isVisible ? '1' : '0';
        }
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll);

      handleScroll();
      handleResize();

      return () => {
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
        }

        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll);
        controls.dispose();
      };
    }
  }, [preloadedModel]);

  const updateModelScale = () => {
    if (modelRef.current) {
      const box = new THREE.Box3().setFromObject(modelRef.current);
      const size = box.getSize(new THREE.Vector3());
      const scaleFactor = 1 / Math.max(size.x, size.y, size.z);
      modelRef.current.scale.setScalar(scaleFactor * 2);
    }
  };

  return (
    <div>
      {!modalLoad && <div ref={sceneRef} className="media-preview-3d"></div>}
    </div>
  );
};

export default ThreeDPreview;
