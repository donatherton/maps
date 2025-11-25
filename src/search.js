import { CircleMarker, Control, DomEvent, DomUtil } from './leaflet-src.esm.js';

Control.PlaceSearch = Control.extend({
    options: {
      position: 'topleft',
    },

    onAdd(map) {
      const button = DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom search-button button');
      button.title = 'Search';

      function stopEventPropagation(elem) {
        DomEvent.on(elem, 'click contextmenu mousedown mousewheel dblclick', DomEvent.stopPropagation);
      }

      stopEventPropagation(button);

      DomEvent.on(button, 'click', () => {
        const searchDiv = DomUtil.create('div', 'info-window', button);
        searchDiv.id = 'search-div';
        searchDiv.style.width = '245px';

        stopEventPropagation(searchDiv);

        const searchInput = DomUtil.create('input', 'info-window-input', searchDiv);
        searchInput.type = 'text';
        searchInput.id = 'search-input';
        searchInput.placeholder = 'Search';

        searchInput.focus();

        let resultsTable;

        function geoSearch(searchStr) {
          function addRowListener(result, line) {
            DomEvent.addListener(line, 'click touchend', (e) => {
              const coords = [result.lat, result.lon];
              map.setView(coords, 16);
              DomUtil.remove(resultsTable);
              DomUtil.remove(searchDiv);
              DomUtil.remove(searchInput);
              const newMarker = new CircleMarker(coords, [0, 0], { radius: 20 }).addTo(map);
              DomEvent.stopPropagation(e);

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
                resultsTable = DomUtil.create('div', 'info-window-inner', button);
                resultsTable.id = 'searchDropdown1';
                results.forEach((resultLine, i) => {
                  resultLine = DomUtil.create('p', '', resultsTable);
                  resultLine.innerHTML = results[i].display_name;
                  addRowListener(results[i], resultLine);
                })
              } else searchInput.value = 'No results';
            })
        }

        map.on('mousedown', () => {
          if (searchDiv) DomUtil.remove(searchDiv);
          if (searchInput) DomUtil.remove(searchInput);
          if (resultsTable) DomUtil.remove(resultsTable);
        });

        DomEvent.addListener(searchInput, 'keyup', (e) => {
          DomEvent.stopPropagation(e);
          if (e.keyCode === 13) { 
            if (resultsTable) DomUtil.remove(resultsTable);
            geoSearch(searchInput.value);
          }
        });
      });
      return button;
    },
  });

export default (options) => {
  return new Control.PlaceSearch(options);
};
