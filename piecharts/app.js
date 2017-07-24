// types of violations
// fractions of restaurants

document.addEventListener('DOMContentLoaded', function() {

  var width = 800;
  var height = 450;
  var svg = d3.select('svg')
                .attr('width', width)
                .attr('height', height);
  var tooltip = d3.select('.tooltip')

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
    }, []);

    // CHART 1: rating pie chart
    var ratings = [{
      rating: 'poor',
      count: 0
    }, {
      rating: 'needsImprovement',
      count: 0
    }, {
      rating: 'adequate',
      count: 0
    }, {
      rating: 'good',
      count: 0
    }]
    
    ratings = data.reduce(function(acc, next) {
      var idx;
      var score = next.inspection.score;
      var idx = (score > 70) + (score > 85) + (score > 90);
      acc[idx].count++;
      return acc;
    }, ratings);

    var colorScale = d3.scaleOrdinal()
                   .domain(ratings.map(r => r.rating))
                   .range(['#e61400', '#ffc107', '#cddc39', '#4caf50'])

    var arcs = d3.pie()
      .value(d => d.count)
      .sortValues((d1, d2) => ratings.indexOf(d2) - ratings.indexOf(d1))
      (ratings);

    var path = d3.arc()
                 .outerRadius(width / 5)
                 .innerRadius(0)

    svg.append('g')
        .attr('transform', `translate(${width / 5 + 10}, ${height / 2})`)
      .selectAll('.arc')
      .data(arcs)
      .enter()
      .append('path')
        .classed('arc', true)
        .attr('d', path)
        .attr('fill', d => colorScale(d.data.rating))
        .attr('stroke', '#fff')
        .on('mousemove', function(d) {
          var formattedKey = d.data.rating[0].toUpperCase() + d.data.rating.slice(1).replace(/[A-Z]/g, c => ` ${c}`);
          tooltip
              .text(`${formattedKey} - ${d3.format(",.0f")(d.data.count)} inspections`);
          updateTooltipLocation();
        })
        .on('mouseout', function(d) {
          tooltip
              .style('opacity', 0)
        });

    // CHART 2: violations chart
    var violationSummary = data
      .filter(d => d.inspection.violations.length > 0)
      .reduce(function(acc, next) {
        next.inspection.violations.forEach(function(v) {
          var id = v.id.split("_")[2];
          if (acc[id]) acc[id].count++;
          else {
            acc[id] = {
              id: id,
              description: v.description,
              riskCategory: v.riskCategory,
              count: 1
            }
          }
        })
        return acc;
      }, {});

    var violationArr = Object.keys(violationSummary).map(d => violationSummary[d]);

    var riskArr = violationArr.reduce(function(acc, next) {
      acc.forEach(function(r) {
        if (r.risk === next.riskCategory) {
          r.count += next.count;
        }
      })
      return acc;
    }, [{
      risk: "High Risk",
      count: 0
    }, {
      risk: "Moderate Risk",
      count: 0
    }, {
      risk: "Low Risk",
      count: 0
    }]);

    var arcs2 = d3.pie()
      .value(d => d.count)
      .sort(function(d1, d2) { 
        if (d1.riskCategory === d2.riskCategory) return d2.count - d1.count;
        var d2idx = riskArr.findIndex(r => r.risk === d2.riskCategory);
        var d1idx = riskArr.findIndex(r => r.risk === d1.riskCategory);
        return d2idx - d1idx;
      })
      (violationArr);

    var totalViolations = riskArr.reduce((acc, next) => acc + next.count, 0);

    var path2 = d3.arc()
                  .outerRadius(width / 5)
                  .innerRadius(0)

    var colorScale2 = d3.scaleOrdinal()
                   .domain(riskArr.map(el => el.risk ))
                   .range(['#000000', '#ff0000', '#ffa000']);

    svg.append('g')
        .attr('transform', `translate(${4 * width / 5 - 10}, ${height / 2})`)
      .selectAll('.arc2')
      .data(arcs2)
      .enter()
      .append('path')
        .classed('arc2', true)
        .attr('d', path2)
        .attr('fill', d => colorScale2(d.data.riskCategory))
        .attr('stroke', '#fff')
        .on('mousemove', function(d) { 
          tooltip.html(`
            <h4>${d.data.riskCategory}</h4>
            <p>${d.data.description}</p>
            <p>Number of violations: ${d3.format(",.0f")(d.data.count)}</p>
            <p>Percentage of violations: ${d3.format(".2%")(d.data.count / totalViolations)}</p>
          `);
          updateTooltipLocation();
        })
        .on('mouseout', function() {
          tooltip.style('opacity', 0);
        })

  });

  function updateTooltipLocation() {
    var w = tooltip.node().getBoundingClientRect().width;
    tooltip
        .style('opacity', 1)
        .style('left', d3.event.pageX - w / 2 + 'px')
        .style('top', d3.event.pageY + 10 + 'px')
  }

});
