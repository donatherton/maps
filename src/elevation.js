'use strict';
import { Control, DomEvent, DomUtil, latLng, Popup } from './leaflet-src.esm.js';

/**
 * Leaflet control for displaying elevation profiles.
 * @type {Object}
 */
Control.Elevation = Control.extend({
  options: {
    position: 'bottomright',
  },
  /**
   * Creates the elevation chart container.
   * @param {Object} map - The Leaflet map instance
   * @returns {HTMLElement} The container element
   */
  onAdd(map) {
    const container = DomUtil.create('div', 'elev-window');
    container.id = 'elevation-div';

    const closeButton = DomUtil.create('button', 'button', container);
    closeButton.innerHTML = 'Hide >';
    closeButton.style.position = 'relative';
    closeButton.style.float = 'right';
    closeButton.style.background = 'rgba(156, 194, 34, 0.8)';
    closeButton.style.zIndex = '2';

    DomEvent.on(closeButton, 'click', () => {
      if (container.style.left === '100%') {
        container.style.left = '0%';
        closeButton.innerHTML = 'Hide >';
        closeButton.style.left = '0';
        closeButton.style.float = 'right';
      } else {
        container.style.left = '100%';
        closeButton.innerHTML = '< Open';
        closeButton.style.left = '-110px';
        closeButton.style.float = 'left';
      }
    });

    DomEvent.on(container, 'click contextmenu mousedown mousewheel dblclick touchmove', DomEvent.stopPropagation);

    return container;
  },

  /**
   * Renders elevation data on the chart.
   * @param {Array} coords - Array of coordinate objects with lat, lng, and alt
   * @param {Object} map - The Leaflet map instance
   * @returns {void}
   */
  addData(coords, map) {
    const pt = [];
    const spotMarker = new Popup({ closeButton: false });

    let heightUnitFactor = 1;
    let distUnitFactor = 1;
    let heightUnit = 'm';
    let distUnit = 'Km';
    if (localStorage.getItem('height') === 'ft') {
      heightUnitFactor = 3.28084;
      heightUnit = 'ft';
    }

    if (localStorage.getItem('dist') === 'miles') {
      distUnitFactor = 0.62137;
      distUnit = 'miles';
    }

    // Pre-calculate distances using Leaflet's efficient distanceTo
    pt[0] = [0, coords[0].alt];
    let totalDist = 0;
    for (let i = 1; i < coords.length; i++) {
      const point1 = latLng([coords[i - 1].lat, coords[i - 1].lng]);
      const point2 = latLng([coords[i].lat, coords[i].lng]);
      totalDist += point1.distanceTo(point2);
      pt.push([(totalDist / 1000).toFixed(3), Math.round(coords[i].alt)]);
    }

    // Create and size canvas dynamically
    const canvas = document.createElement('canvas');
    canvas.id = 'elevation';
    canvas.height = 75;
    const container = document.getElementById('elevation-div');
    container.appendChild(canvas);
    
    // Set canvas width based on container
    canvas.width = container.clientWidth - 20;

    const ctx = canvas.getContext('2d');

    const maxHeight = Math.max(...pt.map(p => p[1]));
    const heightFactor = (canvas.height - 25) / maxHeight;
    const totalDistance = Number(pt[pt.length - 1][0]);
    const widthFactor = canvas.width / totalDistance;

    // Pre-calculate screen coordinates for all points
    const screenPoints = pt.map((point, i) => ({
      screenX: (Number(point[0]) * widthFactor) + 1,
      screenY: canvas.height - ((point[1]) * heightFactor) - 12,
      dist: Number(point[0]),
      elev: point[1],
      lat: coords[i].lat,
      lng: coords[i].lng
    }));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    
    // X axis
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.stroke();
    ctx.fillText((totalDistance * distUnitFactor).toFixed(3) + distUnit, canvas.width - 55, canvas.height - 2);
    
    // Y axis
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, canvas.height);
    ctx.stroke();
    ctx.fillText('0', 2, canvas.height - 2);
    ctx.fillText((maxHeight * heightUnitFactor).toFixed(0) + heightUnit, 2, 10);

    // Draw elevation profile using pre-calculated coordinates
    ctx.beginPath();
    ctx.moveTo(screenPoints[0].screenX, canvas.height - 12);
    screenPoints.forEach(point => {
      ctx.lineTo(point.screenX, point.screenY);
    });
    ctx.lineTo(canvas.width, canvas.height - 12);
    ctx.closePath();
    ctx.fillStyle = 'rgba(156, 194, 34, 0.8)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(156, 194, 34, 0.8)';
    ctx.stroke();

    // Create mouseover overlay canvas
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.id = 'mouseover';
    overlayCanvas.height = 100;
    overlayCanvas.width = canvas.width;
    container.appendChild(overlayCanvas);
    const ctx2 = overlayCanvas.getContext('2d');

    // Performance optimizations
    let lastX = -1000;
    let rafId = null;
    let canvasRect = canvas.getBoundingClientRect();
    
    // Cache canvas rect and update on resize
    const updateCanvasRect = () => {
      canvasRect = canvas.getBoundingClientRect();
    };
    window.addEventListener('resize', updateCanvasRect);

    // Binary search for finding nearest point
    function findNearestPoint(targetDist) {
      let left = 0;
      let right = screenPoints.length - 1;
      
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (screenPoints[mid].dist <= targetDist) {
          if (mid === screenPoints.length - 1 || screenPoints[mid + 1].dist > targetDist) {
            return mid;
          }
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }
      return 0;
    }

    // Optimized drawing function using requestAnimationFrame
    function drawOverlay(x) {
      // Clear both old and new regions to ensure text is removed
      const clearWidth = 150; // Wide enough to cover text extending to the right
      const clearStart = Math.max(0, Math.min(lastX, x) - clearWidth/2);
      ctx2.clearRect(clearStart, 0, clearWidth * 2, overlayCanvas.height);
      
      // Draw vertical line
      ctx2.beginPath();
      ctx2.moveTo(x, 45);
      ctx2.lineTo(x, 99);
      ctx2.lineWidth = 1;
      ctx2.strokeStyle = '#637E0B';
      ctx2.stroke();
      
      // Find nearest point using binary search
      const targetDist = (x / canvasRect.width) * totalDistance;
      const index = findNearestPoint(targetDist);
      const point = screenPoints[index];
      
      // Update map marker
      spotMarker
        .setLatLng([point.lat, point.lng])
        .setContent(`${(point.dist * distUnitFactor).toFixed(3)} ${distUnit}<br>${point.elev} ${heightUnit}`)
        .openOn(map);
      
      // Draw tooltip text
      ctx2.fillStyle = '#000';
      ctx2.font = '10px Arial';
      ctx2.fillText(`${point.elev}${heightUnit}`, x + 2, 55);
      ctx2.fillText(`${(point.dist * distUnitFactor).toFixed(3)}${distUnit}`, x + 2, 65);
      
      lastX = x;
    }

    // Optimized mouse event handler with throttling
    function onmouseover(e) {
      const x = e.clientX - canvasRect.left;
      
      // Skip if movement is too small
      if (Math.abs(x - lastX) < 2) return;
      
      // Cancel previous animation frame if pending
      if (rafId) cancelAnimationFrame(rafId);
      
      // Schedule redraw on next animation frame
      rafId = requestAnimationFrame(() => drawOverlay(x));
    }

    function onmouseout() {
      if (map.hasLayer(spotMarker)) {
        map.closePopup(spotMarker);
        // Clear wider area to ensure text is removed
        ctx2.clearRect(Math.max(0, lastX - 60), 0, 150, overlayCanvas.height);
        lastX = -1000;
      }
    }

    // Debounced event handlers for touch events
    let touchTimeout;
    function debouncedTouchHandler(e) {
      clearTimeout(touchTimeout);
      touchTimeout = setTimeout(() => onmouseover(e.changedTouches[0]), 16);
    }

    function debouncedTouchEnd() {
      clearTimeout(touchTimeout);
      touchTimeout = setTimeout(onmouseout, 50);
    }

    // Attach event listeners
    overlayCanvas.addEventListener('touchmove', debouncedTouchHandler, { passive: true });
    overlayCanvas.addEventListener('mousemove', onmouseover);
    overlayCanvas.addEventListener('mouseout', onmouseout);
    overlayCanvas.addEventListener('touchend', debouncedTouchEnd);
  },
});

/**
 * Creates a new Elevation control instance.
 * @param {Object} options - Leaflet control options
 * @returns {Control.Elevation} The Elevation control instance
 */
export default options => new Control.Elevation(options);
