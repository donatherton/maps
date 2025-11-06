import * as L from './leaflet-src.esm.js';
import { orsAPI, defaultProfile, defaultPreference } from './config.js';
import elevation from './elevation.js';

let profile = defaultProfile;
let preference = defaultPreference;

L.Control.PlotRoute = L.Control.extend({
    options: {
      position: 'topleft',
    },
    onAdd(map) {
      let el = elevation();
      
      const button = L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-custom ors-routing button');
      button.title = 'Get route with OpenRouteService';
      button.id = 'ors-router';

      function stopEventPropagation(elem) {
        L.DomEvent.on(elem, 'click contextmenu mousedown mousewheel dblclick touchmove', L.DomEvent.stopPropagation);
      }

      stopEventPropagation(button);

      L.DomEvent.on(button, 'click', () => {
        let route;
        let coords;
        let latlng;
        const wpts = []; // declare array of waypoints
        let polyline; // red centre
        let polyline2; // white border
        let polyline3; // black edge
        const geolabel = [];
        let thisMarker;
        let divInfo;

        // Disable these buttons to stop confusing things
        document.getElementById('plotter').setAttribute('disabled', 'disabled');
        document.getElementById('ors-router').setAttribute('disabled', 'disabled');

        L.Control.InfoWindow = L.Control.extend({
          options: {
          position: 'topright',
        },

          onAdd(map) {
            divInfo = L.DomUtil.create('div', 'info-window');
            divInfo.id = 'divInfo';
            divInfo.style.overflow = 'visible';
            divInfo.style.width = '80vw';
            divInfo.style.height = 'auto';

            stopEventPropagation(divInfo);

            return divInfo;
          },
        });
        L.control.infoWindow = (options) => {
          return new L.Control.InfoWindow(options);
        };
        L.control.infoWindow({ position: 'topright' }).addTo(map);

        const profileSelect = L.DomUtil.create('div', 'profileSelect', divInfo);

        const buttonDiv = L.DomUtil.create('div', 'info-window-inner', divInfo);
        buttonDiv.style.overflow = 'visible';

        const routeInfo = L.DomUtil.create('div', 'info-window-inner', divInfo);
        routeInfo.id = 'routeInfo';

        const closeButton = L.DomUtil.create('button', 'button', buttonDiv);
        closeButton.innerHTML = 'Hide >';
        closeButton.style.position = 'relative';
        closeButton.style.float = 'right';
        closeButton.style.left = '-10px';

        const dlButton = L.DomUtil.create('button', 'button', buttonDiv);
        dlButton.innerHTML = 'Save as GPX';

        const startIcon = L.icon({
          iconUrl: 'images/marker-start-icon-2x.png',
          iconAnchor: [11, 26],
        });
        const endIcon = L.icon({
          iconUrl: 'images/marker-end-icon-2x.png',
          iconAnchor: [11, 26],
        });
        const smallIcon = L.icon({
          iconUrl: 'images/marker-via-icon-2x.png',
          iconAnchor: [11, 26],
          popupAnchor: [0, -5],
        });

        function geoDataRequest(e) {
          fetch(`https://nominatim.openstreetmap.org/?addressdetails=1&q=${e.latlng.lat},${e.latlng.lng}&format=json&limit=1`)
          .then(response => response.json())
          .then(geoLabel => {
            L.popup()
              .setContent(`<a href="https://duckduckgo.com/?q=${geoLabel[0].display_name}" target="_blank">${geoLabel[0].display_name}</a>`)
              .setLatLng([geoLabel[0].lat, geoLabel[0].lon])
              .openOn(map);
          })
        }

        function insertPoint(latlon, startPoint) {
          // Calculate between which waypoints it should go.
          let minDist = Number.MAX_VALUE;
          let minIndex;

          let i = coords.length - 1;
          while (i > 0) {
            const d = startPoint.distanceTo(coords[i]);
            if (d < minDist) {
              minIndex = i;
              minDist = d;
            }
            i=i-1;
          }
          let j = route.properties.way_points.length - 1;
          while (j >= 0 && route.properties.way_points[j] > minIndex) {
            j=j-1;
          }
          wpts.splice(j + 1, 0, latlon);
          routeRequest();
//        geoRequest(latlon, newIndex, 'ins');
        }

        function deletePoint(e) {
          const delPopup = L.DomUtil.create('div');
          const delBtn = L.DomUtil.create('button', 'button', delPopup);
          delBtn.innerHTML = 'Delete point';
          e.target.bindPopup(delPopup).openPopup();
          L.DomEvent.on(delBtn, 'click', () => {
            latlng = e.target.getLatLng();
            for (let i = 0; i < wpts.length; i=i+1) {
              if (wpts[i].lat === latlng.lat && wpts[i].lng === latlng.lng) {
                wpts.splice(i, 1);
                geolabel.splice(i, 1);
//              L.DomUtil.remove(geoInput[i]);
              }
            }
            map.removeLayer(e.target);
            routeRequest();
//          geoRequest(latlng, i, 'del');
          });
        }

        function onDragStart(e) {
          latlng = e.target.getLatLng();
          for (let i = 0; i < wpts.length; i=i+1) {
            if (wpts[i].lat === latlng.lat && wpts[i].lng === latlng.lng) {
              thisMarker = i;
              return;
            } else {
              thisMarker = 'new';
            }
          }
        }

        function onDragEnd(e) {
          latlng = e.target.getLatLng();
          if (thisMarker === 'new') {
            insertPoint(latlng);
          } else {
            wpts[thisMarker] = latlng;
            routeRequest();
//          geoRequest(latlng, thisMarker, 'change');
          }
        }

        function popup(e) {
          const buttonText = (wpts.length === 0) ? 'Start here':'Next WPT / End';
          const buttonID = (wpts.length === 0) ? 'start':'end';
          const icon = (wpts.length === 0) ? startIcon:endIcon;

          L.popup()
            .setContent(`${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}<br />
              <button class="button" id="what">What's here?</button><br>
              <button class="button" id="${buttonID}">${buttonText}</button>`)
            .setLatLng(e.latlng)
            .openOn(map);
          document.getElementById('what').onclick = () => {
            geoDataRequest(e)
          };
          document.getElementById(buttonID).onclick = () => {
            wpts.splice(wpts.length, 0, e.latlng);
            map.closePopup();
            new L.Marker(e.latlng, {
              icon: icon,
              draggable: 'true',
            }).addTo(map)
              .on('dragstart', onDragStart)
              .on('dragend', onDragEnd)
              .on('contextmenu', deletePoint);
            routeRequest();
            //          geoRequest(e.latlng, 0, 'ins');
          }
        };
        map.on('contextmenu', popup);

        function decodePolyline(geometry) {
          const latlngs = [];
          for (let i = 0; i < geometry.length; i++) {
            latlngs.push({ 'lat': geometry[i][1], 'lng': geometry[i][0], 'alt': geometry[i][2] });
          }
          return latlngs;
        }

        function clickPolyline(e) {
          map.dragging.disable();
          const newMarker = new L.Marker(e.latlng, {
            draggable: 'true',
            icon: smallIcon,
          }).addTo(map)
            .on('dragstart', onDragStart)
            .on('dragend', onDragEnd)
            .on('contextmenu', deletePoint);
          const startPoint = newMarker.getLatLng();
          map.on('mousemove', (e) => {
            newMarker.setLatLng(e.latlng);
          });
          map.on('mouseup', (e) => {
            map.off('mousemove');
            map.dragging.enable();
            map.off('mouseup');
            setTimeout(() => {
            }, 10);
            insertPoint(e.latlng, startPoint);
          });
        }

        function loadRoute(request) {
          if (request.error) {
            alert(request.error.message);
            return
          }
          let p;
          function addRowListener(wpt, coord) {
            let waypoint;
            let waypointLatlng;
            let spotMarker;
            L.DomEvent.addListener(p, 'mouseover', () => {
              waypoint = wpt.way_points[0];
              waypointLatlng = coord[waypoint];
              spotMarker = new L.CircleMarker(waypointLatlng).addTo(map);
            });
            L.DomEvent.addListener(p, 'mouseout', () => {
              if (map.hasLayer(spotMarker)) map.removeLayer(spotMarker);
            });
            L.DomEvent.addListener(p, 'click', (e) => {
              map.setView(waypointLatlng, 17);
              L.DomEvent.stopPropagation(e);
            });
          }

          route = request; //JSON.parse(request);
          route = route.features[0];
          coords = route.geometry.coordinates;
          coords = decodePolyline(coords);

          let { distance } = route.properties.summary;
          const unit = localStorage.getItem('dist');
          if (unit === 'miles') distance = `${(distance / 1609.34).toFixed(2)} miles`;
          else distance = `${Math.round(distance)}m`;
          routeInfo.innerHTML = `<h4 style="margin:0">Total distance: ${distance}</h4>`;
          for (let i = 0; i < route.properties.segments.length; i=i+1) {
            for (let j = 0; j < route.properties.segments[i].steps.length; j++) {
              const step = route.properties.segments[i].steps[j];
              let stepDistance = step.distance;
              if (unit === 'miles') stepDistance = `${(stepDistance / 1609.34).toFixed(2)} miles`;
              else stepDistance += 'm';
              p = L.DomUtil.create('p', 'route-info', routeInfo);
              p.innerHTML = `- ${step.instruction} (${stepDistance})`;
              addRowListener(step, coords);
            }
          }
          if (polyline) {
            if (map.hasLayer(polyline)) map.removeLayer(polyline);
          }
          if (polyline2) {
            if (map.hasLayer(polyline2)) map.removeLayer(polyline2);
          }
          if (polyline3) {
            if (map.hasLayer(polyline3)) map.removeLayer(polyline3);
          }

          polyline3 = new L.Polyline(coords).setStyle({
            color: 'black',
            weight: '30',
            opacity: '.15',
            clickable: 'true',
          }).addTo(map)
            .on('mousedown', clickPolyline)
            .on('mouseup', onDragEnd);
          polyline2 = new L.Polyline(coords).setStyle({
            color: 'white',
            weight: '7',
            opacity: '.8',
            clickable: 'true',
          }).addTo(map)
            .on('mousedown', clickPolyline)
            .on('mouseup', onDragEnd);
          polyline = new L.Polyline(coords).setStyle({
            color: 'red',
            weight: '2',
            clickable: 'true',
          }).addTo(map)
            .on('mousedown', clickPolyline)
            .on('mouseup', onDragEnd);

          map.fitBounds(polyline.getBounds());
          // Add elevation diagram
          el.addTo(map);
          el.addData(coords, map);
        }

        function routeRequest() {
          if (wpts.length > 1) {
            let plot = [];

            let ferry = document.getElementsByName('ferry');
            if (ferry[0].checked) ferry = ['ferries']
            else ferry = [];

            for (let i = 0; i < wpts.length; i=i+1) {
              plot.push([wpts[i].lng, wpts[i].lat]);
            }

            const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;
            fetch(url, {
              method: 'POST',
              headers: {
                'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
                'Content-Type': 'application/json',
                'Authorization': orsAPI
              },
              body: JSON.stringify({
                'coordinates': plot,
                'elevation': true,
                'instructions': true,
                'preference': preference,
                'options': {'avoid_features': ferry}
              })
            })
              .then(response => response.json())
              .then(request => loadRoute(request))
              .catch(err => console.log(`Error: ${err}`));
          }
        }

        L.DomEvent.on(dlButton, 'click', () => {
          import('./save-gpx.js')
            .then(saveGpx => saveGpx.default(coords));
        });

        L.DomEvent.on(closeButton, 'click', () => {
          if (divInfo.style.left === '100%') {
            divInfo.style.left = '0%';
            closeButton.innerHTML = 'Hide >';
            closeButton.style.left = '-10px';
            closeButton.style.float = 'right'
          } else {
            divInfo.style.left = '100%';
            closeButton.innerHTML = '< Open';
            closeButton.style.left = '-54px';
            closeButton.style.float = 'left'
          }
        });

        const profiles = { Walk: 'foot-walking', Car: 'driving-car', Bike: 'cycling-road' };
        let checked;

        const values = Object.values(profiles);
        const keys = Object.keys(profiles);
        let key;
        for (const k in values) {
          if (values[k] === profile) {
            checked = 'checked';
            key = keys[k]
          } else {
            checked = '';
            key = keys[k]
          }
          profileSelect.innerHTML += `<input type="radio" id="${profiles[key]}" 
            name="profile" value="${profiles[key]}"${checked}>  <label for="${profiles[key]}">${key}</label>`;
        }

        const pref = L.DomUtil.create('div', '', profileSelect);
        pref.innerHTML = `<label><input type="radio" id ="shortest" name="pref" value="shortest" checked>
          Shortest</label><label><input type="radio" id ="fastest" name="pref" value="fastest">Fastest</label>
          <label><input type="checkbox" id="other_prefs" name="ferry" checked>Avoid ferries</label>`;

        L.DomEvent.on(profileSelect, 'click', (e) => {
          if (e.target.name === 'profile') {
            profile = e.target.value;
          } else if (e.target.name === 'pref') {
            preference = e.target.value;
          } 
          routeRequest();
        });
      });
      return button;
    }
  });

export default (options) => {
  return new L.Control.PlotRoute(options);
};
