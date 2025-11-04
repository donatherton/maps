import * as L from './leaflet-src.esm.js';

L.Control.Elevation = L.Control.extend({
    options: {
      position: 'bottomright',
    },

    // onRemove(map) {

    // },

    onAdd(map) {
      const container = L.DomUtil.create('div', 'elev-window');
      container.id = 'elevation-div';

      const closeButton = L.DomUtil.create('button', 'button', container);
      closeButton.innerHTML = 'Hide >';
      closeButton.style.position = 'relative';
      closeButton.style.float = 'right';
      closeButton.style.background = 'rgba(156, 194, 34, 0.8)';
      closeButton.style.zIndex = '2';

      L.DomEvent.on(closeButton, 'click', () => {
        if (container.style.left === '100%') {
          container.style.left = '0%';
          closeButton.innerHTML = 'Hide >';
          closeButton.style.left = '0';
          closeButton.style.float = 'right';
        } else {
          container.style.left = '100%';
          closeButton.innerHTML = '< Open';
          closeButton.style.left = '-60px';
          closeButton.style.float = 'left';
        }
      });

      L.DomEvent.on(container, 'click contextmenu mousedown mousewheel dblclick touchmove', L.DomEvent.stopPropagation);

      return container;
    },

  addData(coords, map) { // map needs to be explicitly sent as it loses scope here
      const pt = [];
      const spotMarker = L.popup({ closeButton: false });

      function distanceBetween(latlng1, latlng2) {
        const rad = Math.PI / 180;
        const lat1 = latlng1.lat * rad;
        const lat2 = latlng2.lat * rad;
        const sinDLat = Math.sin(((latlng2.lat - latlng1.lat) * rad) / 2);
        const sinDLon = Math.sin(((latlng2.lng - latlng1.lng) * rad) / 2);
        const a = (sinDLat * sinDLat) + (Math.cos(lat1) * Math.cos(lat2)) * sinDLon * sinDLon;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return 6378137 * c;
      }

      function onmouseover(item) {
        // Calc which index on coords array
        const dist = (item.clientX - canvas.getBoundingClientRect().left) / canvas.getBoundingClientRect().width * Number(pt[pt.length - 1][0]);
        let index = 0;
        while (index < pt.length - 1 && pt[index][0] <= dist) {
          index++;
        } 
        // Add marker on polyline
        const d = pt[index][0] + 'km';
        const h = Math.round(pt[index][1]) + 'm';
        spotMarker
          .setLatLng([coords[index].lat, coords[index].lng])
          .setContent(`${d}<br>${h}`)
          .openOn(map);          
          // Tooltip on chart
          ctx2.clearRect(0, 0, newCanvas.width, newCanvas.height);
          ctx2.beginPath();
          ctx2.moveTo(item.clientX - canvas.getBoundingClientRect().left, 40);
          ctx2.lineTo(item.clientX - canvas.getBoundingClientRect().left, 100);
          ctx2.lineWidth = 1;
          ctx2.strokeStyle = '#637E0B';
          ctx2.stroke();
          ctx2.fillText(h, item.clientX - canvas.getBoundingClientRect().left + 2, 50);
          ctx2.fillText(d, item.clientX - canvas.getBoundingClientRect().left + 2, 60);
      }

      function onmouseout() {
          if (map.hasLayer(spotMarker)) {
            map.closePopup(spotMarker);
            ctx2.clearRect(0, 0, newCanvas.width, newCanvas.height);
          }
      }

      function getAxis(axis) {
        let d;
        const dist = [];
        const index = (axis === 'x') ? 0 : 1;
        for (let i = 0; i < pt.length; i += 1) {
          d = pt[i][index];
          dist.push(d);
        }
        return dist;
      }

      // Make the array with x and y axis data
      pt[0] = [0, coords[0].alt];
      let d = 0;
      for (let i = 1; i < coords.length; i += 1) {
        d += distanceBetween(coords[i], coords[i - 1]);
        pt.push([(d / 1000).toFixed(3), Math.round(coords[i].alt)]);
      }

      const canvas = document.createElement('canvas');
      canvas.id = 'elevation'; 
      canvas.width = 700;
      canvas.height = 75;
      canvas.style.maxWidth = '90vw';
      document.getElementById('elevation-div').appendChild(canvas);

      const ctx = canvas.getContext('2d');

      const maxHeight = Math.max(...getAxis('y'));
      const minHeight = Math.min(...getAxis('y'));
      const heightFactor = (canvas.height - 25) / maxHeight;
      const widthFactor = canvas.width / Number(pt[pt.length - 1][0]);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // x axis
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 0);
      ctx.lineTo(canvas.width, canvas.height - 0);
      ctx.stroke();
      ctx.fillText(pt[pt.length - 1][0] + 'km', canvas.width - 50, canvas.height - 2);
      //y axis
      ctx.beginPath();
      ctx.moveTo(1, 0);
      ctx.lineTo(0, canvas.height);
      ctx.stroke();
      ctx.fillText(minHeight + 'm', 2, canvas.height - 2);
      ctx.fillText(maxHeight + 'm', 2, 10);

      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 12);
      pt.forEach(point => {
        ctx.lineTo(Number(point[0]) * widthFactor, canvas.height - ((point[1] - minHeight) * heightFactor) - 12);
      });
      ctx.lineTo(canvas.width, canvas.height - 12);
      ctx.closePath();
      ctx.fillStyle = 'rgba(156, 194, 34, 0.8)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(156, 194, 34, 0.8)';
      ctx.stroke();
      
      const newCanvas = document.createElement('canvas');
      newCanvas.id = 'mouseover';
      newCanvas.width = 702; // 702px so that mouse pointer can get to very end
      newCanvas.height = 100;

      document.getElementById('elevation-div').appendChild(newCanvas);
      const ctx2 = newCanvas.getContext('2d');

      newCanvas.addEventListener('touchmove', (e) => onmouseover(e.changedTouches[0]));
      newCanvas.addEventListener('mousemove', onmouseover);
      
      newCanvas.addEventListener('mouseout', onmouseout);
      newCanvas.addEventListener('touchend', onmouseout);
    }
  });

export default (options) => {
  return new L.Control.Elevation(options);
};
