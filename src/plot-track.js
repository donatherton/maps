import * as L from './leaflet-src.esm.js';

L.Control.PlotTrack = L.Control.extend({
    options: {
      position: 'topleft',
    },
    onAdd(map) {
      const button = L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-custom track-plotter button');
      button.title = 'Measure / plot route manually';
      button.id = 'plotter';

      function stopEventPropagation(elem) {
        L.DomEvent.on(elem, 'click contextmenu mousedown mousewheel dblclick touchmove', L.DomEvent.stopPropagation);
      }

      stopEventPropagation(button);

      let divInfo;
      const smallIcon = L.divIcon({
        className: 'divicon',
        iconSize: [10, 10], // size of the icon
        popupAnchor: [0, -10], // point from which the popup should open relative to the iconAnchor
      });

      button.onclick = () => {
        L.Control.InfoWindow = L.Control.extend({
          onAdd(map) {
            divInfo = L.DomUtil.create('div', 'info-window');
            divInfo.id = 'divInfo';

            stopEventPropagation(divInfo);

            return divInfo;
          },
        });
        L.control.infoWindow = (options) => {
          return new L.Control.InfoWindow(options);
        };
        const infoWindow = L.control.infoWindow({ position: 'topright' }).addTo(map);

        // Disable these buttons so they don't confuse things
        // document.getElementById('ors-router').disabled = true;
        document.getElementById('plotter').disabled = true;

        const dlBtn = L.DomUtil.create('button', 'button', divInfo);
        dlBtn.innerHTML = 'Save as GPX';

        const elev = L.DomUtil.create('button', 'button', divInfo);
        elev.innerHTML = 'Elevation';

        const reset = L.DomUtil.create('button', 'button', divInfo);
        reset.innerHTML = 'Reset';

        const distanceDiv = L.DomUtil.create('span', '', divInfo);
        distanceDiv.style.margin = '20px';

        let wpts = [];
        let markerGroup = L.layerGroup().addTo(map);

        let polyline = L.polyline([], { weight: 2 }).addTo(map);
        let el;

        L.DomEvent.on(elev, 'click', async () => {
          const { default: elevation } = (await import('./elevation.js'));
          const { orsAPI } = await import('./config.js');
          let wpt = [];
          for (let i = 0; i < wpts.length; i++) {
            wpt.push([wpts[i].lng, wpts[i].lat]);
          };
          await fetch(`https://api.openrouteservice.org/elevation/line`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': orsAPI
            },
            body: JSON.stringify({
              'format_in': 'polyline',
              'format_out': 'polyline',
              'geometry': wpt
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
                  L.DomUtil.remove(document.getElementById('elevation-div'));
                }
                el = elevation();
                el.addTo(map);
                el.addData(wpts, map);
              } else alert('Error: bad data returned');
          })
        })

        L.DomEvent.on(reset, 'click', () => {
          if (el) el.remove();
          map
            .removeControl(infoWindow)
            .removeLayer(polyline)
            .removeLayer(markerGroup);
          document.getElementById('plotter').disabled = false;
          // document.getElementById('ors-router').disabled = false;

          // polyline = L.polyline([], { weight: 2 }).addTo(map);
          // markerGroup = L.layerGroup().addTo(map);
          // wpts = [];
          // distanceDiv.innerHTML = '';
        });

        function getBearing(p1, p2) {
          const lat1 = p1.lat / 180 * Math.PI;
          const lat2 = p2.lat / 180 * Math.PI;
          const lng1 = p1.lng / 180 * Math.PI;
          const lng2 = p2.lng / 180 * Math.PI;
          const y = Math.sin(lng2-lng1) * Math.cos(lat2);
          const x = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(lng2-lng1);
          const bearing = (Math.atan2(y, x) * 180 / Math.PI + 180).toFixed(0);
          return (bearing % 360);
        }

        function getDistance() {
          if (wpts.length > 1) {
            let i;
            let unit = 'm';
            let distance = 0;
            for (i = 1; i < wpts.length; i++) {
              distance += wpts[i].distanceTo(wpts[i - 1]);
            }
            if (localStorage.getItem('dist') === 'miles') {
              distance /= 1609.34;
              unit = ' miles';
              distance = distance.toFixed(2)
            }
            else {
              distance = Math.round(distance)
            }
            const bearing = getBearing(wpts[wpts.length - 1], wpts[wpts.length - 2]);
            distanceDiv.innerHTML = distance + unit + ' ' + bearing + '&deg;';
          }
        }

        function onMapClick(e) {
          const newMarker = new L.Marker(e.latlng, {
            draggable: 'true',
            icon: smallIcon,
          }).addTo(markerGroup);
          newMarker
            .on('dragstart', onDragStart)
            .on('click', onDragStart)
            .on('drag', onDrag)
            .on('dragend', onDragEnd)
            .on('contextmenu', insDel);
          wpts.push(e.latlng);
          polyline.addLatLng(e.latlng);
          getDistance();
        }
        map.on('click', onMapClick);

        let thisMarker;
        let latlng;
        function onDragStart(e) {
          latlng = e.target.getLatLng();
          for (let i = 0; i < wpts.length; i++) {
            if (wpts[i].lat === latlng.lat && wpts[i].lng === latlng.lng) {
              thisMarker = i;
              return;
            }
          }
        }

        function onDrag(e) {
          const latlngs = polyline.getLatLngs();
          latlng = e.target.getLatLng();
          latlngs.splice(thisMarker, 1, latlng);
          polyline.setLatLngs(latlngs);
        }

        function onDragEnd(e) {
          latlng = e.target.getLatLng();
          wpts[thisMarker] = latlng;
          polyline.setLatLngs(wpts);
          getDistance();
        }

        function insDel(e) {
          const newPopup = L.DomUtil.create('div');
          const delBtn = L.DomUtil.create('button', 'button', newPopup);
          const insBtn = L.DomUtil.create('button', 'button', newPopup);
          delBtn.innerHTML = 'Delete point';
          delBtn.id = 'delbtn';
          insBtn.id = 'insbtn';
          insBtn.innerHTML = 'Insert point';
          e.target.bindPopup(newPopup).openPopup();

          document.getElementById("delbtn").onclick = () => {
            deletePoint(e);
          };
          document.getElementById("insbtn").onclick = () => {
            insertPoint(e);
          };
        }

        function deletePoint(e) {
          latlng = e.target.getLatLng();
          for (let i = 0; i < wpts.length; i++) {
            if (wpts[i].lat === latlng.lat && wpts[i].lng === latlng.lng) {
              wpts.splice(i, 1);
            }
          }
          map.removeLayer(e.target);
          polyline.setLatLngs(wpts);
          getDistance();
        }

        function insertPoint(e) {
          let newpoint;
          latlng = e.target.getLatLng();
          for (let i = 0; i < wpts.length; i++) {
            if (wpts[i].lat === latlng.lat && wpts[i].lng === latlng.lng) {
              if (i === 0) i = 1;
              const bounds = L.latLngBounds(wpts[i], wpts[i - 1]);
              newpoint = bounds.getCenter();
              wpts.splice(i, 0, newpoint); break;
            }
          }
          const newMarker = new L.Marker(newpoint, {
            draggable: 'true',
            icon: smallIcon,
          }).addTo(markerGroup);
          newMarker
            .on('dragstart', onDragStart)
            .on('click', onDragStart)
            .on('drag', onDrag)
            .on('dragend', onDragEnd)
            .on('contextmenu', insDel);
          polyline.setLatLngs(wpts);
          getDistance();
          map.closePopup();
        }

        L.DomEvent.on(dlBtn, 'click', () => {
          import('./save-gpx.js')
            .then(saveGpx => saveGpx.default(wpts));;
        });
      };
      return button;
    }
  });

export default (options) => {
  return new L.Control.PlotTrack(options);
};
