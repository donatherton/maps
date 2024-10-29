"use strict";
L.Control.CreateRoute = L.Control.extend({
  options: {
	position: 'topleft',
  },
  onAdd(map) {
	const button = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom track-plotter');
	button.title = 'Measure / plot route manually';
	button.style.backgroundColor = 'white';
	button.style.backgroundSize = '25px 25px';
	button.style.width = '25px';
	button.style.height = '25px';
	button.style.cursor = 'pointer';
	button.id = 'plotter';

	const smallIcon = L.divIcon({
		className: 'divicon',
		iconSize: [10, 10], // size of the icon
		popupAnchor: [0, -10], // point from which the popup should open relative to the iconAnchor
	});

	button.onclick = function () {
		L.Control.InfoWindow = L.Control.extend({
			onAdd(map) {
			const divInfo = L.DomUtil.create('div', 'info-window');
			divInfo.id = 'divInfo';

			L.DomEvent.on(divInfo, 'contextmenu', L.DomEvent.stopPropagation)
				.disableClickPropagation(divInfo);
			return divInfo;
			},
		});
		L.control.infoWindow = function (options) {
				return new L.Control.InfoWindow(options);
		};
		L.control.infoWindow({ position: 'topright' }).addTo(map);

//		remove these buttons so they don't confuse things
		document.getElementById('ors-router').style = 'display:none';
		document.getElementById('plotter').style = 'display:none';
// Set cursors
//		document.getElementById('map').style.cursor = 'default';

//		onmousedown = function() {
//			document.getElementById('map').style.cursor = 'move';
//		}
//		onmouseup = function() {
//			document.getElementById('map').style.cursor = 'default';
//		}

		const dlBtn = L.DomUtil.create('button', 'button', divInfo);
		dlBtn.innerHTML = 'Save as GPX';

		const elev = L.DomUtil.create('button', 'button', divInfo);
		elev.innerHTML = 'Elevation';

		const reset = L.DomUtil.create('button', 'button', divInfo);
		reset.innerHTML = 'Reset';

		L.DomEvent.on(elev, 'click', () => {
			let wpt = [];
			for (let i = 0; i < wpts.length; i++) {
			wpt.push(Object.values(wpts[i]).reverse());
			}

			wpt = `[[${wpt.join('],[')}]]`;

			const request = new XMLHttpRequest();
			request.open('POST', `https://api.openrouteservice.org/elevation/line`);
			request.setRequestHeader('Accept', 'application/json');
			request.setRequestHeader('Content-Type', 'application/json');
			request.setRequestHeader('Authorization', config.orsAPI);
			request.onreadystatechange = function () {
				if (this.readyState === 4 && request.status === 200) {
					const data = JSON.parse(request.response);
					const coords = [];
					for (let i = 0; i < data.geometry.length; i++) {
					const coord = {};
					coord.alt = data.geometry[i][2];
					coord.lat = data.geometry[i][1];
					coord.lng = data.geometry[i][0];
					coords.push(coord);
					}

					// Elevation diagram
					// Get rid of previous chart
					if (document.getElementById('elevation-div')) {
						L.DomUtil.remove(document.getElementById('elevation-div'));
					}

					const el = L.control.elevation();
					el.addTo(map);
					el.addData(coords);
				}
			}
			const body = `{"format_in": "polyline","format_out": "polyline","geometry": ${wpt}}`;
			request.send(body);
		});

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

			document.getElementById("delbtn").onclick = function() {
				deletepoint(e);
			};
			document.getElementById("insbtn").onclick = function() {
				insertpoint(e);
			};
		}

		function deletepoint(e) {
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

		function insertpoint(e) {
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
			let fileName = prompt('Please enter a name for the route');
			if (fileName === '' || fileName === null) {
			fileName = 'GPX Track';
			}
			let gpxtrack = '</name>\n<trkseg>\n';
			for (let i = 0; i < wpts.length; i++) {
				gpxtrack += `<trkpt lat="${wpts[i].lat}" lon="${wpts[i].lng}">\n</trkpt>\n`;
			}
			gpxtrack += '</trkseg>\n</trk>\n</gpx>';

			const header = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n<gpx xmlns=' +
			'"http://www.topografix.com/GPX/1/1"  creator="DonMaps" version="1.1" xmlns:xsi=' +
			'"http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation=' +
			'"http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">\n<trk>\n<name>';

			const gpx = header + fileName + gpxtrack;
			const a = document.createElement('a');
			const mimeType = 'text/csv;encoding:utf-8'; //mimeType || 'application/octet-stream';
			document.body.appendChild(a);
			a.href = URL.createObjectURL(new Blob([gpx], {
				type: mimeType,
			}));
			a.download = fileName + '.gpx';
			a.click();
			document.body.removeChild(a);
		});
	};

	L.DomEvent
	.on(button, 'click', L.DomEvent.stopPropagation);
	return button;
  },
});
L.control.createRoute = function (options) {
  return new L.Control.CreateRoute(options);
};
L.control.createRoute().addTo(map);

