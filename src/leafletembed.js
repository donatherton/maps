'use strict'
let map;

/* If url contains centre and zoom. Uses a closure for encapsulation
 * and to stop function being called twice */
function centreAndZoom() {
	const $_GET = {};
	const args = location.search.substr(1).split(/&/);
	let centre, zoom;
	if (args.length > 1) {
		let tmp = args[0].split(/=/);
		if (tmp[0] !== '') {
			const comp = decodeURIComponent(tmp.slice(1).join('').replace('+', ' '));
			centre = comp.replace('LatLng(', '');
			centre = centre.replace(')', '');
			centre = centre.split(/,/);
		}
		tmp = args[1].split(/=/);
		if (tmp[0] !== '') {
			zoom = decodeURIComponent(tmp.slice(1).join('').replace('+', ' '));
		}
	} else {
		centre = config.defaultLocation;
		zoom = config.defaultZoom;
	}
	function getCentre() {
		return centre;
	}
	function getZoom() {
		return zoom;
	}
	return { getCentre, getZoom };
}

function initmap() {
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
	//  const esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 
	//  { id: 'esri', 
	//  attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community' });
	const sea = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', 
		{ id: 'sea', 
			attribution: 'Map data: &copy; <a href="https://www.openseamap.org">OpenSeaMap</a> contributors' });
	const transport = L.tileLayer(`https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=${config.tfAPI}`, 
		{ id: 'transport', 
			attribution: 'Map data &copy; <a href=https://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
	const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', 
		{ id: 'topo', 
			attribution: 'Map data &copy; <a href=https://opentopomap.org//">OpenTopoMap</a>', 
			maxZoom: 21 });
	const google = L.tileLayer('https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&s=&y={y}&z={z}', 
		{ id: 'streets', 
			attribution: '<a href="https://mapbox.com/about/maps" class="mapbox-wordmark" target="_blank">Mapbox</a> &copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>', 
			maxZoom: 21 });

	//  const tileUrl = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}', { id: 'elev', 
	//  attribution: '<a href="https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer" target="_blank">USGS</a>' });
	const cz = centreAndZoom();
	map = new L.Map('map', {
		center: cz.getCentre(),
		zoom: cz.getZoom(),
		layers: [osm],
	});

	const baseMaps = {
		Openstreetmap: osm,
		Outdoors: outdoors,
		Cycle: cycle,
		Transport: transport,
		Topographic: topo,
		Google: google,
		//    esri: esri,
		//    Elev: tileUrl
	};
	const overLayers = {
		Openseamap: sea,
	};

	// add layer control
	L.control.layers(baseMaps, overLayers).addTo(map);

	//  let newMarker;
	// Set cursors
	document.getElementById('map').style.cursor = 'default';

	onmousedown = () => {
		document.getElementById('map').style.cursor = 'move';
	}
	onmouseup = () => {
		document.getElementById('map').style.cursor = 'default';
	}

	//function geoData(geoLabel) {
	//	//let i;
	//	//let coords = [];

	//	//	if (typeof(newMarker) !== 'undefined') {
	//	//		if (map.hasLayer(newMarker)) map.removeLayer(newMarker);
	//	//	}
	//	//const geolabel = JSON.parse(xhttp.response);

	//	const coords = [geoLabel[0].lat, geoLabel[0].lon];
	//	L.popup()
	//		.setContent('<a href="https://duckduckgo.com/?q='
	//			+ `${geoLabel[0].display_name}" target="_blank">${geoLabel[0].display_name}</a>`)
	//		.setLatLng(coords)
	//		.openOn(map);
	//}

	function geoDataRequest(url) {
		fetch(url)
			.then(response => response.json())
			.then(geoLabel => {
				const coords = [geoLabel[0].lat, geoLabel[0].lon];
				L.popup()
					.setContent('<a href="https://duckduckgo.com/?q='
						+ `${geoLabel[0].display_name}" target="_blank">${geoLabel[0].display_name}</a>`)
					.setLatLng(coords)
					.openOn(map);
			})
		//geoData(data));
		//	const xhttp = new XMLHttpRequest();
		//	xhttp.onreadystatechange = function() {
		//		if (this.readyState === 4 && this.status === 200) {
		//			geoData(xhttp);
		//		}
		//	};
		//	xhttp.open('GET', url, true);
		//	xhttp.send();
	}

	function geocode(e) {
		const infoPopup = L.popup();
		infoPopup
			.setLatLng(e.latlng)
			.setContent(`${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}<br /><button class="button" id="geo">What's here?</button>`)
			.openOn(map);
		document.getElementById('geo').onclick = () => {
			e.preventDefault;
			const url = `https://nominatim.openstreetmap.org/?addressdetails=1&q=${e.latlng.lat},${e.latlng.lng}&format=json&limit=1`;
			geoDataRequest(url);
			map.closePopup(infoPopup);
		};
	}
	map.on('contextmenu', geocode);

	//  map.on('click', () => {
	//  	if (typeof(newMarker) !== 'undefined') {
	//		if (map.hasLayer(newMarker)) map.removeLayer(newMarker);
	//	}
	//  });

	// Reload button
	L.Control.Reload = L.Control.extend({
		onAdd(map) {
			const reloadButton = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom reload');
			reloadButton.setAttribute('title', 'Reload map at this location and zoom');
			reloadButton.style.backgroundColor = 'white';
			reloadButton.style.backgroundSize = '35px 35px';
			reloadButton.style.width = '35px';
			reloadButton.style.height = '35px';
			reloadButton.style.cursor = 'pointer';

			L.DomEvent.on(reloadButton, 'click', L.DomEvent.stopPropagation);
			L.DomEvent.on(reloadButton, 'contextmenu', L.DomEvent.stopPropagation);
			L.DomEvent.on(reloadButton, 'mousedown', L.DomEvent.stopPropagation);
			L.DomEvent.on(reloadButton, 'mousewheel', L.DomEvent.stopPropagation);

			reloadButton.onclick = () => {
				const centre = map.getCenter();
				//		centre = centre;
				const zoom = map.getZoom();
				const url = `index.html?coords=${centre}&zoom=${zoom}`;
				window.location.href = url;
			};
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
}// end initmap
