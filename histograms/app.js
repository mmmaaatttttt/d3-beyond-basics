document.addEventListener('DOMContentLoaded', function() {

  var width = 800;
  var height = 450;
  var svg = d3.select('svg')
                .attr('width', width)
                .attr('height', height);
  var padding = 20;

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

    // group inspections together
    var idObj = data.reduce(function(acc, next) {
      var id = next.inspection.id;
      if (acc[id]) acc[id].inspection.violations.push(next.inspection.violations[0]);
      else acc[id] = next;
      return acc;
    }, {});

    data = Object.values(idObj);

    var xScale = d3.scaleLinear()
                   .domain([0, 100])
                   .rangeRound([padding, width - padding]);

    var bins = d3.histogram()
                  .domain(xScale.domain())
                  .value(d => d.inspection.score - 1)
                  (data);

    var yScale = d3.scaleLinear()
                   .domain([0, d3.max(bins, d => d.length)])
                   .range([height - padding, padding]);

    // based on https://www.sfdph.org/dph/EH/Food/Score/
    var colorScale = d3.scaleThreshold()
                       .domain([71, 86, 91, 100])
                       .range(['#e61400', '#ffc107', '#cddc39', '#4caf50']);

    var bars = svg.selectAll('.bar')
      .data(bins)
      .enter()
      .append('g')
        .classed('bar', true);

    bars.append('rect')
        .attr('width', d => xScale(d.x1) - xScale(d.x0) - 1)
        .attr('x', (d, i) => xScale(d.x0))
        .attr('y', d => yScale(d.length))
        .attr('height', d => height - padding - yScale(d.length))
        .attr('fill', d => colorScale(d.x1));

    bars.append('text')
        .attr('x', d => (xScale(d.x1) + xScale(d.x0)) / 2 )
        .attr('y', d => yScale(d.length) - 2 )
        .text(d => d.length ? d3.format(',.0f')(d.length) : "")

    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${height - padding})`)
        .call(d3.axisBottom(xScale).ticks(20))

    svg.append('text')
       .attr('class', 'title')
       .attr('x', width / 2 )
       .attr('y', 30)
       .text('SF Restaurant Health Inspection Scores')

  });

});