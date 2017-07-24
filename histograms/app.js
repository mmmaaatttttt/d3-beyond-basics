document.addEventListener('DOMContentLoaded', function() {

  d3.json('https://data.sfgov.org/resource/sipz-fjte.json', function(data) {
    console.log(data);
  });

});