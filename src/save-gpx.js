export default function saveGpx(coords) {
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
