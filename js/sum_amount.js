/**
 * Created by yevheniia on 18.03.21.
 */
var sumMargin = {top: 20, right: 30, bottom: 60, left: 80},
    sumWidth = 960,
    sumHeight = 600 + sumMargin.bottom;

var sumSvg =  d3
    .select("#sum_amount")
    .append("svg")
    .attr("width", "100%")
    .attr("viewBox", `0 0 ${sumWidth} ${sumHeight}`);

var sumX = d3.scaleSymlog()
    .rangeRound([sumMargin.left, sumWidth - sumMargin.right]);

var sumY = d3.scaleSymlog()
    .rangeRound([sumHeight - sumMargin.bottom, sumMargin.top]);

var sumColor = d3.scaleSequential(d3.interpolatePlasma)
    .domain([0, 0.3]); // Points per square pixel.

var sumXaxis = sumSvg.append("g")
    .attr("transform", "translate("+ sumMargin.left + ", " + (sumHeight - sumMargin.bottom ) + ")");

sumXaxis
    .append("text")
    .attr("transform", "translate(" + (sumWidth - sumMargin.left - 10) + " ," +  (sumMargin.bottom/1.5) + ")")
    .text("cума, грн")
    .style("text-anchor","end")
;
   
var sumYaxis = sumSvg.append("g")
    .attr("transform", "translate(" + sumMargin.left + ", 0)");


sumYaxis
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - sumMargin.left)
    .attr("x",0 - 10)
    .attr("dy", "1em")
    .style("text-anchor","end")
    .text("кількість, шт.");
    

Promise.all([
    d3.csv("data/sum_amount.csv")
]).then(function(input) {

    input[0].forEach(function(d){
        d.x = +d.x;
        d.y = +d.y;
    });

    const unique = _.uniqWith(input[0], _.isEqual);


    var xMin = d3.min(input[0], function(d) { return d.x });
    var xMax = d3.max(input[0], function(d) { return d.x });
    var yMin = d3.min(input[0], function(d) { return d.y });
    var yMax = d3.max(input[0], function(d) { return d.y });


    sumX.domain([xMin, xMax*2]);

    sumY.domain([yMin, yMax*2]);

    sumXaxis
        .call(d3.axisBottom(sumX)
            .tickFormat(nFormatter, 0)
            .tickValues([100, 1000, 10000, xMax/2, xMax])
        );

    sumYaxis
        .call(d3.axisLeft(sumY)
            .ticks(5)
            .tickFormat(nFormatter, 1)
    );
        

    sumSvg.insert("g", "g")
        .attr("fill", "none")
        .attr("stroke-width", 0.5)
        .attr("stroke-linejoin", "round")
        .selectAll("path")
        .data(d3.contourDensity()
            .x(function(d) { return sumX(d.x); })
            .y(function(d) { return sumY(d.y); })
            .size([sumWidth, sumHeight])
            .bandwidth(15)
            .thresholds(100)
            .cellSize(5)
            (input[0]))
        .enter().append("path")
        .attr("class", "heat-map")
        .attr("fill", function(d) { return sumColor(+d.value); })
        .attr("d", d3.geoPath())
        .attr("opacity", 1);


    sumSvg.selectAll("text.cat.white")
        .data(unique)
        .enter()
        .append("text")
        .attr('class', "cat white")
        .attr("x", function(d) { return sumX(d.x) + 5})
        .attr("y", function(d) { return sumY(d.y)})
        .style("fill", "white")
        .style("font-size", "13px")
        .text(function(d){ return d.name });

    // sumSvg.selectAll("text.cat.black")
    //     .data(unique)
    //     .enter()
    //     .append("text")
    //     .attr('class', "cat black")
    //     .attr("x", function(d) { return sumX(d.x) + 5})
    //     .attr("y", function(d) { return sumY(d.y)})
    //     .style("font-size", "14px")
    //     .style("fill", "black")
    //     .text(function(d){ return d.name });

    sumSvg.selectAll("circle")
        .data(unique)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return sumX(d.x)})
        .attr("cy", function(d) { return sumY(d.y)})
        .attr("r", 2)
        .attr("fill", "white");




});
