/**
 * Created by yevheniia on 19.03.21.
 */
d3.csv("data/portrait.csv").then(function(data) {


    const nested = d3.nest()
        .key(function(d){ return d.category })
        .entries(data);

    var charts = d3.select("#portrait")
        .selectAll("div.file")
        .data(nested)
        .enter()
        .append("div");


    charts.append("h4")
       .text(function(d){
             return d.key + ", %"
         })
        .style("color", "#00ff00");


    charts.append("svg")
        .attr("class", "file")
        .datum(function(d) { return d.values; })
        .call(letdraw());
});



var letdraw = function () {
    var margin = {top: 20, bottom: 30, left:30, right:10};

    function chart(selection) {

        selection.each(function (df) {

            df.forEach(function(d){
                d.freq = +d.freq;
                d.percent = +d.percent;
            });

           df = _.sortBy(df, "freq").reverse();


            var width = d3.select(this).classed("file") ? 200 : d3.select("#alko_types").node().getBoundingClientRect().width - margin.left - margin.right;



            // var width = 200;
            var height = df.length * 50 ;

            var div = d3.select(this)
                .attr('width', width)
                .attr('height', height - margin.top)
                .append("g")
                .attr("transform", "translate(0,10)");


            const xScale = d3.scaleLinear()
                .range([0, width])
                .domain([0, 100]);

            const yScale = d3.scaleBand()
                .range([0, height - 20])
                .domain(df.map(function (d) { return d.label; }));

            div.selectAll("rect.white")
                .data(df)
                .enter()
                .append("rect")
                .attr("class", "white")
                .attr("y", function (d, i) { return yScale(d.label) +  yScale.bandwidth()/2; })
                .attr("height", yScale.bandwidth() / 8 )
                .transition().duration(500)
                .attr("x", xScale(0))
                .attr("width", function (d) { return xScale(d.percent);  })
                .attr("fill", "white");

            div.selectAll("rect.grey")
                .data(df)
                .enter()
                .append("rect")
                .attr("class", "grey")
                .attr("y", function (d, i) { return yScale(d.label) +  yScale.bandwidth()/2; })
                .attr("height", yScale.bandwidth() / 8 )
                .transition().duration(500)
                .attr("x", xScale(0))
                .attr("width", xScale(100) )
                .attr("fill", "white")
                .style("opacity", 0.1);


            div.selectAll("text")
                .data(df)
                .enter()
                .append("text")
                .attr("y", function (d, i) { return yScale(d.label) +  yScale.bandwidth()/2 - 10; })
                .attr("x", 0)
                .text(function(d){ return d.label })


        })
    }

    return chart;
};
