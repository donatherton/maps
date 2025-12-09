import { Control, DomUtil, DomEvent, DivIcon, LatLngBounds, LayerGroup, Marker } from './leaflet-src.esm.js';
import geodesicPolyline from './geodesic.js';

Control.PlotTrack = Control.extend({
    options: {
      position: 'topleft',
    },
    onAdd(map) {
      const button = DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-custom track-plotter button');
      button.title = 'Measure / plot route manually';
      button.id = 'plotter';

      function stopEventPropagation(elem) {
        DomEvent.on(elem, 'click contextmenu mousedown mousewheel dblclick touchmove', DomEvent.stopPropagation);
      }

      stopEventPropagation(button);

      let divInfo;
      const smallIcon = new DivIcon({
        className: 'divicon',
        iconSize: [20, 20], // size of the icon
        popupAnchor: [0, -10], // point from which the popup should open relative to the iconAnchor
      });

      button.onclick = () => {
        Control.InfoWindow = Control.extend({
          onAdd(map) {
            divInfo = DomUtil.create('div', 'info-window');
            divInfo.id = 'divInfo';

            stopEventPropagation(divInfo);

            return divInfo;
          },
        });
        function trackInfoWindow(options) {
          return new Control.InfoWindow(options);
        }

        const infoWindow = trackInfoWindow({ position: 'topright' }).addTo(map);

        document.getElementById('plotter').disabled = true;

        const dlBtn = DomUtil.create('button', 'button', divInfo);
        dlBtn.innerHTML = 'Save GPX';

        const elev = DomUtil.create('button', 'button', divInfo);
        elev.innerHTML = 'Elevation';

        const reset = DomUtil.create('button', 'button', divInfo);
        reset.innerHTML = 'Reset';

        const distanceDiv = DomUtil.create('span', '', divInfo);
        distanceDiv.style.margin = '20px';

        const wpts = [];
        const markerGroup = new LayerGroup().addTo(map);

        const polyline = geodesicPolyline([], {color: 'blue', weight: 2 }).addTo(map);
        let elevationDiagram;

        DomEvent.on(elev, 'click', async () => {
          const { default: elevation } = (await import('./elevation.js'));
          const { orsAPI } = await import('./config.js');
          const wpt = [];
          for (let i = 0; i < wpts.length; i++) {
            wpt.push([wpts[i].lng, wpts[i].lat]);
          };

          await fetch('https://api.openrouteservice.org/elevation/line', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: orsAPI
            },
            body: JSON.stringify({
              format_in: 'polyline',
              format_out: 'polyline',
              geometry: wpt
            })
          })
            .then(response => response.json())
            .then(data => {
              if (data.geometry.length === wpts.length) {
                wpts.forEach((wpt, i) => {
                  wpt.alt = data.geometry[i][2];
                });
                // Elevation diagram
                // Get rid of previous chart
                if (document.getElementById('elevation-div')) {
                  DomUtil.remove(document.getElementById('elevation-div'));
                }

                elevationDiagram = elevation();
                elevationDiagram.addTo(map);
                elevationDiagram.addData(wpts, map);
              } else alert('Error: bad data returned');
          })
        })

        DomEvent.on(reset, 'click', () => {
          if (elevationDiagram) elevationDiagram.remove();
          map
            .removeControl(infoWindow)
            .removeLayer(polyline)
            .removeLayer(markerGroup);
          document.getElementById('plotter').disabled = false;
        });

        function getBearing(p1, p2) {
          const toRadians = degrees => degrees * (Math.PI / 180);
          const lat1 = toRadians(p2.lat);
          const lat2 = toRadians(p1.lat);
          const lng1 = toRadians(p2.lng);
          const lng2 = toRadians(p1.lng);
          const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
          const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
          const b = (Math.atan2(y, x) * 180 / Math.PI);
          return (b < 0 ? b + 360 : b).toFixed(0);
        }

        function getDistance(currentMarker = wpts.length - 1) {
          if (currentMarker > 0) {
            let i;
            let unit = 'km';
            let totalDistance = 0;
            let conversionFactor = 1000;
            const stepDistance = wpts[currentMarker].distanceTo(wpts[currentMarker - 1]);

            for (i = 1; i < wpts.length; i++) {
              totalDistance += wpts[i].distanceTo(wpts[i - 1]);
            }

            if (localStorage.getItem('dist') === 'miles') {
              conversionFactor = 1609.34;
              unit = ' miles';
            }

            const stepBearing = getBearing(wpts[currentMarker], wpts[currentMarker - 1]);
            const totalBearing = getBearing(wpts[wpts.length - 1], wpts[0]);

            updateDistanceDiv(totalDistance, totalBearing, conversionFactor, unit);

            return (stepDistance / conversionFactor).toFixed(3) + unit + '<br>' + stepBearing + '&deg;';
          }
        }

        function updateDistanceDiv(distance, bearing, conversionFactor, unit) {
          distanceDiv.innerHTML = (distance / conversionFactor).toFixed(3) + unit + ' ' + bearing + '&deg;';
        }

        function onMapClick(e) {
          const newMarker = new Marker(e.latlng, {
            draggable: 'true',
            icon: smallIcon,
          }).addTo(markerGroup);
          newMarker
            .on('dragstart', onDragStart)
            .on('click', updateTooltip)
            .on('dragend', onDragEnd)
            .on('contextmenu', insDel)
            .on('mouseover', updateTooltip);
          wpts.push(e.latlng);
          polyline.addLatLng(e.latlng);
          if (wpts.length > 1) {
            polyline.setLatLngs(wpts);
            newMarker.bindTooltip(getDistance()).openTooltip();
          }
          //getDistance();
        }

        map.on('click', onMapClick);

        function getWpt(latlng) {
          for (let i = 0; i < wpts.length; i++) {
            if (wpts[i].lat === latlng.lat && wpts[i].lng === latlng.lng) {
              return i;
            }
          }
        }

        function updateTooltip(e) {
          const latlng = e.target.getLatLng();
          const currentMarker = getWpt(latlng);
          if (currentMarker > 0) {
            e.target._tooltip.setContent(getDistance(currentMarker));
          } else if (e.target._tooltip) {
            e.target.unbindTooltip();
          }
        }

        function onDragStart(e) {
          const latlng = e.target.getLatLng();
          const currentMarker = getWpt(latlng);

          e.target.on('drag', e => onDrag(e, currentMarker));
        }

        function onDrag(e, currentMarker) {
          const latlng = e.target.getLatLng();
          wpts.splice(currentMarker, 1, latlng);
          polyline.setLatLngs(wpts);
          updateTooltip(e);
          //getDistance();
        }

        function onDragEnd(e) {
          e.target.off('drag');
        }

        function insDel(e) { console.log(e);
          const newPopup = DomUtil.create('div');
          const delBtn = DomUtil.create('button', 'button', newPopup);
          const insBtn = DomUtil.create('button', 'button', newPopup);
          delBtn.textContent = 'Delete point';
          insBtn.textContent = 'Insert point';

          e.target.bindPopup(newPopup).openPopup();

          delBtn.onclick = () => deletePoint(e);
          insBtn.onclick = () => insertPoint(e);

          e.target.unbindPopup();
        }

        function deletePoint(e) {
          const latlng = e.target.getLatLng();
          wpts.splice(getWpt(latlng), 1);

          map.removeLayer(e.target);
          polyline.setLatLngs(wpts);
          getDistance();
          map.closePopup();
        }

        function insertPoint(e) {
          const latlng = e.target.getLatLng();

          let clickedWpt = getWpt(latlng);
          if (clickedWpt === 0) clickedWpt = 1;
          const bounds = new LatLngBounds(wpts[clickedWpt], wpts[clickedWpt - 1]);
          const newPoint = bounds.getCenter();
          wpts.splice(clickedWpt, 0, newPoint);

          const newMarker = new Marker(newPoint, {
            draggable: 'true',
            icon: smallIcon,
          }).addTo(markerGroup);
          newMarker
            .on('dragstart', onDragStart)
            .on('click', updateTooltip)
            .on('dragend', onDragEnd)
            .on('contextmenu', insDel)
            .on('mouseover', updateTooltip);
          polyline.setLatLngs(wpts);
          newMarker.bindTooltip(getDistance(clickedWpt)).openTooltip();
          //getDistance();
          map.closePopup();
        }

        DomEvent.on(dlBtn, 'click', () => {
          import('./save-gpx.js')
            .then(saveGpx => saveGpx.default(wpts));
        });
      };

      return button;
    },
  });

export default options => new Control.PlotTrack(options);
