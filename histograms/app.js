document.addEventListener('DOMContentLoaded', function() {

  var width = 800;
  var height = 450;
  var svg = d3.select('svg')
                .attr('width', width)
                .attr('height', height);

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

    var bins = d3.histogram()(data.map(function(d) {
      return d.inspection.score;
    }));

    var barPadding = 10;
    var barWidth = width / bins.length - barPadding;
    var yScale = d3.scaleLinear()
                   .domain([0, d3.max(bins, function(d) {
                     return d.length;
                   })])
                   .range([height, 0]);

    svg
      .selectAll('rect')
      .data(bins)
      .enter()
      .append('rect')
        .attr('width', barWidth)
        .attr('x', function(d, i) {
          return (barWidth + barPadding ) * i
        })
        .attr('y', function(d) { return yScale(d.length); })
        .attr('height', function(d) { return height - yScale(d.length); })


    // 1. axes / labels 
    // 2. bins by month
    
  });

});