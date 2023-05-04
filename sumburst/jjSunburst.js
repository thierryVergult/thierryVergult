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

jj.redistributeLabels = function ( student, lanes, laneStart, laneEnd) {

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
    lab[ind] = student.labels[ind];
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


jj.highlightGroup = function ( student, groupNr, duration = 2000) {

  // eventually add code to go back to the base situation, with no highlighting at all

  student.data[0].values = student.group[groupNr].highlight.values;
  student.data[1].values = student.group[groupNr].highlight.label.values;

  let rotation = student.group[groupNr].highlight.label.rotation;
  rotation = - rotation; // since rotation parameter works clock-counterwise
  student.data[0].rotation = rotation;
  student.data[1].rotation = rotation;

  if (jj.config.highlightClearLabels) {
    student.data[1].text = student.group[groupNr].highlight.label.labels;
  }

  Plotly.animate( jj.config.idHtml, {
    data: student.data,
    layout: jj.layout
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


jj.addLegendItems = function(student) {

  let idLegend = document.getElementById(jj.config.idLegendHtml);

  if (idLegend) {
    console.log('build legend');
    for ( let g = 0; g < student.group.length; g++) {

      let group = student.group[g];
      let legendItem = document.createElement("div");
      legendItem.style.display = 'flex'; // set to flex to have both child divs on one row
      legendItem.style.marginTop = '2px';
      legendItem.style.cursor = 'pointer';
      legendItem.onclick = function() { jj.highlightGroup( student, g); };

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


jj.plotSunburst = function( studentData) {
  
  jj.layout = {
    margin: {l: 0, r: 0, b: 0, t: 0},
    width: 800,
    height: 800,
    hovermode: false,
    annotations: [{
      font: { size: jj.config.bullEyeFontSize || 24},
      showarrow: false,
      text: jj.config.bullEyeText,
    }]
  }

  let plotlyData = jj.prepareData( studentData);
  /*
    lineWidths[3] = 5;
    lineColors[3] = 'lightgrey';
  */

      
  Plotly.newPlot( jj.config.idHtml, plotlyData, jj.layout);
      
  jj.addLegendItems( studentData);
}

jj.prepareData = function( student) {

  // define all arrays to feed both sunbursts, and initialize with a first item for the root node
  student.ids = ['root'],
  student.parents = [''],
  student.values = [0], // root value will be overwritten by sum of level 1 = nr of competence lanes
  student.colors = [''],
  student.labels = [],
  student.lineColors = [''],
  student.lineWidths = [0],
  student.groups = [-1];  // not used to feed plotly, but to make later processing easier.

  student.competenceLanes = 0;

  let studentGroups = student.group;

  // fill all arrays with g(roup) - c(ompetence) - l(evel) logic.
  for ( let g = 0; g < studentGroups.length; g++) {

    let group = studentGroups[g];

    for ( let c = 0; c < group.competence.length; c++) {

      let comp = group.competence[c];
      student.competenceLanes +=1;

      student.labels.push( comp.name);

      for ( let l = 0; l < comp.level; l++) {

        student.ids.push( 'gcl-' + g + '.' + c + '.' + l);
        student.parents.push( l == 0 ? 'root' : 'gcl-' + g + '.' + c + '.' + (l-1));

        student.values.push(1);

        student.groups.push(g);

        if ( l < comp.level - 1) {
          // default styling
          student.colors.push(group.color);
          student.lineWidths.push( jj.config.defaultLineWidth);
          student.lineColors.push( 'white');

        } else {
          // styling on the edge

          let statusIndex = (comp.statusNr || 1)-1,
              statusStyle = jj.config.status[statusIndex],
              opacityPct = statusStyle.opacityPct || 100,
              opacityHex = Math.trunc((255 * opacityPct / 100)).toString(16);
              linewidth = statusStyle.linewidth || jj.config.defaultLineWidth;
          console.log( statusIndex, statusStyle, opacityPct, opacityHex, linewidth);

          let col = group.color;
          col = jj.colorHex(col) + opacityHex;
          student.colors.push(col);

          student.lineWidths.push(linewidth);

          student.lineColors.push( 'white');
        }
      }

      // fill the sunburst up to the levels of the student
      for ( let l = comp.level; l < student.levels; l++) {

        student.ids.push( 'gcl-' + g + '.' + c + '.' + l);
        student.parents.push( 'gcl-' + g + '.' + c + '.' + (l-1));

        student.colors.push('rgba(0,0,0,0.0)');
        student.lineColors.push( 'lightgrey');
        student.lineWidths.push(1);

        student.values.push(1);

        student.groups.push(g);
      }
    }
  }

    // 2nd pass : get parameters for redistribution / highlight

    for ( let g = 0; g < studentGroups.length; g++) {

      group = studentGroups[g];

      // find start & end index of group in groups array
      let firstCell = student.groups.findIndex( groupNr => groupNr == g),
      lastCell = student.groups.lastIndexOf(g);

      let firstCompNameInGroup = group.competence[0].name, 
          compIndexStart = student.labels.findIndex( compName => compName == firstCompNameInGroup) + 1,  // weird + 1, seems needed in redistributeLabels, so rename variables
          nrOfCompetencesInGroup = group.competence.length,
          compIndexEnd = compIndexStart + nrOfCompetencesInGroup - 1;

      if (jj.config.log) {
        console.log( 'redistributione', student.competenceLanes, compIndexStart, compIndexEnd, 'total cells, cellstart, end', student.groups.length, firstCell, lastCell);
      }

      group.highlight = {};
      group.highlight.label = jj.redistributeLabels( student, student.competenceLanes, compIndexStart, compIndexEnd);
      group.highlight.values = jj.redistribute( student.groups.length, student.competenceLanes, firstCell, lastCell, nrOfCompetencesInGroup);

    }

  //root value becomes the sum of level 1 = nr of competence lines
  student.values[0] = student.competenceLanes;

  if (jj.config.log) {
    console.log( '# competence lanes', student.competenceLanes);
    console.log( 'labels', student.labels);
    console.log( 'ids', student.ids);
    console.log( 'parents', student.parents);
    console.log( 'values', student.values);
    console.log( 'colors', student.colors);
    console.log( 'groups', student.groups);
    console.log( 'jjStudent', student);
  }

  let dataMain = {
    type: "sunburst",
    ids: student.ids,
    parents: student.parents,
    branchvalues: 'total',
    values: student.values,
    sort: false,
    marker: { 
      colors: student.colors,
      line: {
        color: student.lineColors,
        width: student.lineWidths,
    }},
    textinfo: 'none',
    labels: student.values, // whatever array of the correct length
    rotation: 0,
    leaf: { opacity: 1}
  };

  let dataOverlay = {
    // sun burst overlay only for the labels
    // all arrays have n items, an item per competence line.
    type: 'sunburst',
    labels: student.labels,
    parents: Array(student.competenceLanes).fill(''),
    values: Array(student.competenceLanes).fill(1),
    branchvalues: 'total',
    sort: false,
    marker: { 
      colors: Array(student.competenceLanes).fill('rgba(0,0,0,0)'), // hide the sectors by using a color with alpha level 0
      line: { 
        width: 0, // set width to 0 to hide also the lines in between, or set to 4 to make the lanes more distinct
        color: 'lightgrey'
    }}, 
    textinfo: 'text',  // do not use label, but text, to show the labels on the graph, since the labels are used as a key (since no ids), and cannot be animated
    text: [... student.labels],  // shallow copy
    insidetextorientation: 'radial',
    textfont: { size: jj.config.labelFontSize || 20},
    rotation: 0,
    leaf: { opacity: 1}
  };

  let data = [
    dataMain, 
    dataOverlay
  ];

  student.data = data;
  
  return data;

}