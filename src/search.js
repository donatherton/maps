import * as L from './leaflet-src.esm.js';

L.Control.PlaceSearch = L.Control.extend({
    options: {
      position: 'topleft',
    },

    onAdd(map) {
      const button = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom search-button');
      button.title = 'Search';

      function stopEventPropagation(elem) {
        L.DomEvent.on(elem, 'click contextmenu mousedown mousewheel dblclick', L.DomEvent.stopPropagation);
      }

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

  const placeSearch = (options) => {
    return new L.Control.PlaceSearch(options);
  };

export default placeSearch


