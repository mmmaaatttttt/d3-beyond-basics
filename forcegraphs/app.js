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

    var idObj = data.reduce(function(acc, next) {
      var id = next.inspection.id;
      if (acc[id]) acc[id].inspection.violations.push(next.inspection.violations[0]);
      else acc[id] = next;
      return acc;
    }, {});

    data = Object.values(idObj);

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
    var weightScale = d3.scaleLinear()
                        .domain(d3.extent(links, l => l.weight))
                        .range([1, 15]);

    // GENERATE FORCE GRAPH

    var simulation = d3.forceSimulation()
      .nodes(nodes)
      .force("link", d3.forceLink(links).id(d => d.description))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on('tick', ticked)
      // .force("circle", d3.forceCollide(20).strength(0.2).iterations(10))

    var link = svg.append("g")
        .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter().append("line")
        .attr("stroke", "#ccc")
        .attr("stroke-width", d => weightScale(d.weight));

    var node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .enter().append("circle")
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

        debugger
    function ticked() {
      link
          .attr("x1", d => d.source.x )
          .attr("y1", d => d.source.y )
          .attr("x2", d => d.target.x )
          .attr("y2", d => d.target.y );

      node
          .attr("cx", d => d.x )
          .attr("cy", d => d.y );
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
