/* global L, config, Chart */
'use strict';

(() => {
  let map;
  (() => {
    /* Set up map */
    // create the tile layers with correct attribution
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { id: 'osm',
        attribution: 'Map data &copy;  <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
    const outdoors = L.tileLayer(`https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=${config.tfAPI}`,
      { id: 'outdoors',
        attribution: 'Map data &copy; <a href=https://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
    const cycle = L.tileLayer(`https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=${config.tfAPI}`,
      { id: 'cycle',
        attribution: 'Map data &copy; <a href=https://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
    const sea =  L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
      { id: 'sea',
        attribution: 'Map data: &copy; <a href="https://www.openseamap.org">OpenSeaMap</a> contributors' });
    const transport =  L.tileLayer(`https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=${config.tfAPI}`,
      { id: 'transport',
        attribution: 'Map data &copy; <a href=https://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
    const topo =  L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      { id: 'topo',
        attribution: 'Map data &copy; <a href=https://opentopomap.org//">OpenTopoMap</a>',
        maxZoom: 21 });
    const google =  L.tileLayer('https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&s=&y={y}&z={z}',
      { id: 'streets',
        attribution: '<a href="https://mapbox.com/about/maps" class="mapbox-wordmark" target="_blank">Mapbox</a> &copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>',
        maxZoom: 21 });

    const baseMaps = {
      Openstreetmap: osm,
      Outdoors: outdoors,
      Cycle: cycle,
      Transport: transport,
      Topographic: topo,
      Google: google
      //    esri: esri,
    };
    const overLayers = {
      Openseamap: sea,
    };

    const cz = centreAndZoom()
    map = new L.Map('map', {
      center: cz[0],
      zoom: cz[1],
      layers: cz[2]//[osm],
    });

    // add layer control
    L.control.layers(baseMaps, overLayers).addTo(map);

    // Set cursors
    function onMouse(e) {
      e.type === 'mousedown' ? mapDiv.style.cursor = 'grab' :  mapDiv.style.cursor = 'default';
    }
    
    const mapDiv = document.getElementById('map');

    mapDiv.style.cursor = 'default';

    mapDiv.addEventListener('mousedown', onMouse);
    mapDiv.addEventListener('mouseup', onMouse);

    /* If url contains centre and zoom, default values if not */
    function centreAndZoom() {
      const args = {};
      window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => {
        args[key] = value;
      });

      let centre, zoom, lat, lng, layer;
      if (Object.keys(args).length > 0) {
        ({ lat, lng, zoom, layer} = args);
        centre = [lat, lng];
      } else {
        centre = config.defaultLocation;
        zoom = config.defaultZoom;
        layer = config.layer;
      }
      layer = baseMaps[Object.keys(baseMaps).find(key => baseMaps[key].options.id === layer)];
      return [centre, zoom, layer];
    }

    function getGeoData(e) {
      const infoPopup = L.popup();
      infoPopup
        .setLatLng(e.latlng)
        .setContent(`${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}<br /><button class="button" id="geo">What's here?</button>`)
        .openOn(map);
      document.getElementById('geo').onclick = () => {
        geoDataRequest(e);
        map.closePopup(infoPopup);
      };
    }
    map.on('contextmenu', getGeoData);

    // Reload button
    L.Control.Reload = L.Control.extend({
      onAdd(map) {
        const reloadButton = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom reload');
        reloadButton.setAttribute('title', 'Reload map at this location and zoom');

        stopEventPropagation(reloadButton);

        L.DomEvent.on(reloadButton, 'click', () => {
          const centre = map.getCenter();
          const zoom = map.getZoom();
          const mapLayerID = Object.keys(map._layers)[0];

          window.location.href = `index.html?lat=${centre.lat}&lng=${centre.lng}&zoom=${zoom}&layer=${map._layers[mapLayerID].options.id}`;
        });
        return reloadButton;
      },

      onRemove(map) {
        // Nothing to do here
      },
    });

    L.control.reload = (option) => {
      return new L.Control.Reload(option);
    };
    L.control.reload({ position: 'topleft' }).addTo(map);
  })();

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

  function stopEventPropagation(elem) {
    L.DomEvent.on(elem, 'click contextmenu mousedown mousewheel dblclick', L.DomEvent.stopPropagation);
  }

  function saveGpx(coords) {
    if (coords === undefined || coords.length < 1) return; 
    let gpxTrack = '';
    let el; // Is there elevation data?
    coords.forEach(coord => {
      coord.alt !== undefined ? el = `<ele>${coord.alt}</ele>` : el = '';
      gpxTrack += `<trkpt lat="${coord.lat}" lon="${coord.lng}">${el}</trkpt>\n`;
    });

    const gpx = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n
      <gpx xmlns="http://www.topografix.com/GPX/1/1"  creator="DonMaps" version=
      "1.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation=
      "http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">\n
      <trk>\n<name>gpx-track</name>\n<trkseg>\n${gpxTrack}</trkseg>\n</trk>\n</gpx>`;

    const a = document.createElement('a');
    const mimeType = 'text/csv;encoding:utf-8'; //mimeType || 'application/octet-stream';
    document.body.appendChild(a);
    a.href = URL.createObjectURL(new Blob([gpx], {
      type: mimeType,
    }));
    a.download = 'gpx-track.gpx';
    a.click();
    document.body.removeChild(a);
  };

  /*********************/
  //*search
  L.Control.PlaceSearch = L.Control.extend({
    options: {
      position: 'topleft',
    },

    onAdd(map) {
      const button = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom search-button');
      button.title = 'Search';

      stopEventPropagation(button);

      L.DomEvent.on(button, 'click', () => {
        const searchDiv = L.DomUtil.create('div', 'info-window', button);
        searchDiv.id = 'search-div';
        searchDiv.style.width = '245px';

        stopEventPropagation(searchDiv);

        const searchInput = L.DomUtil.create('input', 'info-window-input', searchDiv);
        searchInput.type = 'text';
        searchInput.id = 'search-input';
        searchInput.placeholder = 'Search';

        searchInput.focus();

        let resultsTable;

        function geoSearch(searchStr) {
          function addRowListener(result, line) {
            L.DomEvent.addListener(line, 'click touchend', (e) => {
              const coords = [result.lat, result.lon];
              map.setView(coords, 16);
              L.DomUtil.remove(resultsTable);
              L.DomUtil.remove(searchDiv);
              L.DomUtil.remove(searchInput);
              const newMarker = new L.CircleMarker(coords, [0, 0], { radius: 20 }).addTo(map);
              L.DomEvent.stopPropagation(e);

              function onMarkerClick() {
                map.removeLayer(newMarker);
              }
              newMarker.on('click touch', onMarkerClick);
            });
          }

          fetch(`https://nominatim.openstreetmap.org/?format=json&addressdetails=1&q=${searchStr}&format=json&limit=5`)
            .then(response => response.json())
            .then(results=> {
              if (results.length > 0) {
                resultsTable = L.DomUtil.create('div', 'info-window-inner', button);
                resultsTable.id = 'searchDropdown1';
                results.forEach((resultLine, i) => {
                  resultLine = L.DomUtil.create('p', '', resultsTable);
                  resultLine.innerHTML = results[i].display_name;
                  addRowListener(results[i], resultLine);
                })
              } else searchInput.value = 'No results';
            })
        }

        map.on('mousedown', () => {
          if (searchDiv) L.DomUtil.remove(searchDiv);
          if (searchInput) L.DomUtil.remove(searchInput);
          if (resultsTable) L.DomUtil.remove(resultsTable);
        });

        L.DomEvent.addListener(searchInput, 'keyup', (e) => {
          L.DomEvent.stopPropagation(e);
          if (e.keyCode === 13) { 
            if (resultsTable) L.DomUtil.remove(resultsTable);
            geoSearch(searchInput.value);
          }
        });
      });
      return button;
    },
  });

  L.control.placeSearch = (options) => {
    return new L.Control.PlaceSearch(options);
  };
  L.control.placeSearch().addTo(map);

  /*********************/
  //*plotroute (ORS)
  L.Control.PlotRoute = L.Control.extend({
    options: {
      position: 'topleft',
    },
    onAdd(map) {
      const button = L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-custom ors-routing');
      button.title = 'Get route with OpenRouteService';
      button.id = 'ors-router';

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

        // elevation diagram
        const el = L.control.elevation();
        el.addTo(map);

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
                // L.DomUtil.remove(geoInput[i]);
              }
            }
            map.removeLayer(e.target);
            routeRequest();
            //            geoRequest(latlng, i, 'del');
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
          document.getElementById('what').onclick = function() {
            geoDataRequest(e)
          };
          document.getElementById(buttonID).onclick = function() {
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
          for (let i = 0; i < geometry.length; i=i+1) {
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
              if (typeof(spotMarker) !== 'undefined') {
                if (map.hasLayer(spotMarker)) map.removeLayer(spotMarker);
              }
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
          if (distance > 1609) distance = `${(distance / 1609.34).toFixed(2)} miles`;
          else distance = `${Math.round(distance)}m`;
          routeInfo.innerHTML = `<h4 style="margin:0">Total distance: ${distance}</h4>`;
          for (let i = 0; i < route.properties.segments.length; i=i+1) {
            for (let j = 0; j < route.properties.segments[i].steps.length; j=j+1) {
              const step = route.properties.segments[i].steps[j];
              let stepDistance = step.distance;
              if (stepDistance > 1609) stepDistance = `${(stepDistance / 1609.34).toFixed(2)} miles`;
              else stepDistance += 'm';
              p = L.DomUtil.create('p', 'route-info', routeInfo);
              p.innerHTML = `- ${step.instruction} (${stepDistance})`;
              addRowListener(step, coords);
            }
          }
          if (typeof(polyline) !== 'undefined') {
            if (map.hasLayer(polyline)) map.removeLayer(polyline);
          }
          if (typeof(polyline2) !== 'undefined') {
            if (map.hasLayer(polyline2)) map.removeLayer(polyline2);
          }
          if (typeof(polyline3) !== 'undefined') {
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

          //      Add elevation diagram
          el.clear();
          el.addData(coords);
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

            const url = `https://api.openrouteservice.org/v2/directions/${config.profile}/geojson`;
            fetch(url, {
              method: 'POST',
              headers: {
                'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
                'Content-Type': 'application/json',
                'Authorization': config.orsAPI
              },
              body: JSON.stringify({
                'coordinates': plot,
                'elevation': true,
                'instructions': true,
                'preference': config.preference,
                'options': {'avoid_features': ferry}
              })
            })
              .then(response => response.json())
              .then(request => loadRoute(request))
          }
        }

        L.DomEvent.on(dlButton, 'click', () => saveGpx(coords));

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
          if (values[k] === config.profile) {
            checked = 'checked';
            key = keys[k]
          } else {
            checked = '';
            key = keys[k]
          }
          profileSelect.innerHTML += `<input type="radio" id="${profiles[key]}" 
            name="profile" value="${profiles[key]}"${checked}>  <label for="${profiles[key]}">${key}</label>`;
        }
        L.DomEvent.on(profileSelect, 'click', () => {
          const radioValue = document.getElementsByName('profile');
          for (let i=0; i<radioValue.length; i=i+1) {
            if (radioValue[i].checked) {
              config.profile = radioValue[i].value;
              routeRequest();
              return;
            }
          }
        });

        const pref = L.DomUtil.create('div', '', profileSelect);
        pref.innerHTML = `<label><input type="radio" id ="shortest" name="pref" value="shortest" checked>
          Shortest</label><label><input type="radio" id ="fastest" name="pref" value="fastest">Fastest</label>
          <label><input type="checkbox" id="other_prefs" name="ferry" checked>Avoid ferries</label>`;

        L.DomEvent.on(pref, 'click', (() => {
          const radioValue = document.getElementsByName('pref');
          for (let i=0; i<radioValue.length; i=i+1) {
            if (radioValue[i].checked) {
              config.preference = radioValue[i].value;
              routeRequest();
              return;
            }
          }
        }));
      });
      return button;
    },
  });
  L.control.plotRoute = function (options) {
    return new L.Control.PlotRoute(options);
  };
  L.control.plotRoute().addTo(map);

  /*********************/
  //*plottrack
  L.Control.CreateRoute = L.Control.extend({
    options: {
      position: 'topleft',
    },
    onAdd(map) {
      const button = L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-custom track-plotter');
      button.title = 'Measure / plot route manually';
      button.id = 'plotter';

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
        L.control.infoWindow({ position: 'topright' }).addTo(map);

        // Disable these buttons so they don't confuse things
        document.getElementById('ors-router').setAttribute('disabled', 'disabled');
        document.getElementById('plotter').setAttribute('disabled', 'disabled');

        const dlBtn = L.DomUtil.create('button', 'button', divInfo);
        dlBtn.innerHTML = 'Save as GPX';

        const elev = L.DomUtil.create('button', 'button', divInfo);
        elev.innerHTML = 'Elevation';

        const reset = L.DomUtil.create('button', 'button', divInfo);
        reset.innerHTML = 'Reset';

        let el;

        L.DomEvent.on(elev, 'click', () => {
          let wpt = [];
          for (let i = 0; i < wpts.length; i++) {
            wpt.push(Object.values(wpts[i]).reverse());
          }
          fetch(`https://api.openrouteservice.org/elevation/line`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': config.orsAPI
            },
            body: JSON.stringify({
              'format_in': 'polyline',
              'format_out': 'polyline',
              'geometry': wpt
            })
          })
            .then(response => response.json())
            .then(data => {
              wpts.forEach((wpt, i) => {
                wpt.alt = data.geometry[i][2];
              });
              // Elevation diagram
              // Get rid of previous chart
              if (document.getElementById('elevation-div')) {
                L.DomUtil.remove(document.getElementById('elevation-div'));
              }
              el = L.control.elevation();
              el.addTo(map);
              el.addData(wpts);
            })
        })

        L.DomEvent.on(reset, 'click', () => {
          if (typeof el !== 'undefined') el.remove();
          map
            .removeLayer(polyline)
            .removeLayer(markerGroup);
          polyline = L.polyline([], { weight: 2 }).addTo(map);
          markerGroup = L.layerGroup().addTo(map);
          wpts = [];
          distanceDiv.innerHTML = '';
        });

        const distanceDiv = L.DomUtil.create('span', '', divInfo);
        distanceDiv.style.margin = '20px';

        let wpts = [];
        let markerGroup = L.layerGroup().addTo(map);

        let polyline = L.polyline([], { weight: 2 }).addTo(map);

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
            if (distance > 1609) {
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

        L.DomEvent.on(dlBtn, 'click', () => saveGpx(wpts));
      };
      return button;
    },
  });
  L.control.createRoute = (options) => {
    return new L.Control.CreateRoute(options);
  };
  L.control.createRoute().addTo(map);

  /*********************/
  //*loadgpx file
  L.Control.LoadGPX = L.Control.extend({
    onAdd(map) {
      const startIcon = new L.DivIcon({
        className: 'starticon',
        iconSize: [15, 15],
        popupAnchor: [2, -6], // point from which the popup should open relative to the iconAnc
      });
      const endIcon = new L.DivIcon({
        className: 'endicon',
        iconSize: [15, 15],
        popupAnchor: [2, -6], // point from which the popup should open relative to the iconAnc
      });

      const button = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom load_button');
      button.innerHTML = '<span style="font-size:10px; font-weight:bold">GPX</span>';
      button.title = 'Load a GPX file';

      stopEventPropagation(button);

      // Create an invisible file input
      const fileInput = L.DomUtil.create('input', '', button);
      fileInput.type = 'file';
      fileInput.accept = '.gpx';
      fileInput.style.display = 'none';

      function loadGPX(gpxFile) {
        let alt;
        const coords = [];
        let noAlts = false;
        let lngth = 0;
        let tags;

        if (gpxFile.getElementsByTagName('trk').length > 0) {
          tags = 'trkpt';
        } else if (gpxFile.getElementsByTagName('rte').length > 0) {
          tags = 'rtept';
        } else {
          alert("Sorry, this file can't be loaded");
        }

        function distance(lat1, lon1, lat2, lon2, unit) {
          if ((lat1 === lat2) && (lon1 === lon2)) {
            return 0;
          }
          const radlat1 = (Math.PI * lat1) / 180;
          const radlat2 = (Math.PI * lat2) / 180;
          const theta = lon1 - lon2;
          const radtheta = (Math.PI * theta) / 180;
          let dist = (Math.sin(radlat1) * Math.sin(radlat2)) + (Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta));
          if (dist > 1) {
            dist = 1;
          }
          dist = Math.acos(dist);
          dist = (dist * 180) / Math.PI;
          dist = dist * 60 * 1.1515;
          if (unit === 'K') { dist *= 1.609344; }
          //  if (unit==="N") { dist = dist * 0.8684 }
          return dist;
        }

        const name = gpxFile.getElementsByTagName('name')[0].innerHTML;
        const trkpts = gpxFile.getElementsByTagName(tags);
        for (let i = 0; i < trkpts.length; i++) {
          const lat = Number(trkpts[i].getAttribute('lat'));
          const lng = Number(trkpts[i].getAttribute('lon'));
          try {
            alt = Number(trkpts[i].getElementsByTagName('ele')[0].innerHTML);
          } catch (e) { noAlts = true; }
          const latlng = { lat, lng, alt };
          coords.push(latlng);
          if (i > 0) {
            lngth += distance(coords[i].lat, coords[i].lng, coords[i - 1].lat, coords[i - 1].lng);
          }
        }

        const popupText = `<p>${name}</p><p>${Math.round(lngth * 100) / 100} miles</p>`;

        const polyline = new L.Polyline(coords).setStyle({
          color: 'red',
        }).addTo(map).bindPopup(popupText);

        map.fitBounds(polyline.getBounds());

        new L.Marker(coords[0], {
          icon: startIcon,
        }).addTo(map).bindPopup(popupText);
        new L.Marker(coords[coords.length - 1], {
          icon: endIcon,
        }).addTo(map).bindPopup(popupText);

        // Elevation diagram
        if (noAlts === false) {
          const el = L.control.elevation();
          el.addTo(map);
          el.addData(coords);
        }
      }

      button.onclick = () => {
        fileInput.click();
        fileInput.onchange = () => {
          const file = fileInput.files[0];
          const reader = new FileReader();
          reader.onload = () => {
            const parser = new DOMParser();
            const gpx = parser.parseFromString(reader.result, 'text/xml');
            loadGPX(gpx);
          };
          reader.readAsText(file);
        };
      };
      return button;
    },
  });
  L.control.loadGPX = (options) => {
    return new L.Control.LoadGPX(options);
  };
  L.control.loadGPX({
    position: 'topleft',
  }).addTo(map);

  /*********************/
  //*location
  L.Control.FindLocation = L.Control.extend({
    onAdd(map) {
      const button = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom location-button');
      button.title = 'Get your current location';

      stopEventPropagation(button);

      let i = true;
      let id;
      let mark;
      button.onclick = () => {
        if (i == true) {
          if (navigator.geolocation) {
            button.style.backgroundColor = 'red';
            i = false;
            mark = new L.CircleMarker([0, 0]).addTo(map);
            id = navigator.geolocation.watchPosition((position) => {
              const lat = position.coords.latitude;
              const lon = position.coords.longitude;
              mark.setLatLng([lat, lon]);
              map.setView([lat, lon]);

            },
              () => {
                alert('Can\'t find you');
              },
              { enableHighAccuracy: true, timeout: 50000 });
          } else alert('No geolocation');
        } else {
          if (typeof(mark) !== 'undefined') {
            if (map.hasLayer(mark)) map.removeLayer(mark);
          }
          navigator.geolocation.clearWatch(id);
          button.style.backgroundColor = 'white';
          i = true;
        }
      };
      return button;
    },
  });
  L.control.findLocation = (options) => {
    return new L.Control.FindLocation(options);
  };
  L.control.findLocation({
    position: 'topleft',
  }).addTo(map);

  /*********************/
  //*fullscreen
  L.Control.FullScreen = L.Control.extend({
    options: {
      position: 'topleft',
    },

    onAdd(map) {
      const button = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom fullscreen');
      button.title = 'Fullscreen';

      stopEventPropagation(button);

      button.onclick = function () {
        const isInFullScreen = (document.fullscreenElement && document.fullscreenElement !== null)
          || (document.webkitFullscreenElement && document.webkitFullscreenElement !== null)
          || (document.mozFullScreenElement && document.mozFullScreenElement !== null)
          || (document.msFullscreenElement && document.msFullscreenElement !== null);

        const docElm = document.getElementById('map');
        if (!isInFullScreen) {
          if (docElm.requestFullscreen) {
            docElm.requestFullscreen();
          } else if (docElm.mozRequestFullScreen) {
            docElm.mozRequestFullScreen();
          } else if (docElm.webkitRequestFullScreen) {
            docElm.webkitRequestFullScreen();
          } else if (docElm.msRequestFullscreen) {
            docElm.msRequestFullscreen();
          }
        } else if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      };
      // L.DomEvent
      // .on(button, 'click', L.DomEvent.stopPropagation);
      return button;
    },
  });
  L.control.fullScreen = function (options) {
    return new L.Control.FullScreen(options);
  };
  L.control.fullScreen({

  }).addTo(map);

  /*********************/
  //*elevation
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

      stopEventPropagation(container);

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
      Chart.Tooltip.positioners.custom = (items) => {
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
  L.control.elevation = (options) => {
    return new L.Control.Elevation(options);
  };
})()
