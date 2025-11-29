import { CircleMarker, Control, DomEvent, DomUtil, icon, LayerGroup, Marker, Polyline, Popup } from './leaflet-src.esm.js';
import { orsAPI, defaultProfile, defaultPreference } from './config.js';
import elevation from './elevation.js';

let profile = defaultProfile;
let preference = defaultPreference;

Control.PlotRoute = Control.extend({
    options: {
      position: 'topleft',
    },
    onAdd(map) {
      const elevationDiagram = elevation();
      
      const button = DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-custom ors-routing button');
      button.title = 'Get route with OpenRouteService';
      button.id = 'ors-router';

      function stopEventPropagation(elem) {
        DomEvent.on(elem, 'click contextmenu mousedown mouseup mousewheel dblclick touchmove', DomEvent.stopPropagation);
      }

      stopEventPropagation(button);

      DomEvent.on(button, 'click', () => {
        let route;
        let coords;
        const wpts = [];
        let polyline; // red centre
        let polyline2; // white border
        let polyline3; // black edge
        const geoLabel = [];
        let divInfo;

        // Disable these buttons to stop confusing things
        // document.getElementById('plotter').setAttribute('disabled', 'disabled');
        document.getElementById('ors-router').setAttribute('disabled', 'disabled');

        Control.InfoWindow = Control.extend({
          options: {
          position: 'topright',
          },

          onAdd(map) {
            divInfo = DomUtil.create('div', 'info-window');
            divInfo.id = 'div-info';
            divInfo.style.overflow = 'visible';
            divInfo.style.width = '80vw';
            divInfo.style.height = 'auto';

            stopEventPropagation(divInfo);

            return divInfo;
          },
        });
        function routeInfoWindow(options) {
          return new Control.InfoWindow(options);
        };

        const infoWindow = routeInfoWindow({ position: 'topright' }).addTo(map);

        const profileSelect = DomUtil.create('div', 'profileSelect', divInfo);

        const buttonDiv = DomUtil.create('div', 'info-window-inner', divInfo);
        buttonDiv.style.overflow = 'visible';
        
        const geoInfo = DomUtil.create('div','info-window-inner input-elems', divInfo);
        geoInfo.id = 'geo-info';

        const routeInfo = DomUtil.create('div', 'info-window-inner', divInfo);
        routeInfo.id = 'routeInfo';

        const closeButton = DomUtil.create('button', 'button', buttonDiv);
        closeButton.innerHTML = 'Hide >';
        closeButton.style.position = 'relative';
        closeButton.style.float = 'right';
        closeButton.style.left = '-10px';

        const dlButton = DomUtil.create('button', 'button', buttonDiv);
        dlButton.innerHTML = 'Save GPX';

        const reset = DomUtil.create('button', 'button', buttonDiv);
        reset.innerHTML = 'Reset';
        DomEvent.on(reset, 'click', () => {
          if (elevationDiagram) elevationDiagram.remove();
          map
            .removeControl(infoWindow)
            .removeLayer(layerGroup)
            .off('contextmenu', infoPopup)
          document.getElementById('ors-router').disabled = false;
        });

        const layerGroup = new LayerGroup().addTo(map);

        const startIcon = icon({
          iconUrl: 'images/marker-start-icon-2x.png',
          iconAnchor: [11, 26],
        });
        const endIcon = icon({
          iconUrl: 'images/marker-end-icon-2x.png',
          iconAnchor: [11, 26],
        });
        const viaIcon = icon({
          iconUrl: 'images/marker-via-icon-2x.png',
          iconAnchor: [11, 26],
          popupAnchor: [0, -5],
        });

        function getPointGeoData(e) {
          fetch(`https://nominatim.openstreetmap.org/?addressdetails=1&q=${e.latlng.lat},${e.latlng.lng}&format=json`)
            .then(response => response.json())
            .then(geoLabel => {
              new Popup()
                .setContent(`<a href="https://duckduckgo.com/?q=${geoLabel[0].display_name}" target="_blank">${geoLabel[0].display_name}</a>`)
                .setLatLng([geoLabel[0].lat, geoLabel[0].lon])
                .openOn(map);
            })
        }

        function getPointAddress(coord, wpt, whatToDo) {
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coord.lat}&lon=${coord.lng}&addressdetails=1&format=json`)
            .then(response => response.json())
            .then(result => {
              switch (whatToDo) {
                case 'change': geoLabel[wpt] = result.address.postcode || `${result.lat}, ${result.lon}`; break;
                case 'ins': geoLabel.splice(wpt, 0, result.address.postcode || `${result.lat}, ${result.lon}`); break;
                case 'del': geoLabel.splice(wpt, 1); break;
              }

              geoInfo.innerHTML = '';
              geoLabel.forEach(label => {
                geoInfo.innerHTML += `<p>${label}</p>`;
              });

              //   `<input type="text" id="from" value="" placeholder="From..."><br>`;
               
              // geoLabel.forEach((label, id) => {
               //  geoInfo.innerHTML += `<input type="text" id="${id}" value="${label}">`;
              // });

              // geoInfo.innerHTML += 
              //   `<input type="text" id="to" value="" placeholder="To...">`;
            })
            .catch(err => console.log(`Error: ${err}`));
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

            i--;
          }

          let j = route.properties.way_points.length - 1;
          while (j >= 0 && route.properties.way_points[j] > minIndex) {
            j--;
          }

          wpts.splice(j + 1, 0, latlon);
          // routeApiRequest();
          getPointAddress(latlon, j + 1, 'ins');
        }

        function deletePoint(e) {
          const delPopup = DomUtil.create('div');
          const delBtn = DomUtil.create('button', 'button', delPopup);
          delBtn.innerHTML = 'Delete point';
          e.target.bindPopup(delPopup).openPopup();
          DomEvent.on(delBtn, 'click', () => {
            const latlng = e.target.getLatLng();
            let i;
            for (i = 0; i < wpts.length; i++) {
              if (wpts[i].lat === latlng.lat && wpts[i].lng === latlng.lng) {
                wpts.splice(i, 1);
                geoLabel.splice(i, 1);
              }
            }

            layerGroup.removeLayer(e.target);
            routeApiRequest();
            getPointAddress(latlng, i, 'del');
          });
        }

        function onDragStart(e) {
          let thisMarker = null;
          const startPoint = e.target.getLatLng();
          wpts.forEach((wpt, i) => {
            if (wpt.lat === startPoint.lat && wpt.lng === startPoint.lng) {
              thisMarker = i;
            }
          });

          if (!thisMarker && thisMarker !== 0) thisMarker = 'new';
          e.target.on('dragend', e => {
            onDragEnd(e, startPoint, thisMarker);
            e.target.off('dragend');
          });
        }

        function onDragEnd(e, startPoint, thisMarker) {
          const endPoint = e.target.getLatLng();
          if (thisMarker === 'new') {
            insertPoint(endPoint, startPoint);
          } else {
            wpts[thisMarker] = endPoint;
            getPointAddress(endPoint, thisMarker, 'change');
          }

          routeApiRequest();
        }

        function infoPopup(e) {
          const buttonText = (wpts.length === 0) ? 'Start here':'Next WPT / End';
          const buttonID = (wpts.length === 0) ? 'start':'end';
          const icon = (wpts.length === 0) ? startIcon : endIcon;

          new Popup()
            .setContent(`${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}
              <br />
              <button class="button" id="what">What's here?</button><br>
              <button class="button" id="${buttonID}">${buttonText}</button>`)
            .setLatLng(e.latlng)
            .openOn(map);
          document.getElementById('what').onclick = () => getPointGeoData(e)
          document.getElementById(buttonID).onclick = () => {
            wpts.splice(wpts.length, 0, e.latlng);
            map.closePopup();
            new Marker(e.latlng, {
              icon: icon,
              draggable: 'true',
            }).addTo(layerGroup)
              .on('dragstart', onDragStart)
              .on('contextmenu', deletePoint);
            routeApiRequest();
            getPointAddress(e.latlng, wpts.length, 'ins');
          }
        };
        map.on('contextmenu', infoPopup);

        function decodePolyline(geometry) {
          const latlngs = [];
          for (let i = 0; i < geometry.length; i++) {
            latlngs.push({ 'lat': geometry[i][1], 'lng': geometry[i][0], 'alt': geometry[i][2] });
          }

          return latlngs;
        }

        function clickPolyline(e) {
          new Marker(e.latlng, {
            draggable: 'true',
            icon: viaIcon,
          }).addTo(layerGroup)
            .on('dragstart', onDragStart)
            .on('contextmenu', deletePoint);
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
            DomEvent.addListener(p, 'mouseover', () => {
              waypoint = wpt.way_points[0];
              waypointLatlng = coord[waypoint];
              spotMarker = new CircleMarker(waypointLatlng).addTo(layerGroup);
            });
            DomEvent.addListener(p, 'mouseout', () => {
              if (spotMarker) spotMarker.remove();
            });
            DomEvent.addListener(p, 'click', e => {
              map.setView(waypointLatlng, 17);
              DomEvent.stopPropagation(e);
            });
          }

          route = request;
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
              p = DomUtil.create('p', 'route-info', routeInfo);
              p.innerHTML = `- ${step.instruction} (${stepDistance})`;
              addRowListener(step, coords);
            }
          }

          if (polyline) {
            if (polyline) polyline.remove();
          }

          if (polyline2) {
            if (polyline2) polyline2.remove();
          }

          if (polyline3) {
            if (polyline3) polyline3.remove();
          }

          polyline3 = new Polyline(coords).setStyle({
            color: 'black',
            weight: '30',
            opacity: '.15',
            clickable: 'true',
          }).addTo(layerGroup)
            .on('contextmenu', clickPolyline)
          polyline2 = new Polyline(coords).setStyle({
            color: 'white',
            weight: '7',
            opacity: '.8',
            clickable: 'true',
          }).addTo(layerGroup)
            .on('contextmenu', clickPolyline)
          polyline = new Polyline(coords).setStyle({
            color: 'red',
            weight: '2',
            clickable: 'true',
          }).addTo(layerGroup)
            .on('contextmenu', clickPolyline)

          stopEventPropagation(polyline);
          stopEventPropagation(polyline2);
          stopEventPropagation(polyline3);

          map.fitBounds(polyline.getBounds());
          // Add elevation diagram
          if (document.getElementById('elevation-div')) {
            DomUtil.remove(document.getElementById('elevation-div'));
          }

          elevationDiagram.addTo(map);
          elevationDiagram.addData(coords, map);
        }

        function routeApiRequest() {
          if (wpts.length > 1) {
            const plot = [];

            let ferry = document.getElementsByName('ferry');
            if (ferry[0].checked) ferry = ['ferries']
            else ferry = [];

            wpts.forEach(wpt => {
              plot.push([wpt.lng, wpt.lat]);
            });

            const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;
            fetch(url, {
              method: 'POST',
              headers: {
                Accept: 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
                'Content-Type': 'application/json',
                Authorization: orsAPI
              },
              body: JSON.stringify({
                coordinates: plot,
                elevation: true,
                instructions: true,
                preference: preference,
                options: {avoid_features: ferry}
              })
            })
              .then(response => response.json())
              .then(request => loadRoute(request))
              .catch(err => console.log(`Error: ${err}`));
          }
        }

        DomEvent.on(dlButton, 'click', () => {
          import('./save-gpx.js')
            .then(saveGpx => saveGpx.default(coords));
        });

        DomEvent.on(closeButton, 'click', () => {
          if (divInfo.style.left === '100%') {
            divInfo.style.left = '0%';
            closeButton.innerHTML = 'Hide >';
            closeButton.style.left = '-10px';
            closeButton.style.float = 'right';
          } else {
            divInfo.style.left = '100%';
            closeButton.innerHTML = '< Open';
            closeButton.style.left = '-54px';
            closeButton.style.float = 'left';
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
            key = keys[k];
          } else {
            checked = '';
            key = keys[k];
          }

          profileSelect.innerHTML += `<input type="radio" id="${profiles[key]}" 
            name="profile" value="${profiles[key]}"${checked}>  <label for="${profiles[key]}">${key}</label>`;
        }

        const pref = DomUtil.create('div', '', profileSelect);
        pref.innerHTML = `<label><input type="radio" id ="shortest" name="pref" value="shortest" checked>
          Shortest</label><label><input type="radio" id ="fastest" name="pref" value="fastest">Fastest</label>
          <label><input type="checkbox" id="other_prefs" name="ferry" checked>Avoid ferries</label>`;

        DomEvent.on(profileSelect, 'click', (e) => {
          if (e.target.name === 'profile') {
            profile = e.target.value;
          } else if (e.target.name === 'pref') {
            preference = e.target.value;
          }

          routeApiRequest();
        });
      });

      return button;
    }
  });

export default options => new Control.PlotRoute(options);
