"use strict";
//L.Control.FindLocation = L.Control.extend({
//	onAdd(map) {
//		let mark;
//		const button = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom location-button');
//		button.setAttribute('title', 'Get your current location');

//		button.style.backgroundColor = 'white';
//		button.style.backgroundSize = '25px 25px';
//		button.style.width = '25px';
//		button.style.height = '25px';
//		button.style.cursor = 'pointer';

//		L.DomEvent.on(button, 'click', () => {
//			map.locate({ setView: true, maxZoom: 16 });

//			function onLocationFound(e) {
//				const radius = e.accuracy / 2;
//				mark = new L.CircleMarker(e.latlng, radius).addTo(map);
//			}
//			map.on('locationfound', onLocationFound);

//			function onMapClick() {
//				map.removeLayer(mark);
//			}
//			map.on('click', onMapClick);

//			function onLocationError(e) {
//				alert(e.message);
//			}

//			map.on('locationerror', onLocationError);

//			/*		if (navigator.geolocation) {
//					navigator.geolocation.getCurrentPosition(function(position) {
//					lat = position.coords.latitude;
//					lon = position.coords.longitude;
//					var mark = L.circleMarker([position.coords.latitude, position.coords.longitude]).addTo(map);
//					map.setView([lat, lon], 16);

//					function onMapClick(e) {
//					map.removeLayer(mark)
//					}
//					map.on('click', onMapClick);
//					})
//				} */
//		});

//		L.DomEvent
//		.on(button, 'click', L.DomEvent.stopPropagation);
//		return button;
//	},
//});
//L.control.findLocation = function (options) {
//	return new L.Control.FindLocation(options);
//};
//L.control.findLocation({
//	position: 'topleft',
//}).addTo(map);

// If GPS works
L.Control.FindLocation = L.Control.extend({
	onAdd(map) {
	const button = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom location-button');
	button.setAttribute('title', 'Get your current location');

	button.style.backgroundColor = 'white';
	button.style.backgroundSize = '25px 25px';
	button.style.width = '25px';
	button.style.height = '25px';
	button.style.cursor = 'pointer';

	let i = true;
	let id;
	let mark;
		button.onclick = () => {
	/*		map.locate()

		function onLocationFound(e) {
			var radius = e.accuracy / 2;
			map.setView(e.latlng, 17);
			mark = L.marker(e.latlng).addTo(map);
		}
		map.on('locationfound', onLocationFound);

		function onMapClick(e) {
		map.removeLayer(mark)
		}
		map.on('click', onMapClick);

		function onLocationError(e) {
			alert(e.message);
		}
		map.on('locationerror', onLocationError);
*/
	if (i == true) {
		if (navigator.geolocation) {
		button.style.backgroundColor = 'red';
		i = false;
		mark = new L.CircleMarker([0, 0]).addTo(map);
		id = navigator.geolocation.watchPosition((position) => {
			const lat = position.coords.latitude;
			const lon = position.coords.longitude;// alert(lat + ' ' + lon);
			mark.setLatLng([lat, lon]);
			map.setView([lat, lon]);

//			function onMapClick(e) {
//				if (typeof(mark) !== 'undefined') {
//					if (map.hasLayer(mark)) map.removeLayer(mark)
//				}
//			}
//			map.on('click', onMapClick);
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

	L.DomEvent
	.on(button, 'click', L.DomEvent.stopPropagation);
	return button;
	},
});
L.control.findLocation = (options) => {
	return new L.Control.FindLocation(options);
};
L.control.findLocation({
	position: 'topleft',
}).addTo(map);

