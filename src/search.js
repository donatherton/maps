'use strict';
L.Control.PlaceSearch = L.Control.extend({
	options: {
		position: 'topleft',
	},

	onAdd(map) {
		const button = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom search-button');
		button.title = 'Search';
		button.style.backgroundColor = 'white';
		button.style.backgroundSize = '25px 25px';
		button.style.width = '25px';
		button.style.height = '25px';
		button.style.cursor = 'pointer';

		L.DomEvent.on(button, 'click', L.DomEvent.stopPropagation);
		L.DomEvent.on(button, 'contextmenu', L.DomEvent.stopPropagation);
		L.DomEvent.on(button, 'mousedown', L.DomEvent.stopPropagation);
		L.DomEvent.on(button, 'mousewheel', L.DomEvent.stopPropagation);

		L.DomEvent.on(button, 'click', () => {
		const searchDiv = L.DomUtil.create('div', 'info-window', button);
		searchDiv.id = 'search-div';
		searchDiv.style.width = '245px';

		L.DomEvent.on(searchDiv, 'click', L.DomEvent.stopPropagation);
		L.DomEvent.on(searchDiv, 'contextmenu', L.DomEvent.stopPropagation);
		L.DomEvent.on(searchDiv, 'mousedown', L.DomEvent.stopPropagation);

		const searchInput = L.DomUtil.create('input', 'info-window-input', searchDiv);
		searchInput.type = 'text';
		searchInput.id = 'search-input';
		searchInput.placeholder = 'Search';

		searchInput.focus();

		let resultsTable;

		function geoSearch(geosearch) {
			function addRowListener(result, line) {
				L.DomEvent.addListener(line, 'click touchend', (e) => {
					const coords = [result.lat, result.lon];
					map.setView(coords, 16);
					L.DomUtil.remove(resultsTable);
					L.DomUtil.remove(searchDiv);
					L.DomUtil.remove(searchInput);
					const newMarker = new L.CircleMarker(coords, [0, 0], { radius: 20 }).addTo(map);
					L.DomEvent.stopPropagation(e);

					function onMapClick() {
						map.removeLayer(newMarker);
					}
					map.on('click', onMapClick);
				});
			}

			const searchUrl = `https://nominatim.openstreetmap.org/?format=json&addressdetails=1&q=${geosearch}&format=json&limit=5&email=don@donatherton.co.uk`;
			fetch(searchUrl)
				.then(response => response.json())
				.then(results=> {
					if (results.length > 0) {
						resultsTable = L.DomUtil.create('div', 'info-window-inner', button);
						resultsTable.id = 'searchDropdown1';
						//for (let i = 0; i < results.length; i++)
						results.forEach((resultLine, i) => {
							 resultLine = L.DomUtil.create('p', '', resultsTable);
							resultLine.innerHTML = results[i].display_name;
							addRowListener(results[i], resultLine);
						})
					} else searchInput.value = 'No results';
			})

		//	const xhttp = new XMLHttpRequest();
		//	xhttp.onreadystatechange = () => {
		//		if (this.readyState === 4 && this.status === 200) {
		//			const results = JSON.parse(xhttp.response);
		//			if (results.length > 0) {
		//				resultsTable = L.DomUtil.create('div', 'info-window-inner', button);
		//				resultsTable.id = 'searchDropdown1';
		//				for (let i = 0; i < results.length; i++) {
		//					const resultLine = L.DomUtil.create('p', '', resultsTable);
		//					resultLine.innerHTML = results[i].display_name;
		//					addRowListener(results[i], resultLine);
		//				}

		//			} else searchInput.value = 'No results';
		//		}
		//	};
		//	xhttp.open('GET', searchUrl, true);
		//	xhttp.send();
		}

		map.on('mousedown', () => {
			if (searchDiv) L.DomUtil.remove(searchDiv);
			if (searchInput) L.DomUtil.remove(searchInput);
			if (resultsTable) L.DomUtil.remove(resultsTable);
		});

		L.DomEvent.addListener(searchInput, 'keyup', (e) => {
			L.DomEvent.stopPropagation(e);
			if (e.keyCode === 13) { // alert();console.log(e.keyCode);
				if (resultsTable) L.DomUtil.remove(resultsTable);
				geoSearch(searchInput.value);
			}
		});

		}); // button click  function

		L.DomEvent
		.on(button, 'click', L.DomEvent.stopPropagation);
		return button;
	},
});

L.control.placeSearch = (options) => {
	return new L.Control.PlaceSearch(options);
};
L.control.placeSearch().addTo(map);

