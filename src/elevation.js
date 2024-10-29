'use strict'
L.Control.Elevation = L.Control.extend({
  options: {
    position: 'bottomright',
  },

  onRemove(map) {

  },

  onAdd(map) {
    const container = L.DomUtil.create('div', 'elev-window');
    container.id = 'elevation-div';
    container.style.position = 'relative';
    container.style.width = '95vw';

    const closeButton = L.DomUtil.create('button', 'button', container);
    closeButton.innerHTML = 'Hide >';
    closeButton.style.position = 'relative';
    closeButton.style.float = 'right';
    closeButton.style.background = 'rgba(156, 194, 34, 0.8)';

    L.DomEvent.on(closeButton, 'click', () => {
      if (container.style.left === '100%') {
        container.style.left = '0%';
        closeButton.innerHTML = 'Hide >';
        closeButton.style.left = '0';
        closeButton.style.float = 'right';
      } else {
        container.style.left = '100%';
        closeButton.innerHTML = '< Open';
        closeButton.style.left = '-50px';
        closeButton.style.float = 'left';
      }
    });

    const canvas = L.DomUtil.create('canvas', '', container);
    canvas.id = 'elevation';

    L.DomEvent.on(container, 'contextmenu', L.DomEvent.stopPropagation)
      .disableClickPropagation(container);
    return container;
  },

  // Clear any previous charts
  clear() {
    const index = Object.keys(Chart.instances);
    if (index.length > 0) {
      index.forEach(() => {
        Chart.instances[index].destroy();
      });
    }
  },

  addData(coords) {
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
      // Add marker on polyline
      spotMarker
        .setLatLng([coords[item.index].lat, coords[item.index].lng])
        .setContent(`${(item.xLabel / 1.609).toFixed(3)} miles<br>${item.yLabel}m`)
        .openOn(map);
    }

    function onmouseout() {
      // Remove marker on mouseout
      if (typeof (spotMarker) !== 'undefined') {
        if (map.hasLayer(spotMarker)) {
          map.closePopup(spotMarker);
        }
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

    // Get rid of markers when mouse leaves chart
    document.getElementById('elevation').addEventListener('mouseout', onmouseout);
    document.getElementById('elevation').addEventListener('touchend', onmouseout);

    // Make the array with x and y axis data
    pt[0] = [0, coords[0].alt];
    let d = 0;
    for (let i = 1; i < coords.length; i += 1) {
      d += distanceBetween(coords[i], coords[i - 1]);
      pt.push([(d / 1000).toFixed(3), Math.round(coords[i].alt)]);
    }

    const pts = {
      labels: getAxis('x'),
      datasets: [{
        backgroundColor: 'rgba(156, 194, 34, 0.8)',
        borderColor: 'rgba(156, 194, 34, 0.8)',
        pointStyle: 'circle',
        pointRadius: 0,
        data: getAxis('y'),
      }],
    };

    // Create a custom tooltip positioner to put at the bottom of the chart area
    Chart.Tooltip.positioners.custom = function (items) {
      const pos = Chart.Tooltip.positioners.average(items);
      // Happens when nothing is found
      if (pos === false) {
        return false;
      }
      return {
        x: pos.x,
        y: chart.chartArea.bottom + 10,
      };
    };

    // Draws the line on mouseover
    Chart.plugins.register({
      afterDatasetsDraw(chart) {
        if (chart.tooltip._active && chart.tooltip._active.length) {
          const activePoint = chart.tooltip._active[0];
          const { ctx } = chart;
          const yAxis = chart.scales['y-axis-0'];
          const { x } = activePoint.tooltipPosition();
          const topY = yAxis.top;
          const bottomY = yAxis.bottom;
          // draw line
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x, topY);
          ctx.lineTo(x, bottomY);
          ctx.lineWidth = 1;
          ctx.strokeStyle = '#637E0B';
          ctx.stroke();
          ctx.restore();
        }
      },
    });

    Chart.defaults.global.defaultFontSize = 10;

    const ctx = document.getElementById('elevation');
    const chart = new Chart(ctx, {
      type: 'line',
      data: pts,
      options: {
        maintainAspectRatio: false,
        plugins: {

        },
        tooltips: {
          enabled: true,
          mode: 'index',
          position: 'custom',
          intersect: false,
          caretSize: 0,
          displayColors: false,
          backgroundColor: 'rgba(100, 100, 100, 0.8)',
          callbacks: {
            title() { return ''; },
            label(item) {
              onmouseover(item);
              return `${item.yLabel}m  ${(item.xLabel / 1.609).toFixed(3)} miles`;
            },
          },
        },
        legend: {
          display: false,
        },
        scales: {
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'metres',
            },
            gridLines: {
              display: false,
            },
          }],
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Km',
            },
            gridLines: {
              display: false,
            },
          }],
        },
      },
    });
  },

});
L.control.elevation = function (options) {
  return new L.Control.Elevation(options);
};
