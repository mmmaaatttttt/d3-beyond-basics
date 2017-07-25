// topojson source: https://gist.githubusercontent.com/jefffriesen/6892860/raw/e1f82336dde8de0539a7bac7b8bc60a23d0ad788/zips_us_topo.json

document.addEventListener('DOMContentLoaded', function() {

  var width = 600;
  var height = 600;
  var svg = d3.select('svg')
                .attr('width', width)
                .attr('height', height);
  var tooltip = d3.select('.tooltip');
  var select = d3.select('select');

  d3.queue()
    .defer(d3.json, "../data/sf_zips_topo.json")
    .defer(d3.csv, '../data/Restaurant_Scores_-_LIVES_Standard.csv', function(d) {
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
    })
    .await(function(err, map, data) {

      data = data.reduce(function(acc, next, i) {
        var last = acc[acc.length - 1];
        if (last && next.inspection.id === last.inspection.id) {
          last.inspection.violations.push(next.inspection.violations[0])
        } else {
          acc.push(next);
        }
        return acc;
      }, []);

      var projection = d3.geoMercator()
                          .scale(2500)
                          .translate([0, height]);

      var path = d3.geoPath().projection(projection);
      var mapData = topojson.feature(map, map.objects.zip_codes_for_the_usa).features;
      mapData.forEach(function(d) {
        var zip = d.properties.zip;
        var inspectionsByZip = data.filter(d => d.zip === zip);
        d.properties.inspectionCount = inspectionsByZip.length;
        d.properties.meanScore = d3.mean(inspectionsByZip, d => d.inspection.score);
        d.properties.medianScore = d3.median(inspectionsByZip, d => d.inspection.score);
        d.properties.riskCounts = inspectionsByZip.reduce(function(acc, next) {
          next.inspection.violations.forEach(function(v) {
            acc[v.riskCategory] = ++acc[v.riskCategory] || 1;
            acc.total++;
          })
          return acc;
        }, {total: 0});
      });

      var colorScale = d3.scaleOrdinal()
        .domain(Object.keys(mapData[0].properties.riskCounts).sort().concat('total'))
        .range(['#000000', '#ffa000', '#ff0000', '#ff0000']);

      var regions = svg.append('g')
        .selectAll("path")
          .data(mapData)
          .enter().append("path")
          .attr("class", 'region')
          .attr("d", path)
          .attr('stroke', 'black')
          .attr('stroke-weight', '2px')
          .on('mousemove', function(d) { 
            tooltip.html(`
              <h4>Zip Code: ${d.properties.zip}</h4>
              <p>Average Inspection Score: ${d3.format(",.2f")(d.properties.meanScore)}</p>
              <h5>Violation Counts:</h5>
              <ul>
                <li>High Risk: ${d3.format(",.0f")(d.properties.riskCounts["High Risk"])}
                <li>Moderate Risk: ${d3.format(",.0f")(d.properties.riskCounts["Moderate Risk"])}
                <li>Low Risk: ${d3.format(",.0f")(d.properties.riskCounts["Low Risk"])}
                <li>Total: ${d3.format(",.0f")(d.properties.riskCounts.total)}
              </ul>
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

      updateFills();

      select.on('change', updateFills);

      function updateFills() {
        var scale = d3.scaleLinear();
        var val = select.property('value');
        regions.transition()
          .duration(1500)
          .ease(d3.easeLinear)
          .attr('fill', d => {
          if (d.properties[val]) {
            scale.domain([0, 50, 70, 85, 90, 100])
                 .range(['#000', '#e61400', '#ffc107', '#cddc39', '#4caf50', '#00ff00']);
            return scale(d.properties[val]);
          } else {
            scale.domain([0, d3.max(mapData, d => d.properties.riskCounts[val])])
                 .range([val === 'total' ? 'green' : "#fff", colorScale(val)])
            return scale(d.properties.riskCounts[val]);
          }
        })
      }

    });

});