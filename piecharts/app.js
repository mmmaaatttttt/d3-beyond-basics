// types of violations
// fractions of restaurants

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
      name: d.business_name,
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

    data = data.reduce(function(acc, next, i) {
      var last = acc[acc.length - 1];
      if (last && next.inspection.id === last.inspection.id) {
        last.inspection.violations.push(next.inspection.violations[0])
      } else {
        acc.push(next);
      }
      return acc;
    }, []);

    var ratingSummary = data.reduce(function(acc, next) {
      var key;
      var score = next.inspection.score
      switch (true) {
        case (score > 90):
          key = 'good';
          break;
        case (score > 85):
          key = 'adequate';
          break;
        case (score > 70):
          key = 'needsImprovement';
          break;
        default:
          key = 'poor'
          break;
      }
      acc[key]++;
      return acc
    }, {
      poor: 0,
      needsImprovement: 0,
      adequate: 0,
      good: 0
    })

    var violationSummary = data.reduce(function(acc, next) {
      next.inspection.violations.forEach(function(v) {
        var id = v.id.split("_")[2];
        if (id && acc[id]) acc[id].count++;
        if (id && !acc[id]) {
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

    debugger;
  });

});