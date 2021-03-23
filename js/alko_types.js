/**
 * Created by yevheniia on 21.03.21.
 */
d3.csv("data/alko_types.csv").then(function(data) {


    var keys = data.columns.slice(1);

    keys.sort(function(a, b){
        return data[0][b] - data[0][a]
    });


    var svg = d3.select("#alko_types");

    var margin = {top: 35, left: 35, bottom: 0, right: 15},
        width = window.innerWidth - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;


    svg
        .attr("width", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`);

    var y = d3.scaleBand()
        .range([margin.top, height - margin.bottom])
        .padding(0.1)
        .paddingOuter(0.2)
        .paddingInner(0.2);

    var x = d3.scaleLinear()
        .range([margin.left, width - margin.right]);

    var yAxis = svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .attr("class", "y-axis")

    var xAxis = svg.append("g")
        .attr("transform", `translate(0,${margin.top})`)
        .attr("class", "x-axis")


    var colorRange = ["#211D7D", '#0d0887', '#46039f', '#7201a8', '#9c179e', '#bd3786', '#d8576b', '#ed7953', '#fb9f3a', '#fdca26', '#f0f921'].reverse();

    var z = d3.scaleOrdinal()
        .range(colorRange)
        .domain(keys);

    data.forEach(function(d) {
        d.total = d3.sum(keys, k => +d[k])
        return d
    });

    x.domain([0, 100]).nice();

    svg.selectAll(".x-axis").transition().duration(500)
        .call(d3.axisTop(x).ticks(null, "s"));


    y.domain(data.map(function(d){ return d.category}));

    var group = svg.selectAll("g.layer")
        .data(d3.stack().keys(keys)(data), function(d){
            return d.key
        });



    group.exit().remove();

    group.enter().insert("g", ".y-axis").append("g")
        .classed("layer", true)
        .attr("data", function(d){
            return d.key
        })
        .attr("fill", function(d, i){ return z(i)});


    var bars = svg.selectAll("g.layer")
            .selectAll("rect")
            .data(d => d, e => e.data.category);

    bars.exit().remove();

    bars.enter().append("rect")
        .attr("height", y.bandwidth())
        .attr("class", function(d) {
            let label = d3.select(this.parentNode).attr("data");
            if(+d.data[label] < 10) {
                return "tip";
            } else {
                return null;
            }
        })
        .attr("data-tippy-content", function(d) {
            let label = d3.select(this.parentNode).attr("data");
            if(+d.data[label] < 10) {
                return label;
            } else {
                return null;
            }
        })
        .merge(bars)
        .transition().duration(500)
        .attr("y", function(d){ return y(d.data.category)})
        .attr("x", function(d){ return x(d[0])})
        .attr("width",function(d){ return x(d[1]) - x(d[0])});



    d3.selectAll("g.layer").each(function(d){
        let label = d3.select(this).attr("data");

        if(+d[0].data[label] > 10){
            d3.select(this)
                .append("text")
                // .attr("class", "cat")
                .attr("x", function() { return x(d[0][0])})
                // .attr("x", function() { return x(d[0][1]) - ((x(d[0][1]) - x(d[0][0])) )})
                .attr("y", function() { return 60 })

                .text(label);
        }

    });

    tippy('.tip', {
        hideOnClick: false,
        delay: 50,
        arrow: true,
        inertia: true,
        size: 'big',
        duration: 500,
        allowHTML: true,
        trigger: "mouseenter",
        interactive: true,
        onShow(tip) {
            tip.setContent(tip.reference.getAttribute('data-tippy-content'))
        }
    });




});
