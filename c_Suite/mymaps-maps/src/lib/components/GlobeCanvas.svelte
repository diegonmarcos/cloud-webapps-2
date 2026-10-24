<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3Geo from 'd3-geo';
  import { timer } from 'd3-timer';
  import * as topojson from 'topojson-client';
  import {
    currentProjectionConfig,
    rotation,
    scale,
    autoRotate,
    isGlobe,
    panOffset
  } from '$lib/stores/projectionStore';

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let width = $state(0);
  let height = $state(0);
  let worldData: any = $state(null);
  let isDragging = $state(false);
  let dragStart: [number, number] = [0, 0];
  let rotationStart: [number, number, number] = [0, 0, 0];
  let panStart: [number, number] = [0, 0];

  // Touch handling
  let lastTouchDistance = 0;
  let lastTouchCenter: [number, number] = [0, 0];
  let isTouching = false;
  let touchRotationStart: [number, number, number] = [0, 0, 0];

  function getTouchDistance(touches: TouchList): number {
    if (touches.length < 2) return 0;
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getTouchCenter(touches: TouchList): [number, number] {
    if (touches.length < 2) {
      return [touches[0].clientX, touches[0].clientY];
    }
    return [
      (touches[0].clientX + touches[1].clientX) / 2,
      (touches[0].clientY + touches[1].clientY) / 2
    ];
  }

  function handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    isTouching = true;

    if (e.touches.length === 1) {
      // Single touch - start rotation/pan
      dragStart = [e.touches[0].clientX, e.touches[0].clientY];
      if ($isGlobe) {
        touchRotationStart = [...$rotation];
        autoRotate.set(false);
      } else {
        panStart = [...$panOffset];
      }
    } else if (e.touches.length === 2) {
      // Two fingers - prepare for pinch zoom
      lastTouchDistance = getTouchDistance(e.touches);
      lastTouchCenter = getTouchCenter(e.touches);
    }
  }

  function handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (!isTouching) return;

    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - dragStart[0];
      const dy = e.touches[0].clientY - dragStart[1];

      if ($isGlobe) {
        // Single touch drag - rotate globe
        const sensitivity = 0.3;
        rotation.set([
          touchRotationStart[0] + dx * sensitivity,
          Math.max(-90, Math.min(90, touchRotationStart[1] - dy * sensitivity)),
          touchRotationStart[2]
        ]);
      } else {
        // Pan flat map
        panOffset.set([
          panStart[0] + dx,
          panStart[1] + dy
        ]);
      }
    } else if (e.touches.length === 2) {
      // Pinch zoom
      const currentDistance = getTouchDistance(e.touches);
      if (lastTouchDistance > 0) {
        const zoomDelta = currentDistance / lastTouchDistance;
        scale.update(s => Math.max(0.5, Math.min(5, s * zoomDelta)));
      }
      lastTouchDistance = currentDistance;
    }
  }

  function handleTouchEnd(e: TouchEvent) {
    if (e.touches.length === 0) {
      isTouching = false;
      lastTouchDistance = 0;
    } else if (e.touches.length === 1) {
      // Switched from pinch to single touch
      dragStart = [e.touches[0].clientX, e.touches[0].clientY];
      touchRotationStart = [...$rotation];
      lastTouchDistance = 0;
    }
  }

  // Colors
  const colors = {
    water: '#1a3a5c',
    land: '#2d5a3d',
    landHover: '#3d7a4d',
    graticule: 'rgba(255, 255, 255, 0.12)',
    border: 'rgba(255, 255, 255, 0.25)',
    atmosphere: 'rgba(100, 150, 255, 0.15)'
  };

  // Reset pan offset when switching to globe
  $effect(() => {
    if ($isGlobe) {
      panOffset.set([0, 0]);
    }
  });

  // Load world data
  onMount(async () => {
    console.log('[GlobeCanvas] onMount called');
    console.log('[GlobeCanvas] canvas element:', canvas);
    console.log('[GlobeCanvas] canvas.parentElement:', canvas?.parentElement);

    try {
      // Fetch world topology data
      console.log('[GlobeCanvas] Fetching world data...');
      const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
      console.log('[GlobeCanvas] Fetch response:', response.status, response.ok);

      const topology = await response.json();
      console.log('[GlobeCanvas] Topology loaded:', Object.keys(topology));
      console.log('[GlobeCanvas] topology.objects:', Object.keys(topology.objects));

      worldData = {
        land: topojson.feature(topology, topology.objects.land),
        countries: topojson.feature(topology, topology.objects.countries),
        borders: topojson.mesh(topology, topology.objects.countries, (a, b) => a !== b)
      };
      console.log('[GlobeCanvas] worldData set:', !!worldData.land, !!worldData.countries, !!worldData.borders);

      // Set up canvas
      ctx = canvas.getContext('2d')!;
      console.log('[GlobeCanvas] Canvas context:', ctx);

      handleResize();

      // Start auto-rotation timer
      const rotationTimer = timer((elapsed) => {
        if ($autoRotate && $isGlobe && !isDragging) {
          rotation.update(r => [(r[0] + 0.1) % 360, r[1], r[2]]);
        }
      });

      // Resize observer
      const resizeObserver = new ResizeObserver(() => {
        console.log('[GlobeCanvas] ResizeObserver triggered');
        handleResize();
      });
      resizeObserver.observe(canvas.parentElement!);

      return () => {
        rotationTimer.stop();
        resizeObserver.disconnect();
      };
    } catch (error) {
      console.error('[GlobeCanvas] Error in onMount:', error);
    }
  });

  function handleResize() {
    const parent = canvas?.parentElement;
    console.log('[GlobeCanvas] handleResize - parent:', parent);

    if (!parent) {
      console.error('[GlobeCanvas] No parent element!');
      return;
    }

    const rect = parent.getBoundingClientRect();
    console.log('[GlobeCanvas] handleResize - rect:', rect.width, rect.height);

    width = rect.width;
    height = rect.height;

    if (width === 0 || height === 0) {
      console.warn('[GlobeCanvas] Zero dimensions!', { width, height });
      return;
    }

    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    console.log('[GlobeCanvas] Canvas size set:', canvas.width, canvas.height);

    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      console.log('[GlobeCanvas] Context scaled by:', window.devicePixelRatio);
    }
  }

  // Create projection
  function createProjection(): d3Geo.GeoProjection {
    const config = $currentProjectionConfig;
    console.log('[GlobeCanvas] createProjection - config:', config?.id);

    const projection = config.factory();
    const baseScale = Math.min(width, height) / 2.2;
    console.log('[GlobeCanvas] createProjection - baseScale:', baseScale, 'width:', width, 'height:', height);

    if ($isGlobe) {
      projection
        .translate([width / 2, height / 2])
        .scale(baseScale * $scale)
        .rotate($rotation)
        .clipAngle(90);
    } else {
      // Apply pan offset for flat maps
      projection
        .translate([width / 2 + $panOffset[0], height / 2 + $panOffset[1]])
        .scale(baseScale * $scale);
    }

    console.log('[GlobeCanvas] Projection created - scale:', projection.scale(), 'translate:', projection.translate());
    return projection;
  }

  // Draw the map
  $effect(() => {
    console.log('[GlobeCanvas] $effect triggered - ctx:', !!ctx, 'worldData:', !!worldData, 'width:', width, 'height:', height);

    if (!ctx || !worldData) {
      console.log('[GlobeCanvas] $effect early return - missing ctx or worldData');
      return;
    }

    if (width === 0 || height === 0) {
      console.log('[GlobeCanvas] $effect early return - zero dimensions');
      return;
    }

    console.log('[GlobeCanvas] Drawing map...');

    const projection = createProjection();
    const path = d3Geo.geoPath(projection, ctx);
    const graticule = d3Geo.geoGraticule10();

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw atmosphere (for globe)
    if ($isGlobe) {
      const center = projection([0, 0]);
      if (center) {
        const gradient = ctx.createRadialGradient(
          width / 2, height / 2, projection.scale() * 0.9,
          width / 2, height / 2, projection.scale() * 1.1
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, colors.atmosphere);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(width / 2, height / 2, projection.scale() * 1.1, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    }

    // Draw water/sphere background
    ctx.beginPath();
    if ($isGlobe) {
      ctx.arc(width / 2, height / 2, projection.scale(), 0, Math.PI * 2);
    } else {
      path({ type: 'Sphere' });
    }
    ctx.fillStyle = colors.water;
    ctx.fill();
    console.log('[GlobeCanvas] Drew water/sphere');

    // Draw graticule
    ctx.beginPath();
    path(graticule);
    ctx.strokeStyle = colors.graticule;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    console.log('[GlobeCanvas] Drew graticule');

    // Draw land
    ctx.beginPath();
    path(worldData.land);
    ctx.fillStyle = colors.land;
    ctx.fill();
    console.log('[GlobeCanvas] Drew land');

    // Draw country borders
    ctx.beginPath();
    path(worldData.borders);
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Draw sphere outline (for globe)
    if ($isGlobe) {
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, projection.scale(), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    console.log('[GlobeCanvas] Drawing complete!');
  });

  // Mouse handlers for globe rotation and flat map panning
  function handleMouseDown(e: MouseEvent) {
    isDragging = true;
    dragStart = [e.clientX, e.clientY];

    if ($isGlobe) {
      rotationStart = [...$rotation];
      autoRotate.set(false);
    } else {
      panStart = [...$panOffset];
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging) return;

    const dx = e.clientX - dragStart[0];
    const dy = e.clientY - dragStart[1];

    if ($isGlobe) {
      const sensitivity = 0.3;
      rotation.set([
        rotationStart[0] + dx * sensitivity,
        Math.max(-90, Math.min(90, rotationStart[1] - dy * sensitivity)),
        rotationStart[2]
      ]);
    } else {
      // Pan flat map
      panOffset.set([
        panStart[0] + dx,
        panStart[1] + dy
      ]);
    }
  }

  function handleMouseUp() {
    isDragging = false;
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    scale.update(s => Math.max(0.5, Math.min(5, s * delta)));
  }
</script>

<div class="canvas-container">
  <canvas
    bind:this={canvas}
    onmousedown={handleMouseDown}
    onmousemove={handleMouseMove}
    onmouseup={handleMouseUp}
    onmouseleave={handleMouseUp}
    onwheel={handleWheel}
    ontouchstart={handleTouchStart}
    ontouchmove={handleTouchMove}
    ontouchend={handleTouchEnd}
    ontouchcancel={handleTouchEnd}
    style="cursor: {isDragging ? 'grabbing' : 'grab'}; touch-action: none;"
  ></canvas>
</div>
