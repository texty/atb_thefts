/**
 * Created by yevheniia on 18.03.21.
 */
const green = "#00ff00";
const svgTextColor = "#F0F0F0";

function nFormatter(num, digits) {
    var si = [
        { value: 1, symbol: "" },
        { value: 1E3, symbol: "т. " },
        { value: 1E6, symbol: "млн " }

    ];
    var rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    var i;
    for (i = si.length - 1; i > 0; i--) {
        if (num >= si[i].value) {
            break;
        }
    }
    return (num / si[i].value).toFixed(0).replace(rx, "$1") + si[i].symbol;
}



var margin = {top: 20, right: 30, bottom: 100, left: 60},
    width = 960,
    height = 650;

var svg =  d3
    .select("#chart-1")
    .append("svg")
    //            .attr("width", width + margin.left + margin.right)
    //            .attr("height", height + margin.top + margin.bottom);
    .attr("width", "100%")
    .attr("viewBox", `0 0 ${width} ${height}`);



var x = d3.scaleLog()
    .domain([1, 210])
    .rangeRound([margin.left, width - margin.right]);

var y = d3.scaleLog()
    .domain([1, 30])
    .rangeRound([height - margin.bottom, margin.top]);

var color = d3.scaleSequential(d3.interpolatePlasma)
    .domain([0, 0.04]); // Points per square pixel.

let x_axis = svg.append("g")
    .attr("transform", "translate(0," + (height-margin.bottom/1.2) + ")")
    .call(d3.axisBottom(x)
        .tickFormat(function(d){  return  d  })
        .tickValues([1,2,3,4,5,10,20,50,100,200]));


x_axis
    .append("text")
    .attr("transform", "translate(" + (width - 10) + " ," +  (margin.bottom/1.5) + ")")
    .style("text-anchor","end")
    .text("кількість товарів у крадіжці");





let y_axis = svg.append("g")
    .attr("transform", "translate(" + margin.left + ",0)")
    .call(d3.axisLeft(y)
        .ticks(5)
        .tickFormat(function(d){ return d })
    );

y_axis
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x",0 - 10)
    .attr("dy", "1em")
    .style("text-anchor","end")
    .text("різноманітність товарів");


var _margin = {top: 10, right: 10, bottom: 10, left: 20},
    // _width = 300 - _margin.left - _margin.right,

    _width = d3.select("#cloud").node().getBoundingClientRect().width - _margin.left - _margin.right,

    _height = d3.select("#chart-1>svg").node().getBoundingClientRect().height + 10;



var _svg = d3.select("#cloud").append("svg")
//.attr("width", "100%")
//            .attr("height", "100%")
//            .attr("viewBox", `0 0 ${_width} ${_height}`)
    .attr("width", _width + _margin.left + _margin.right)
    .attr("height", _height )
    .append("g")
    .attr("transform",
        "translate(" + _margin.left + "," + _margin.top + ")");


Promise.all([
    d3.csv("data/heat_data.csv"),
    d3.csv("data/word_cloud.csv")
]).then(function(input) {

    input[0].forEach(function(d){
        d.x = +d.x;
        d.y = +d.y;
        d.value = +d.value;
    });

    input[1].forEach(function(d){
        d.x = +d.x;
        d.y = +d.y;
        d.freq = +d.freq;
        d.thefts_amount = +d.thefts_amount;
    });




    svg.insert("g", "g")
    //                .attr("transform", "translate(" +10 + "," + 0 + ")")
        .attr("fill", "none")
        .attr("stroke-width", 0.5)
        .attr("stroke-linejoin", "round")
        .selectAll("path")
        .data(d3.contourDensity()
            .x(function(d) { return x(d.x); })
            .y(function(d) { return y(d.y); })
            .size([width, height])
            .bandwidth(10)
            .thresholds(800)
            .cellSize(10)
            // .bandwidth(15)
            (input[0]))
        .enter().append("path")
        .attr("class", "heat-map")
        .attr("fill", function(d) { return color(+d.value); })
        .attr("d", d3.geoPath())
        .on("mousemove", function(d){
            let xInvert = Math.round(x.invert(d3.mouse(this)[0]));
            let yInvert = Math.round(y.invert(d3.mouse(this)[1]));

//                    let filtered = input[1].filter(function(k){
//                        return k.x >= xInvert - 1 && k.x <= xInvert + 1 &&
//                                k.y >= yInvert - 1 && k.y <= yInvert + 1
//                    });

            let filtered = input[1].filter(function(k){
                return k.x === xInvert && k.y === yInvert
            });

            d3.select("#heat-note").text(xInvert + "/"+ yInvert +" | крадіжок: "+ filtered[0].thefts_amount );
            drawWordCloud(filtered)


            // var products = d3.nest()
            //     .key(function(d) { return d["товар"]; })
            //     .rollup(function(v) {
            //         return v.length })
            //     .entries(filtered);

            // var thefts = d3.nest()
            //     .key(function(d) { return d["id"]; })
            //     .rollup(function(v) {
            //         return v.length })
            //     .entries(filtered)
            //     .length;


        });


    var poly = [{"x":5, "y":0.8 },
        {"x":72,"y":0.8},
        {"x":72,"y":2.5},
        {"x":5,"y":2.5}];

    svg.selectAll("polygon.poly")
        .data([poly])
        .enter()
        .append("polygon")
        .attr("class", "poly")
        .attr("points",function(d) { return d.map(function(d) { return [x(d.x),y(d.y)].join(",");}).join(" "); })
        .attr("stroke", green)
        .attr("fill", "none")
        .style("pointer-events", "none");

    svg.append("text")
        .attr("x", x(72))
        .attr("y", y(2.6))
        .attr("class", "chart-label")
        .text("виносили конкретні товари")
        .style("pointer-events", "none");




    var poly2 = [{"x":4, "y":3},
        {"x":4,"y":12},
        {"x":30,"y":12},
        {"x":30,"y":3}];

    svg.selectAll("polygon.poly2")
        .data([poly2])
        .enter()
        .append("polygon")
        .attr("class", "poly2")
        .attr("points",function(d) { return d.map(function(d) { return [x(d.x),y(d.y)].join(",");}).join(" "); })
        .attr("stroke", green)
        .attr("fill", "none")
        .style("pointer-events", "none");

    svg.append("text")
        .attr("x", x(30))
        .attr("y", y(12.4))
        .attr("class", "chart-label")
        .text("як за покупками")
        .style("pointer-events", "none");



    var poly3 = [
        {"x":31, "y":5},
        {"x":31, "y":10},
        {"x":31,"y":28},
        {"x":215,"y":28},
        {"x":215,"y":5}];

    svg.selectAll("polygon.poly3")
        .data([poly3])
        .enter()
        .append("polygon")
        .attr("class", "poly3")
        .attr("points",function(d) { return d.map(function(d) { return [x(d.x),y(d.y)].join(",");}).join(" "); })
        .attr("stroke", green)
        .attr("fill", "none")
        .style("pointer-events", "none");

    svg.append("text")
        .attr("x", x(76))
        .attr("y", y(28.4))
        .attr("class", "chart-label")
        .text("великі пограбування")
        .style("pointer-events", "none");;

    let defaultCloud = input[1].filter(function(k){
        return k.x === 1 && k.y === 1
    });

    d3.select("#heat-note").text(1 + "/"+ 1 +" | крадіжок: "+ defaultCloud[0].thefts_amount );
    drawWordCloud(defaultCloud)


});





function drawWordCloud(df){
    _svg.selectAll("*").remove();


    _height = d3.select("#chart-1>svg").node().getBoundingClientRect().height;
    _width = d3.select("#cloud").node().getBoundingClientRect().width - _margin.left;

    d3.select("#cloud > svg")
        .attr("height", _height)
        .attr("height", _height);

    let font_size = d3.scaleLinear()
        .domain(d3.extent(df, function(d){ return d.freq }))
        .range([8, 35]);



    var layout = d3.layout.cloud()
        .size([_width, _height])
        .words(df.map(function(d) { return {text: d["товар"], size:d.freq}; }))
        .padding(15)        //space between words
        .rotate(function() { return ~~(Math.random() * 2) * 90; })
        .fontSize(function(d) {
            return font_size(d.size)
        })
        .on("end", draw);

    layout.start();

    function draw(words) {
        _svg
            .append("g")
            .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
            .selectAll("text")
            .data(words)
            .enter().append("text")
            .style("font-size", function(d) { return d.size + "px"; })
            .style("fill", green) //#eae326
            //                                .style("fill", function(d) {return _color(Math.sqrt(d.size))})
            .attr("text-anchor", "middle")
            .style("font-family", "Roboto Mono, mono")
            .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) { return d.text; });
    }
}

