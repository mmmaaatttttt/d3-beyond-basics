# D3: Beyond the Basics

### Introduction

Have you built a simple scatterplot or bar chart using D3, but struggled to move beyond the basics? In these examples, we'll showcase many of the helpers that D3 provides to more easily create data visualizations. Included are examples histograms, pie charts, force-directed graphs, and maps. 

### Prerequisites

It's assumed you have a basic knowledge of how D3 works, including how it joins elements to data on the page, and the general update pattern. If this sounds like a bunch of jargon, I highly recommend reading Mike Bostock's article [Thinking with Joins](https://bost.ocks.org/mike/join/). He built D3, so he probably knows what he's talking about.

Also, for convenience the examples use a few ES2015 features, including arrow functions, template strings, and array methods like `find`. If you aren't familiar with some of these JavaScript features, [here's](https://www.rithmschool.com/courses/advanced-javascript-part-2) some material that may be helpful.

These notes are meant to give a high-level overview of what's covered in the ForwardJS workshop.

### The Data Set

All of these examples make use of restaurant health inspection data in San Francisco, from January of 2014 through January of 2017. The data is provided by SFgov.org. [Here's](https://data.sfgov.org/Health-and-Social-Services/Restaurant-Scores-LIVES-Standard/pyih-qa8i) a link to the data set.

### Parsing data

From the website you can download the data in a couple of different file formats. Regardless of the format you use, though, you'll likely need to massage the data a bit before you can get your visualization working.

Fortunately, D3 provides a few methods to help us with this. For example, if you're importing a `csv`, the `d3.csv` method allows you to pass in two callbacks: one for formatting your data, and one to run once your data has been loaded and run through your formatter. However, it should be noted that your formatter really just serves as a way to map and filter over the rows in the CSV - for more complex types of sanitation, you may need to do some additional work once the data has been loaded.

### Histograms

One of the helpers we'll look at is `d3.histogram`. Histograms provide a way to visualize the distribution of data by looking how often values fall within certain ranges. Creating these ranges manually can be tedius, but D3 provides a few methods for our convenience (for more details, check out the [docs](https://github.com/d3/d3-array/blob/master/README.md#histograms)).

`d3.histogram` itself returns a function to us, which accepts an array of data and automatically does the bucketing. It will calculate several intermediate values in our data set, and determine how many of our data points fall within those values.

Before passing in our data, we can also set the domain for our histogram, and we can use the `.value` method to specify what value in our data set we're trying to plot.

Check out the solutions branch to see an example of a histogram built with some of D3's helper functions. (Note that as is often the case when building a histogram, it's also helpful to create a scale and an axis for readability. You can earn more about D3's approach scales [here](https://github.com/d3/d3-scale), and about axes [here](https://github.com/d3/d3-axis).)

#### Exercises

1. Create a histogram to visualize the distribution of inspection scores for San Francisco restaurants.
2. Create a histogram to visualize the distribution of violations per inspection for San Francisco restaurants.

### Pie Charts

Similar to `d3.histogram`, there's a `d3.pie` helper which can format your data in a way that's easier to visualize as a pie chart. (Details [here](https://github.com/d3/d3-shape/blob/master/README.md#pies).) Typically it's used in conjunction with `d3.arc`, which takes JavaScript objects and generates valid arc commands for the `d` attribute of an SVG path element.

Similar to the histogram generator, with `d3.pie` you can specify a value from within your dataset you want to graph, and you can also sort your data for the ordering of the wedges in the graph (by default, the ordering will be from largest to smallest).

The trickiest part of drawing these graphs has less to do with D3, and more to do with understanding your own dataset and SVG. You'll likely need to aggregate your data somehow before passing it into the pie aggregator.

### Exercises

1. Create a pie chart to show the fractions of restaurants that were rated good (>90), acceptable (>85), needs improvement (>70), or poor.
2. Create a pie chart to show the fractions of violations recorded across all of the inspections.
BONUS: add tooltips to your charts!

### Maps

When drawing a visualization involving a map with D3, you'll likely also need to use [topojson](https://github.com/topojson/topojson). If you read about TopoJSON you'll likely see it compared to GeoJSON (e.g. [here](https://en.wikipedia.org/wiki/GeoJSON#TopoJSON)); for now, all that's important to know is that both of these encode information about geography in a JSON format.

(Aside: another helpful tool when dealing with TopoJSON is [Mapshaper](https://github.com/mbloch/mapshaper).)

When working with geography in D3, you'll likely need to make use of the geograph path generator, `d3.geoPath` ([source](https://github.com/d3/d3-geo/blob/master/README.md#paths)). It converts from GeoJSON into valid path commands for SVG.

Depending on how you want the map to look, you may also want to project your geographic data using one of D3's built-in projectors.

As before, one of the hardest things when building these visualizations has less to do with D3, and more to do with massaging data and working with SVG path elements!

### Exercises

1. Create a heat map to visualize some restaurant data in San Francisco by zip code.
2. Add a `select` element so that users can update the heat map by choosing different data to visualize.
BONUS: add tooltips!
BONUS: add transitions!

### Force-Directed Graphs

A force-directed graph is a dynamic way to visualize relationships between entities (or nodes) in a network. One of the simplest working examples of a D3 force-directed graph can be found [here](https://bl.ocks.org/mbostock/4062045).

Force-directed graphs simulate physics: nodes can be pulled closer or pushed farther apart, depending on the forces at work on them. Once again, D3 has a few methods to help us get up and running.

To create a graph, we can use `d3.forceSimulation()` ([source](https://github.com/d3/d3-force)). There are three key ingredients for the simulation: nodes, links, and forces.

Common forces include center, links, many-body, and collision (see the docs for more). These govern the physics of the simulation. Nodes are the elements in the network, and links are the links between them. D3 expects links to have a certain structure: minimally they should have a source and a target.

In order to animate the graphs, we'll need to listen for ticks of the simulation and update properties of the nodes and links accordingly. Note that the simulation adds properties to the nodes and links to keep track of their positions and velocities.

### Exercise

1. Create a force-directed graph to track the relationships between violations as a network. 
