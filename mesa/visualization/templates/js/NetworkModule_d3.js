const NetworkModule = function (svg_width, svg_height) {
  // Create the svg element:
  const svg = d3.create("svg");
  svg
    .attr("class", "NetworkModule_d3")
    .attr("width", svg_width)
    .attr("height", svg_height)
    .style("border", "1px dotted");

  // Append svg to #elements:
  document.getElementById("elements").appendChild(svg.node());

  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const g = svg
    .append("g")
    .classed("network_root", true);

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "d3tooltip")
    .style("opacity", 0);

  const zoom = d3.zoom()
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

  svg.call(zoom);

  svg.call(
    zoom.transform,
    d3.zoomIdentity.translate(width / 2, height / 2)
  );

  for (const [suffix, marker_size] of [["", 3], ["large", 5], ["xl", 6]]) {
    for (const start of [false, true]) {
      const name = (start ? "start" : "end") + suffix;
      svg
        .append("svg:defs")
        .selectAll("marker")
        .data([name])
        .enter()
        .append("svg:marker")
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", 0.5)
        .attr("orient", (start ? "auto-start-reverse" : "auto"))
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");

      d3.select(`#${name}`)
        .attr("markerWidth", marker_size)
        .attr("markerHeight", marker_size);
    }
  }

  const links = g.append("g").attr("class", "links");

  const nodes = g.append("g").attr("class", "nodes");

  this.render = (data) => {
    const graph = JSON.parse(JSON.stringify(data));

    const simulation = d3
      .forceSimulation()
      .nodes(graph.nodes)
      .force("charge", d3.forceManyBody().strength(-80).distanceMin(2))
      .force("link", d3.forceLink(graph.edges))
      .force("center", d3.forceCenter())
      .stop();

    for (
      let i = 0,
        n = Math.ceil(
          Math.log(simulation.alphaMin()) /
            Math.log(1 - simulation.alphaDecay())
        );
      i < n;
      ++i
    ) {
      simulation.tick();
    }

    links
	.selectAll("line")
	.data(graph.edges)
	.enter()
	.append("line")
	.on("mouseover", function (event, d) {
	tooltip.transition().duration(200).style("opacity", 0.9);
	tooltip
	  .html(d.tooltip)
	  .style("left", event.pageX + "px")
	  .style("top", event.pageY + "px");
	})
	.on("mouseout", function () {
	tooltip.transition().duration(500).style("opacity", 0);
	});

    links
      .selectAll("line")
      .data(graph.edges)
      .attr("x1", function (d) {
        return d.source.x;
      })
      .attr("y1", function (d) {
        return d.source.y;
      })
      .attr("x2", function (d) {
        return d.target.x;
      })
      .attr("y2", function (d) {
        return d.target.y;
      })
      .attr("stroke-width", function (d) {
        return d.width;
      })
      .attr("stroke", function (d) {
        return d.color;
      })
      .attr("marker-end", function (d) {
        if (d.directed === "forwards" || d.directed === "both")
          return "url(#end" + (d.marker_size ?? "") + ")";
        else
          return "";
      })
      .attr("marker-start", function (d) {
        if (d.directed === "backwards" || d.directed === "both")
          return "url(#start" + (d.marker_size ?? "") + ")";
        else
          return "";
      });

    links.selectAll("line").data(graph.edges).exit().remove();

    const node_gs = nodes
      .selectAll("g")
      .data(graph.nodes)
      .enter()
      .append("g")
      .on("mouseover", function (event, d) {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(d.tooltip)
          .style("left", event.pageX + "px")
          .style("top", event.pageY + "px");
      })
      .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0);
      });

    node_gs
      .append("circle");

    node_gs
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em");

    nodes
      .selectAll("g")
      .data(graph.nodes)
      .attr("transform", function(d) {
        return `translate(${d.x}, ${d.y})`;
      });

    nodes
      .selectAll("circle")
      .data(graph.nodes)
      .attr("r", function (d) {
        return d.size;
      })
      .attr("fill", function (d) {
        return d.color;
      });

    nodes
      .selectAll("text")
      .data(graph.nodes)
      .attr("font-size", "1px")
      .text(function (d) {
        return d.text;
      })
      .each(function (d) {
        const bbox = this.getBBox();
        const pbbox = this.parentNode.getBBox();
        d.font_scale = Math.min(pbbox.width / bbox.width, pbbox.height / bbox.height);
      })
      .attr("font-size", function (d) {
        return `${d.font_scale}px`;
      });

    nodes.selectAll("g").data(graph.nodes).exit().remove();
  };

  this.reset = () => {};
};
