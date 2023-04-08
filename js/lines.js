class Line {
    /**
     * Class constructor with initial configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data, _data2, _selectBreed, _selectAge, _selectTime, _dispatcher) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 1300,
            containerHeight: 250,
            margin: { top: 15, right: 60, bottom: 30, left: 100 },
            tooltipPadding: 15,
            colors: ["#F9F3B9", "#E5CD6C", "#ba7f4e", "#8C6239", "#2F1313"],
        }
        this.data = _data;
        this.data2 = _data2;
        this.selectBreed = _selectBreed;
        this.selectAge = _selectAge;
        this.selectTime = _selectTime;
        this.dispatcher = _dispatcher;
        this.initVis();
    }
    initVis() {
        let vis = this;

        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            .append("g")
            .attr("transform",
                "translate(" + vis.config.margin.left + "," + vis.config.margin.top + ")");

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.keys = ["intake", "outcome"]

        vis.colorScale = d3.scaleOrdinal()
            .domain(vis.keys)
            .range([vis.config.colors[1], vis.config.colors[2]])

        vis.xScale = d3.scaleTime()
            .range([0, vis.width]);


        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.yScaleR = d3.scaleLinear()
            .range([vis.height, 0]);

        // Initialize axes
        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(12)
            .tickFormat(d => {
                return formatDate(new Date(d))
            });


        vis.yAxis = d3.axisLeft(vis.yScale)
            .tickPadding(10);

        vis.yAxisR = d3.axisRight(vis.yScaleR)
            .tickPadding(10)
            .tickFormat(d3.format("d"));


        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // SVG Group containing the actual chart; D3 margin convention
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // Append empty x-axis group and move it to the bottom of the chart
        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.height})`);

        // Append y-axis group
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');

        vis.yAxisGR = vis.chart.append('g')
            .attr('class', 'axis y-axis')
            .attr("transform", "translate(" + vis.width + " ,+15)");


        // Append both axis titles
        vis.chart.append('text')
            .attr('class', 'axis-title')
            .attr('y', 5)
            .attr('x', vis.width + 150)
            .attr('dy', '.71em')
            .style('text-anchor', 'end')
            .text('Net Number');

        vis.chart.append('text')
            .attr('class', 'axis-title')
            .attr('x', 0)
            .attr('y', 5)
            .attr('dy', '.71em')
            .text('Number of Intake/outcome');

    }

    updateVis() {
        let vis = this;

        selectTime = [new Date("2013-05-01"), new Date("2018-10-01")]

        vis.filtereddata = vis.data;
        vis.filtereddata2 = vis.data2;
        if (vis.selectBreed != null) {
            vis.filtereddata = vis.data.filter(d => d.breed == vis.selectBreed.breed);
            vis.filtereddata2 = vis.filtereddata2.filter(d => d.breed == vis.selectBreed.breed);

        }

        if (vis.selectAge != null) {
            vis.filtereddata = vis.filtereddata.filter(d => d.age_group == vis.selectAge.age);
            vis.filtereddata2 = vis.filtereddata2.filter(d => d.age_group == vis.selectAge.age);
        }

        const tmpTimeFormat = d3.timeParse("%Y-%m-%dT%H:%M:%S.%L");
        const tmpTimeFormat2 = d3.timeParse("%Y-%m-%dT%H:%M:%S");

        const getMinDate = function (d1, d2) {
            if (d1 > d2) return d2
            else return d1
        }
        const getMaxDate = function (d1, d2) {
            if (d1 < d2) return d2
            else return d1
        }

        if (vis.selectTime != null && vis.selectTime[0] != vis.selectTime[1]) {
            let minDate = getMinDate(vis.selectTime[0], vis.selectTime[1])
            let maxDate = getMaxDate(vis.selectTime[0], vis.selectTime[1])
            vis.filtereddata = vis.filtereddata.filter(d => {
                let currDate = tmpTimeFormat(d.datetime)
                return currDate >= minDate && currDate <= maxDate
            });
            vis.filtereddata2 = vis.filtereddata2.filter(d => {
                let currDate = tmpTimeFormat2(d.datetime)
                return currDate >= minDate && currDate <= maxDate
            });
        }

        // console.log(vis.filtereddata2[0].datetime)
        // console.log(tmpTimeFormat2(vis.filtereddata2[0].datetime))

        // get intake data group by date
        let groupByDate = d3.group(vis.filtereddata, g => {
            return g.datetime.substring(0, 7);
        });

        vis.intakeArr = Array.from(groupByDate.entries());
        vis.intakeArr.forEach(e => {
            e[1] = e[1].length
        })

        // get outcome data group by date
        let groupByDate2 = d3.group(this.filtereddata2, g => {
            return g.datetime.substring(0, 7);
        });

        vis.outcomeArr = Array.from(groupByDate2.entries());
        vis.outcomeArr.forEach(e => {
            e[1] = e[1].length
        })

        // get net data
        let groupByDate3 = new Map()
        vis.intakeArr.forEach(e => {
            if (groupByDate2.get(e[0]) != null) {
                let cnt = 0;
                for (let k in groupByDate2.get(e[0])) {
                    cnt++;
                }
                let num = e[1] - cnt;
                groupByDate3.set(e[0], [num, e[1], cnt])
            } else {
                groupByDate3.set(e[0], [e[1], e[1], 0])
            }
        })

        vis.outcomeArr.forEach(e => {
            if (groupByDate3.get(e[0]) == null) {
                groupByDate3.set(e[0], [-e[1], 0, e[1]])
            }
        })


        // const parseTime = d3.timeParse("%Y-%m-%d")
        const parseTime = d3.timeParse("%Y-%m")
        vis.netArr = Array.from(groupByDate3.entries());
        let groupData = [];
        vis.netArr.forEach(e => {
            let intakeNum = e[1][1]
            let outcomeNum = e[1][2]
            groupData.push({
                "key": e[0],
                "values": [{ "year": e[0], "name": "outcome", "val": outcomeNum },
                { "year": e[0], "name": "intake", "val": intakeNum }]
            })
        })

        vis.sortedNet = []
        vis.netArr.forEach(e => {
            vis.sortedNet.push({ "year": parseTime(e[0]), "value": e[1] })
        })

        vis.sortedNet.sort(function (a, b) { return a.year - b.year })



        vis.intakeArr.sort(function (a, b) {
            return parseTime(a[0]) - parseTime(b[0])
        }
        )
        vis.outcomeArr.sort(function (a, b) {
            return parseTime(a[0]) - parseTime(b[0])
        }
        )

        vis.mygroup = [0, 1]
        vis.stackedData = d3.stack()
            .keys(vis.mygroup)
            .value(function (d, key) {
                return d.values[key].val
            })(groupData)

        // sort stacked data to get correct stacked line chart
        this.stackedData.forEach(arr => {
            arr.sort(function (a, b) {
                return parseTime(a.data.key) - parseTime(b.data.key)
            })
        })

        // console.log(vis.sortedNet)

        if (vis.selectTime != null && vis.selectTime[0] != vis.selectTime[1]) {
            let minDate = getMinDate(vis.selectTime[0], vis.selectTime[1])
            let maxDate = getMaxDate(vis.selectTime[0], vis.selectTime[1])
            vis.xScale.domain([minDate, maxDate]);
        } else {
            vis.xScale.domain([new Date('2013-10-01'), new Date('2018-05-01')]);
        }
        vis.yScale.domain([0, 4800]);
        vis.yScaleR.domain([-1500, 1500]);

        vis.renderVis();
    }


    renderVis() {
        let vis = this;
        const parseTime = d3.timeParse("%Y-%m")

        vis.chart
            .selectAll("stackedline")
            .data(vis.stackedData)
            .join("path")
            .attr("class", "stackedline")
            .style("fill", function (d) { name = vis.keys[d.key]; return vis.colorScale(name); })
            // .join(
            //     (enter) => enter.append("path").attr("class", "stackedline")
            //     .style("fill", function (d) { name = vis.keys[d.key]; return vis.colorScale(name); }),
            //     (update) => update,
            //     (exit) => exit.remove()
            // )
            .attr("d", d3.area()
                .x(function (d, i) {
                    return vis.xScale(parseTime(d.data.key));
                })
                .y0(function (d) {
                    return vis.yScale(d[0]);
                })
                .y1(function (d) { return vis.yScale(d[1]); })
            );

        //Add net line
        // let line = vis.chart.selectAll("line")
        //     .datum(vis.sortedNet)
        //     .join("path")
        //     .attr("fill", "none")
        //     .attr("stroke", "black")
        //     .attr("stroke-width", 3)
        //     .attr("d", d3.line()
        //         .x(function(d) {
        //             return vis.xScale(d.year) })
        //         .y(function(d) { return vis.yScaleR(d.value[0]) })
        //     )

        vis.chart
            .selectAll("path")
            .datum(vis.sortedNet)
            .join(
                (enter) =>
                    enter
                        .append("path")
                        .attr("class", "line")
                        .attr("fill", "none")
                        .attr("stroke", "black")
                        .attr("stroke-width", 3),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr("d", d3.line()
                .x(function (d) {
                    return vis.xScale(d.year)
                })
                .y(function (d) { return vis.yScaleR(d.value[0]) })
            );


        let circles = vis.chart.selectAll('.point')
            .data(vis.sortedNet)
            .join('circle')
            .attr('class', 'point')
            .attr('r', 4)
            .attr('cy', d => vis.yScaleR(d.value[0]))
            .attr('cx', d => vis.xScale(d.year))

        // add tooltips
        circles.on("mouseover", (event, d) => {
            d3.select("#tooltip")
                .style("display", "block")
                .style("left", (event.pageX + vis.config.tooltipPadding) + "px")
                .style("top", (event.pageY + vis.config.tooltipPadding) + "px")
                .html(`
					<div class="tooltip-title">Time: ${formatDate(d.year)}</div>
					<div>
						<i>Type: General</i>
					</div>
					<ul>
						<li>Intake Num: ${d.value[1]}</li>
						<li>Outcome Num: ${d.value[2]}</li>
						<li>Net Num: ${d.value[0]}</li>
					</ul>
				`);
        })
            .on("mouseleave", () => {
                d3.select("#tooltip").style("display", "none");
            });

        // add legend
        let size = 20
        vis.chart.selectAll("myarea")
            .data(vis.mygroup)
            .join("rect")
            .attr("x", vis.width - 150)
            .attr("y", function (d, i) { return 10 + i * (size + 5) }) // 100 is where the first dot appears. 25 is the distance between dots
            .attr("width", size)
            .attr("height", size)
            .style("fill", function (d) {
                name = vis.keys[d]; return vis.colorScale(name);
            })

        // Add name for each legend
        vis.chart.selectAll("mylabels")
            .data(vis.mygroup)
            .join("text")
            .attr("x", vis.width - size * 1.2 - 100)
            .attr("y", function (d, i) { return 10 + i * (size + 5) + (size / 2) + 5 })
            .text(function (d) {
                if (d == 0) {
                    return "Intake"
                } else {
                    return "Outcome"
                }
            })

        // Add label for net line
        // vis.chart.append("text")
        //     .attr("transform", "translate(" + (vis.width - 50) + "," +
        //         (vis.yScaleR(vis.sortedNet[vis.sortedNet.length - 1].value[0]) + 15) + ")")
        //     .attr("class", "net-label")
        //     .attr("dy", ".35em")
        //     .attr("text-anchor", "start")
        //     .style("fill", "black")
        //     .text("Net");


        vis.xAxisG
            .call(vis.xAxis)
            .call(g => g.select('.lines').remove());

        vis.yAxisG
            .call(vis.yAxis)
            .call(g => g.select('.domain').remove())

        vis.yAxisGR
            .call(vis.yAxisR)
            .call(g => g.select('.domain').remove())
    }
}

function formatDate(date) {
    let d = new Date(date),
        month = "" + (d.getMonth() + 1),
        day = "" + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month].join("-");
}

