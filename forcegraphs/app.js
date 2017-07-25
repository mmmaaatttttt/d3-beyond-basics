document.addEventListener('DOMContentLoaded', function() {

  var width = 600;
  var height = 600;
  var svg = d3.select('svg')
                .attr('width', width)
                .attr('height', height);
  var tooltip = d3.select('.tooltip');

  d3.csv('../data/Restaurant_Scores_-_LIVES_Standard.csv', function(d) {
    if (d.inspection_score === "") return;
    var newObj = {
      id: d.business_id,
      address: d.business_address,
      lat: d.business_latitude,
      long: d.business_longitude,
      zip: d.business_postal_code,
      name: d.business_name,
      inspection: {
        id: d.inspection_id,
        date: new Date(d.inspection_date),
        score: +d.inspection_score,
        type: d.inspection_type,
        violations: []
      }
    }
    if (d.violation_id) {
      newObj.inspection.violations.push({
        id: d.violation_id,
        description: d.violation_description,
        riskCategory: d.risk_category
      })
    }
    return newObj;
  }, function(data) { 

    data = data.reduce(function(acc, next, i) {
      var last = acc[acc.length - 1];
      if (last && next.inspection.id === last.inspection.id) {
        last.inspection.violations.push(next.inspection.violations[0])
      } else {
        acc.push(next);
      }
      return acc;
    }, [])

    var multipleViolations = data.filter(d => d.inspection.violations.length > 1);
  
    var nodes = multipleViolations.reduce(function(acc, next) {
      next.inspection.violations.forEach(function(violation) {
        if (!acc.find(v => v.description === violation.description)) {
          acc.push({
            description: violation.description,
            riskCategory: violation.riskCategory,
            count: data.reduce(function(acc, next) {
              return acc + next.inspection.violations.filter(v => v.description === violation.description).length
            }, 0)
          });
        }
      })
      return acc;
    }, []);

    var links = nodes.reduce(function(linksArr, node, i) {
      // get the source
      var source = node.description;
      nodes.slice(i + 1).forEach(function(otherNode) {
        // get the target
        var target = otherNode.description;
        var link = {source: source, target: target, weight: 0};
        // calculate the weight.
        // every time the source and target appear in the same inspection,
        // increment the weight by one.
        multipleViolations.forEach(function(d) {
          var violations = d.inspection.violations;
          var sourceObj = violations.find(v => v.description === source);
          var targetObj = violations.find(v => v.description === target);
          if (sourceObj && targetObj) link.weight++;
        });
        if (link.weight > 0) linksArr.push(link);
      });
      return linksArr;
    }, []);

    var risks = nodes.map(n => n.riskCategory).filter((r, i, arr) => arr.indexOf(r) === i);
    var colorScale = d3.scaleOrdinal()
                        .domain(risks.sort())
                        .range(['#000000', '#ffa000', '#ff0000']);
    var radiusScale = d3.scaleLinear()
                        .domain(d3.extent(nodes, n => n.count))
                        .range([5, 30])

    // GENERATE FORCE GRAPH

    var simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(d => d.description))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      // .force("circle", d3.forceCollide(20).strength(0.2).iterations(10))

    var link = svg.append("g")
        .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter().append("line")
        .attr("stroke", "#ccc")
        .attr("stroke-width", d => d.weight / 5);
        // .attr("stroke-width", 1);

    var node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .enter().append("circle")
        // .attr("r", 5 )
        .attr("r", d => radiusScale(d.count) )
        .attr('fill', d => colorScale(d.riskCategory))
        .attr('stroke', "#607d8b")
        .attr('stroke-weight', 3)
        .on('mousemove', function(d) { 
          tooltip.html(`
            <h4>${d.riskCategory}</h4>
            <p>${d.description}</p>
            <p>Number of violations: ${d3.format(",.0f")(d.count)}</p>
          `);
          var w = tooltip.node().getBoundingClientRect().width;
          tooltip
              .style('opacity', 1)
              .style('left', d3.event.pageX - w / 2 + 'px')
              .style('top', d3.event.pageY + 10 + 'px')
        })
        .on('mouseout', function() {
          tooltip.style('opacity', 0);
        })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    simulation
      .nodes(nodes)
      .on("tick", ticked);

    simulation.force("link")
      .links(links);

    function ticked() {
      link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      node
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    }

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

  });

});
