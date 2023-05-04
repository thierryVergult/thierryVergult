let jj = {};

jj.config = {
  "idHtml": "idVis",
  "idLegendHtml": "idVisLegend",
  "labelFontSize": 20,
  "bullEyeText": "",
  "bullEyeFontSize": 20,
  "log": true,
  "highlightPct": 50,
  "highlightClearLabels": true,
  "defaultLineWidth": 3,
  "status": [
    { "opacityPct": 35}, // 0% is volledig transparant
    { "opacityPct": 70},
    { "opacityPct": 100}, // 100% is volledig zichtbaar
    { "linewidth": 5}
  ]
};

jj.colorHex = function(str) {
  // thanks: https://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
  
  var ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = str;
  
  return ctx.fillStyle;
}

jj.redistribute = function ( cells, lanes, updStart, updEnd, updLanes) {

  let arr = [],
      pct = jj.config.highlightPct || 50,
      factor = 10;  // for better precision, since trunc without decimals

  let m = updEnd - updStart + 1;

  let x = (100 - pct) * factor / (lanes-updLanes);
  x = Math.trunc(x);
  for (let i = 1; i <= cells; i++ ) {
    arr[i] = x;
  }

  let y = pct * factor / updLanes;
  y = Math.trunc(y);
  for (let i = updStart; i <= updEnd; i++ ) {
    arr[i] = y;
  }

  let tot = (lanes - updLanes)*x + (updLanes*y);
  arr[0] = tot;

  return arr;
}

jj.redistributeLabels = function ( lanes, laneStart, laneEnd) {

  // a segment of lanes (representing a group) gets 500, the remaining part also 500

  let factor = 10;  // for better precision
      pct = jj.config.highlightPct || 50,
      highlightLanes = laneEnd - laneStart + 1,
      highlightPct = pct * factor / highlightLanes,    
      nonHighlightPct = (100-pct) * factor / (lanes - highlightLanes);

  highlightPct = Math.trunc(highlightPct);
  nonHighlightPct = Math.trunc(nonHighlightPct);

  let arr = Array(lanes).fill(nonHighlightPct),
      lab = Array(lanes).fill('');

  for (let i = 0; i < highlightLanes; i++ ) {
    let ind = laneStart - 1 + i;
    arr[ind] = highlightPct;
    lab[ind] = labels[ind];
  }

  let rotationDegrees = nonHighlightPct * (laneStart - 1) / 100 * 360 / factor;
  // and compensate now for the highlightPct
  let nonHiglightedFraction = (100 - jj.config.highlightPct)/100,
      nonHiglightedDegrees = 360 * nonHiglightedFraction;
  // bring to 6 o'clock (+90) and half back
  rotationDegrees += 90 - nonHiglightedDegrees/2;
  rotationDegrees = Math.trunc( rotationDegrees);

  //console.log( 'highlight', highlightPct, nonHighlightPct, 'new label values', arr, 'rota', rotationDegrees + '°');

  return { 'values': arr, 'rotation': rotationDegrees, 'labels': lab};
}


jj.highlightGroup = function ( groupNr, duration = 2000) {

  // eventually add code to go back to the base situation, with no highlighting at all

  data[0].values = jjStudent.group[groupNr].highlight.values;
  data[1].values = jjStudent.group[groupNr].highlight.label.values;

  let rotation = jjStudent.group[groupNr].highlight.label.rotation;
  rotation = - rotation; // since rotation parameter works clock-counterwise
  data[0].rotation = rotation;
  data[1].rotation = rotation;

  if (jj.config.highlightClearLabels) {
    data[1].text = jjStudent.group[groupNr].highlight.label.labels;
  }

  Plotly.animate( jj.config.idHtml, {
    data: data,
    layout: layout
  }, {
    transition: {
      duration: duration,
      easing: 'cubic-in-out'
    },
    frame: {
      duration: duration
    }
  });
}

jj.addLegendItems = function() {

  let idLegend = document.getElementById(jj.config.idLegendHtml);

  if (idLegend) {
    console.log('build legend');
    for ( let g = 0; g < jjStudent.group.length; g++) {

      let group = jjStudent.group[g];
      let legendItem = document.createElement("div");
      legendItem.style.display = 'flex'; // set to flex to have both child divs on one row
      legendItem.style.marginTop = '2px';
      legendItem.style.cursor = 'pointer';
      legendItem.onclick = function() { jj.highlightGroup( g); };

      // little circle 
      let circleItem = document.createElement("div"),
          pixelSize = '12px';
      circleItem.textContent = ' ';
      circleItem.style.borderRadius = '50%';
      circleItem.style.backgroundColor = group.color;
      circleItem.style.width = pixelSize;
      circleItem.style.height = pixelSize; // even this does not guarantees same width & height
      circleItem.style.border = 'solid grey 2px';
      circleItem.style.marginRight = '8px';

      // text item
      let legendText = document.createElement("div");
      legendText.textContent = group.name;
      //legendText.style.color = group.color;
      //legendText.style.fontSize = pixelSize;
      //legendText.style.fontWeight = 'bold';

      idLegend.appendChild( legendItem);
      legendItem.appendChild( circleItem);
      legendItem.appendChild( legendText);
    }
        
  } else {
    console.log('legend tag not found', jj.config.idLegendHtml);
  }
}