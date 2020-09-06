var width = 360,
    height = 300;

document.getElementById('map').setAttribute( "style", "width:" + width + "px");

/*
   made the r attribute of the island circles relative on the height (3%)
	 set scale manually for the moment when resizing.
	 eventually change the em size of the tooltip text via the css
*/
	
var projection = d3.geo.azimuthalEqualArea()
    .rotate([-20, 0])
    .translate([width / 2, height / 2])
    .scale(225)
    .precision(.1);

var path = d3.geo.path().
    projection(projection);

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height)
    ;

svg.append("filter")
    .attr("id", "glow")
    .append("feGaussianBlur")
    .attr("stdDeviation", 4);

svg.append("path")
    .datum(d3.geo.graticule().extent([[-40, -40], [80 + 1e-6, 40 + 1e-6]]).step([10, 10]))
    .attr("class", "graticule")
    .attr("d", path);

var tooltip = d3.select("#map").append("div").attr("class", "tooltip");

queue()
    .defer(d3.json, "./assets/africa.json?2")
    .defer(d3.tsv, "./assets/world-country-names.tsv")
    .defer(d3.csv, "./assets/supported-countries.csv?1")
    .await(function(error, africa, names, supported) {
      var idByName = {},
          nameById = {},
          supportedById = {};
      names.forEach(function(d) { nameById[idByName[d.name] = +d.id] = d.name; });
      supported.forEach(function(d) {
        var id = idByName[d.country];
        if (id) supportedById[id] = d;
      });

      // Land "glow" effect.
      svg.insert("path", ".graticule")
          .datum({type: "MultiPolygon", coordinates: topojson.mesh(africa, africa.objects.countries, function(a, b) { return a === b; }).coordinates.map(function(d) {
            return [d];
          })})
          .attr("class", "land-glow")
          .attr("d", path);

      // Find islands (assume all geometries are [Multi]Polygons).
      var useCount = africa.arcs.map(function() { return 0; });
      // Populate the useCount array (number of references to each arc).
      africa.objects.countries.geometries.forEach(function(d) {
        if (d.type === "Polygon") polygonIslandCount(d.arcs);
        else d.arcs.forEach(polygonIslandCount);
      });
      // Use the number of references to determine which geometries have no shared arcs.
      var islands = topojson.feature(africa, {type: "GeometryCollection", geometries: africa.objects.countries.geometries.filter(function(d) {
        return d.type === "Polygon" ? polygonIsland(d.arcs) : d.arcs.every(polygonIsland);
      })}).features;

      var island = svg.selectAll(".island")
          .data(islands)
        .enter().insert("circle", ".graticule")
          .attr("class", "island")
          .classed("supported", function(d) { return supportedById.hasOwnProperty(d.id); })
          .attr("r", height * 3 / 100)
          .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
          .on("mouseenter", mouseenter)
          .on("mouseleave", mouseleave)
          .on("touchstart", function(d) {
            d3.event.stopPropagation();
            mouseenter.call(this, d);
          });

      var countries = topojson.feature(africa, africa.objects.countries).features;
      var country = svg.selectAll(".country")
          .data(countries)
          .enter().insert("path", ".graticule")
          .attr("class", "country")
          .classed("supported", function(d) { return supportedById.hasOwnProperty(d.id); })
          .on("mouseenter", mouseenter)
          .on("mouseleave", mouseleave)
          .on("touchstart", function(d) {
            d3.event.stopPropagation();
            mouseenter.call(this, d);
          })
          .attr("d", path);
      svg.on("touchstart", mouseleave);

      svg.insert("path", ".graticule")
          .datum(topojson.mesh(africa, africa.objects.countries))
          .attr("class", "border")
          .attr("d", path);

      // Keep a tally of the number of references to each arc.
      function polygonIslandCount(polygon) {
        for (var i = 0, n = polygon.length; i < n; ++i) {
          var ring = polygon[i];
          for (var j = 0, m = ring.length; j < m; ++j) {
            var arc = ring[j];
            ++useCount[arc < 0 ? ~arc : arc];
          }
        }
      }
      // A polygon is an island if its rings have no shared arcs.
      function polygonIsland(d) { return d.every(ringIsland); }
      // A ring is an island if it has no shared arcs.
      function ringIsland(d) { return d.length === 1 && useCount[d[0]] === 1; }

      // Display tooltip and highlight of relevant country.
      function mouseenter(d) {
        country.classed("hover", false);
        d3.select(this).classed("hover", true);
        var centroid = path.centroid(d),
            supported = supportedById[d.id];
        
        if (centroid[0] > width / 2 ) tooltip.style("right", width - centroid[0] + "px").style("left", null);
        else tooltip.style("left", centroid[0]  + "px").style("right", null);
        if (centroid[1] > height / 2 ) tooltip.style("bottom", height - centroid[1] + "px").style("top", null);
        else tooltip.style("top", centroid[1]  + "px").style("bottom", null);

        tooltip.style("display", "block").selectAll("*").remove();
        
        tooltip.append("h3").text(nameById[d.id]);
        //if (supported) tooltip.append("p").text(supported.tooltip);
		
      }
      // Turn off tooltip and highlight.
      function mouseleave(d) {
        country.classed("hover", false);
        tooltip.style("display", null);
      }
    });
