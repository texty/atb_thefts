/**
 * Created by yevheniia on 19.03.21.
 */

d3.csv("data/related_prod.csv").then(function(data) {

    data.forEach(function(d){
        d.freq = +d.freq;
        d.sort = +d.sort;
    });

    data = data.sort(function(a, b){ return d3.descending(a.sort - b.sort) });
    
    var choices = [...new Set(data.map(function(d){ return  d.target }))]

    d3.select("#select")
        .selectAll("option")
        .data(choices)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });

    var options = { placeholder: "віскі" };

    NiceSelect.bind(document.getElementById("select"), options);

    const detail_margin = {top: 40, right: 10, bottom: 30, left: 50};
    const detail_xScale = d3.scaleLinear();
    const detail_yScale = d3.scaleBand();

    const barChart = d3.select("#related-prod")
        .append("svg")
        .append("g")
        .attr("transform", "translate(50,30)");


    drawBarChart("віскі");

    d3.select("#select").on("change", function(d){
        let selected = d3.selectAll("#select").node().value;
        drawBarChart(selected);
    });



    function drawBarChart(product){
        var filtered = data.filter(function(d){
                return d.target === product
            });


        var new_width = d3.select("#related-wrapper").node()
                .getBoundingClientRect().width - detail_margin.left - detail_margin.right;


        d3.select("#related-prod").select("svg")
            .attr("width", new_width )
            .attr("height", 40 * filtered.length + 30);

        //Update the scales
        detail_xScale
            .range([0, new_width - detail_margin.left - detail_margin.right])
            .domain([0, d3.max(filtered, function (d) { return d.freq;  })]);

        detail_yScale
            .range([0, 40 * filtered.length])
            .domain(filtered.map(function (d) { return d.detail; }));


        /* барчики */
        var bars = barChart.selectAll(".detail")
            .data(filtered);

        bars.enter().append("rect")
            .attr("class", "detail")
            .merge(bars)
            .attr("y", function (d, i) { return detail_yScale(d.detail) +  detail_yScale.bandwidth()/2; })
            .attr("height", detail_yScale.bandwidth() / 8 )
            .transition().duration(500)
            .attr("x", 0)
            .attr("width", function (d) { return detail_xScale(d.freq);  })
            .attr("fill", svgTextColor);

        bars.exit().remove();


        /* назви */
        var product_name = barChart.selectAll(".bar-label")
            .data(filtered);

        product_name
            .enter()
            .append("text")
            .attr("class", "bar-label")
            .merge(product_name)
            .transition().duration(0)
            .attr("x", function(d) { return  detail_xScale(0); })
            .attr("y", function(d) { return detail_yScale(d.detail)  +  detail_yScale.bandwidth()/3 })
            .attr("fill", svgTextColor)
            .text(function(d){ return d.detail });


        product_name.exit().remove();


        /* кількіть депутатів */
        var frequency= barChart.selectAll(".label2")
            .data(filtered);

        frequency
            .enter()
            .append("text")
            .attr("class", "label2")
            .merge(frequency)
            .transition().duration(0)
            .attr("x", function(d) { return  -40; })
            .attr("y", function(d) { return detail_yScale(d.detail)  +  detail_yScale.bandwidth()/2 })
            .text(function(d){ return d.freq })
            .attr("fill", svgTextColor);

        frequency.exit().remove();
    }


    
    
});

