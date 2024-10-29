"use strict";
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
		button.style.cursor = 'pointer';
		button.style.backgroundColor = 'white';
		button.style.backgroundSize = '25px 25px';
		button.style.width = '25px';
		button.style.height = '25px';

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
				//	if (unit==="N") { dist = dist * 0.8684 }
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

			const startMarker = new L.Marker(coords[0], {
				icon: startIcon,
			}).addTo(map).bindPopup(popupText);
			const endMarker = new L.Marker(coords[coords.length - 1], {
				icon: endIcon,
			}).addTo(map).bindPopup(popupText);

			// Elevation diagram
			if (noAlts === false) {
				const el = L.control.elevation();
				el.addTo(map);
				el.addData(coords);
			}
		}// end loadGPX

		button.onclick = function() {
			fileInput.click();
			fileInput.onchange = function() {
			const file = fileInput.files[0];
			const reader = new FileReader();
			reader.onload = function () {
				const parser = new DOMParser();
				const gpx = parser.parseFromString(reader.result, 'text/xml');
				loadGPX(gpx);
			};
			reader.readAsText(file);
			};
		};

		L.DomEvent
			.on(button, 'click', L.DomEvent.stopPropagation);
		return button;
	},
});
L.control.loadGPX = function (options) {
	return new L.Control.LoadGPX(options);
};
L.control.loadGPX({
	position: 'topleft',
}).addTo(map);

