const getJSON = async url => {
  const response = await fetch(url);
  return response.json(); // get JSON from the response 
}

function degrees2radians(deg) {
  return rad = Math.PI * 2 / 360 * deg;
}

function trunc2 (num) {
  return Math.trunc(num*100)/100;
}

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}
  
function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function getJson4PlotlySunburst( idHtml, jsonUrl) {
  getJSON(jsonUrl)
  .then( data => sdiiPlotlySunburstOnion( idHtml, data));
}

function addCountryLegend( idHtml, countries, baseColor, highlightColor) {

  const legendDiv = document.createElement("div");
  
  legendDiv.style.width = '800px';  // magic number, also used to set the svg dimensions.
  legendDiv.style.marginTop = '6px';
  
  legendDiv.style.display = 'flex';
  legendDiv.style.flexFlow = 'row wrap';
  legendDiv.style.justifyContent = 'space-around';
  
  // in case one want custom css, you can do via this class
  legendDiv.classList.add('sd-sunburst-onion-legend');
  
  document.getElementById(idHtml).appendChild(legendDiv);

  for (let i= 0; i < countries.length; i++) {
    let legendCountry = document.createElement("div");
    legendCountry.textContent = countries[i].country.replace('<br>', '/');
    
    legendCountry.style.backgroundColor = 'steelblue'; // to do, hardcode & review all colors in json, regroup
    legendCountry.style.color = 'white'; // to do, see above
    legendCountry.style.fontSize = '18px';
    legendCountry.style.fontWeight = 'bold';

    // in case the countries flow in a second row, add some margin to have vertical space between them
    legendCountry.style.marginTop = '2px';
    legendCountry.style.marginBottom = '2px';

    legendCountry.style.padding= '1em 2em';
    legendCountry.classList.add('sd-sunburst-onion-legend-item');

    legendCountry.onclick = function() { highlightCountry( idHtml, i, countries.length, baseColor, highlightColor); };
    legendCountry.style.cursor = 'zoom-in';

    legendDiv.appendChild(legendCountry);
    
  }

};

function highlightCountry( idHtml, countryIndex, NrOfCountries, baseColor, highlightColor) {
  // thanks: https://stackoverflow.com/questions/64016308/dynamically-toggle-visibility-of-shapes-in-plotly-js

  let colorShapes = {};

  for (let i = 0; i < NrOfCountries; i++) {
    colorShapes["shapes[" + i + "].line.color"] = baseColor;
  }

  colorShapes["shapes[" + countryIndex + "].line.color"] = highlightColor;
  
  const next = (countryIndex+1)%NrOfCountries;
  colorShapes["shapes[" + next + "].line.color"] = highlightColor;

  //console.log('**', colorShapes);
  
  // line.width is also an option : see all parameters: https://plotly.com/javascript/reference/layout/shapes/
  Plotly.relayout( idHtml, colorShapes);
}

function sdiiPlotlySunburstOnion( idHtml, sd) {
  //console.log(idHtml, sd);  

  let ids = [],
    labels = [],
    parents = [],
    values = [],
    colors = [];

  let sectors = sd.countries.length,
      sectorValue = trunc2( 100 / sectors);

  for ( let i = 0; i < sectors; i++) {

    let co = sd.countries[i];

    // inner circle : all countries
    parents.push("");
    let id = 'id-' + co.short;
    ids.push(id);
    labels.push(co.country);
    values.push(sectorValue);
    colors.push( sd.countryColor || "#eeebe3"); // white-ish

    // second circle : all lpe payrolls
    parents.push(id);
    id = id + '-lpe';
    ids.push(id);
    labels.push(co.lpe);
    values.push(sectorValue);
    colors.push( sd.lpeColor || "khaki");

    // 3th circle: middleware
    let middleware = co.connect_ring,
        midVals = [];
    for ( let j = 0; j < middleware.length; j++) {
      ids.push(id + '-m-' + j);
      let middlew = middleware[j];
      labels.push(middlew.label);
      parents.push(id);
      midVals[j] = trunc2(sectorValue * middlew.pct / 100);
      values.push( midVals[j]);

      let col = middlew.color;
      if (!col) {
        col = sd.colors[middlew.label];
      }
      colors.push(col);
    }

    // 4th circle: hr - customer facing
    let hrs = co.hr_ring;
    for ( let j = 0; j < hrs.length; j++) {
      ids.push(id + '-h-' + j);
      let hr = hrs[j];
      labels.push(hr.label);
      parents.push(id + '-m-' + hr.parentIndex);
      // assume 100 when pct not present
      // calculate the value : pct from the middleware part.
      values.push( trunc2( midVals[hr.parentIndex] * ( hr.pct || 100) / 100));

      let col = hr.color;
      if (!col) {
        //console.log('sd', sd.colors, hr.label);
        col = sd.colors[hr.label];
      }
      colors.push(col);
    }
  }

  let data = [{
    type: "sunburst",
    ids: ids,
    labels: labels,
    parents: parents,
    values: values,
    leaf: {opacity: sd.leaf_opacity || 1},
    sort: false,
    branchvalues: 'total',
    textinfo: 'label',
    marker: {
      line: { 
        width: sd.line_width_separator || 6 // can also be an array, in case variable width would become nice
      },
      colors: colors
    },
  }];

  let layout = {
    paper_bgcolor: sd.background_color || "lightgrey",
    margin: {l: 0, r: 0, b: 0, t: 0},
    width: 800,
    height: 800,
    hovermode: false,
    annotations: [],
    shapes: []
  };
  
  for (let i=0; i < sd.arrows.length; i++) {
    layout.annotations[i] = arrowAnnotation( sd.arrows[i]);
  }

  const config = {
    toImageButtonOptions: {
      format: 'svg', // one of png, svg, jpeg, webp
      filename: 'sd_' + sd.customer + '_pay_landscape',
      height: 800,
      width: 800,
      scale: 1 // Multiply title/legend/axis/canvas sizes by this factor
    }
  };

  // a line to separate the countries
  const mid = 0.5;
  for (let i=0; i < sectors; i++) {
    let line = {
        type: 'path',
        line: {
          color: sd.countrySeparatorColor || 'white',
          width: sd.country_width_separator || 8
        }
      };
    
    // svg path : move to the middle (plus 1/8 R extra), draw a line to : mid + r (=0.5) * cos Angle  : the same for y, but sinus.
    // plotly - shapes - path does not support (yet) the Arc command, and relative commands
    let radians = (2*Math.PI / sectors) * i;
    line.path = [
      'M', mid + (mid/8 * Math.cos(radians)), mid + (mid/8 * Math.sin(radians)), 
      'L', mid + (mid   * Math.cos(radians)), mid + (mid   * Math.sin(radians))
    ].join(' ');
    
    layout.shapes[i] = line;
  }

  // plot Plotly
  Plotly.newPlot( idHtml, data, layout, config)
    // disable the specific sunburst click event on all intermediate nodes to redraw the sunburst from that node onwards
    // since the annotations have absolute values and hence do not move with any interaction.
    .then( gd => {
      gd.on('plotly_sunburstclick', () => false)
    });
  
  // add html country legend
  addCountryLegend(idHtml, sd.countries, sd.countrySeparatorColor || 'white', sd.countrySeparatorHighlightColor || 'red');

  // add a CSS rule to the body of the page to force the cursor on hover to the default arrow, instead of the hand plotly came up with.
  const css = document.createElement("style");
  css.innerHTML = ".sunburstlayer .slice.cursor-pointer{cursor: default!important;}";
  document.body.appendChild(css);
}

function arrowAnnotation( {startRadiusPct, startRadiusDegrees, endRadiusPct, endRadiusDegrees, doubleHead, color, opacity}) {

    if (! endRadiusDegrees) {
      endRadiusDegrees = startRadiusDegrees;
    }

    if (! endRadiusPct) {
      endRadiusPct = startRadiusPct;
    }

    let r1 = startRadiusPct / 100 / 2, // divide by 2, since graph takes 2R = 100% * 2
        rad1 = degrees2radians(startRadiusDegrees),
        x1 = (r1 * Math.cos( rad1)) + .5, // + .5 since (0,0) is bottom-left for paper coordinates, and maxes at (1,1) and sunburst goes to middle, so (.5, .5)
        y1 = (r1 * Math.sin( rad)) + .5;
    
    let r2 = endRadiusPct / 100 / 2,
        rad2 = degrees2radians(endRadiusDegrees),
        x2 = (r2 * Math.cos( rad2)) + .5,
        y2 = (r2 * Math.sin( rad2)) + .5;

  return {
    x: x2, // end point x
    y: y2, // end point y
    xref: 'paper', 
    yref: 'paper',
    text: '', // no text, so also no hover ..
    hovertext: '', // is only appearing when hovering over text, not over arrow, unfortunately
    showarrow: true,
    arrowhead: 4, // 1-8 : nr 4 gives best visual result, given the width of the arrow (and relative size of the head)
    arrowside: ( doubleHead ? 'start+end' : 'end'),
    arrowcolor: color,
    arrowwidth: 20,
    arrowsize: 0.3, // 0.3 is smallest number accepted (relative, referencing width)
    axref: 'paper',
    ayref: 'paper',
    ax: x1, // start point x
    ay: y1, // start point y
    opacity: opacity
  }
    
  // ps: the resulting svg will contain data-index="x", where x is the position in the annotations array
  /*
    css to handle the arrows
      g.annotation {
        opacity: 0.5;
      }
  */
}