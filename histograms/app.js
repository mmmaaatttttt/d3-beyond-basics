document.addEventListener('DOMContentLoaded', function() {

  var width = 800;
  var height = 450;
  var svg = d3.select('svg')
                .attr('width', width)
                .attr('height', height);
  var padding = 20;

  d3.csv('../data/Restaurant_Scores_-_LIVES_Standard.csv', function(d) {
    if (d.inspection_score === "") return;

    return {
      id: d.business_id,
      address: d.business_address,
      lat: d.business_latitude,
      long: d.business_longitude,
      zip: d.business_postal_code,
      inspection: {
        id: d.inspection_id,
        date: new Date(d.inspection_date),
        score: +d.inspection_score,
        type: d.inspection_type,
        violations: [{
          id: d.violation_id,
          description: d.violation_description,
          riskCategory: d.risk_category
        }]
      }
    }
  }, function(data) {

    // group inspections together
    data = data.reduce(function(acc, next, i) {
      var last = acc[acc.length - 1];
      if (last && next.inspection.id === last.inspection.id) {
        last.inspection.violations.push(next.inspection.violations[0])
      } else {
        acc.push(next);
      }
      return acc;
    }, []);

    var xScale = d3.scaleLinear()
                   .domain([0, 100])
                   .rangeRound([padding, width - padding]);

    var bins = d3.histogram()
                  .domain(xScale.domain())
                  (data.map(function(d) {
                    return d.inspection.score;
                  }));

    var yScale = d3.scaleLinear()
                   .domain([0, d3.max(bins, function(d) {
                     return d.length;
                   })])
                   .range([height - padding, padding]);

    var colorScale = d3.scaleThreshold()
                       .domain([80, 90, 100])
                       .range(['#e61400', '#ffeb3b', '#4caf50'])

    var bars = svg.selectAll('.bar')
      .data(bins)
      .enter()
      .append('g')
        .classed('bar', true);

    bars.append('rect')
        .attr('width', function(d) {
          return xScale(d.x1) - xScale(d.x0) - 1;
        })
        .attr('x', function(d, i) {
          return xScale(d.x0);
        })
        .attr('y', function(d) { return yScale(d.length); })
        .attr('height', function(d) { return height - padding - yScale(d.length); })
        .attr('fill', function(d) {
          return colorScale(d.x0);
        });

    bars.append('text')
        .attr('x', function(d) {
          return (xScale(d.x1) + xScale(d.x0)) / 2;
        })
        .attr('y', function(d) {
          return yScale(d.length) - 2;
        })
        .text(function(d) {
          return d.length ? d3.format(',.0f')(d.length) : "";
        })

    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', 'translate(0, ' + (height - padding) + ')')
        .call(d3.axisBottom(xScale).ticks(20))

    svg.append('text')
       .attr('class', 'title')
       .attr('x', width / 2 )
       .attr('y', 30)
       .text('SF Restaurant Health Inspection Scores')

  });

});