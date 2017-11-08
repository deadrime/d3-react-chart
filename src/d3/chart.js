import React from "react";
import { scaleLinear } from "d3-scale";
import { max , min } from "d3-array";
import { select, append, mouse } from 'd3-selection'
import { axisLeft, axisBottom } from 'd3-axis';
import { transition } from 'd3-transition';

import concat from 'lodash/concat';
// import forEach from 'lodash/forEach';
// import sortBy from 'lodash/sortBy';

import { line, area }  from 'd3-shape';

import './style.css'

class CanvasChart extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            node: null,
            currentPrice: 0,
            currentValue: 0,
            tooltipX: -999,
            tooltipY: -999
        }
    }

    getClosest(num, arr) {
        let curr = arr[0];
        let diff = Math.abs (num - curr);
        let id = 0;
        for (let val = 0; val < arr.length; val++) {
            const newdiff = Math.abs (num - arr[val]);
            if (newdiff < diff) {
                diff = newdiff;
                curr = arr[val];
                id = val;
            }
        }
        return id;
    }

    prepareData() {
        this.margins = [10, 16, 10, 16];

        this.w = this.props.width - this.margins[1] - this.margins[3];
        this.h = this.props.height - this.margins[0] - this.margins[2];

        this.sellDataX = this.sellData.map(d => d[0]);
        this.sellDataY = this.sellData.map(d => d[1]);

        this.buyDataX = this.buyData.map(d => d[0]);
        this.buyDataY = this.buyData.map(d => d[1]);

        this.allXdata = concat(this.buyDataX, this.sellDataX);
        this.allYdata = concat(this.buyDataY, this.sellDataY);

        console.log(this.sellDataX);

        this.x = scaleLinear().domain([min(this.allXdata), max(this.allXdata)]).range([0, this.w]);
        this.y = scaleLinear().domain([0, max(this.allYdata)]).range([this.h, 0]);

        this.lineFunc = line()
            .x((d) => this.x(d[0]))
            .y((d) => this.y(d[1]));

        // функция создания области
        this.areaFunc = area()
            .x((d) => this.x(d[0]))
            .y0(this.h)
            .y1((d) => this.y(d[1]));

        this.xAxis = axisBottom().scale(this.x).tickSize(-this.h);
        this.yAxis = axisLeft().scale(this.y).tickSize(-this.w);

    }

    drawChart() {
        const margins = this.margins;
        const sellData = this.sellData;
        const buyData = this.buyData;

        const node = select(this.node)
            .append("g")
                    .attr("transform", "translate(" + margins[3] + "," + margins[0] + ")");

        node.append("g")
            .attr('class', 'x-axis')
            .attr("transform", "translate(0," + this.h + ")")
            .call(this.xAxis)
            .style('shape-rendering', 'crispEdges')
            .selectAll(".tick line").attr("stroke", "lightgrey");

        // надписи и направляющие по oY
        node.append("g")
            .call(this.yAxis)
            .attr('class','y-axis')
            .style('shape-rendering', 'crispEdges')
            .selectAll(".tick:not(:first-of-type) line").attr("stroke", "lightgrey");

        // красная линия
        this.redLine = node.append("path")
            .attr("id", "redline")
            .attr("d", this.lineFunc(sellData))
            .attr("stroke", "red")
            .attr("stroke-width", 1)
            .style("fill", "none");

        // зеленая линия
        this.greenLine = node.append("path")
            .attr("d", this.lineFunc(buyData))
            .attr("stroke", "green")
            .attr("stroke-width", 1)
            .style("fill", "none");

        // красная область
        this.redArea = node.append("path")
           .data([sellData])
           .attr("d", this.areaFunc)
           .style("fill", "rgba(255, 40, 40, 0.5)");

        // зеленая область
        this.greenArea = node.append("path")
           .data([buyData])
           .attr("d", this.areaFunc)
           .style("fill", "rgba(40, 255, 87, 0.5)");

        // текущая точка
        this.currentDot = node.append("circle")
            .attr("class", "dot")
            .attr("cx", -999)
            .attr("cy", -999)
            .attr("r", 0)
            .attr("id", "current-dot");

         // невидимая область для отслеживания позиции мыши
        this.mouseTracker = node.append("rect")
            .attr("width", this.w)
            .attr("height", this.h)
            .attr("x", 0)
            .attr("y", 0)
            .attr("id", "mouse-tracker")
            .style("fill", "transparent");

         this.mousemove = () => {
             const mouse_x = mouse(this.mouseTracker.node())[0];
             const chartPos = this.mouseTracker.node().getBoundingClientRect();
             const tooltipW = this.tooltip.offsetWidth;
             const graph_x = this.x.invert(mouse_x);
             const nearestID = this.getClosest(graph_x, this.allXdata);
             const dotData = [this.allXdata[nearestID], this.allYdata[nearestID]];
             this.currentDot
                 .attr("cx", this.x(dotData[0]))
                 .attr("cy", this.y(dotData[1]))
                 .transition()
                 .duration(120)
                 .attr("r", 4);

             select(this.tooltip)
                 .transition()
                 .duration(100)
                 .style('opacity', 1);

             this.setState({
                 currentPrice: this.allXdata[nearestID],
                 currentValue: this.allYdata[nearestID],
                 tooltipX: this.x(dotData[0]) + chartPos.x - tooltipW/2 ,
                 tooltipY: this.y(dotData[1]) + (margins[0]+ margins[2])/2 + 14
             });

             if (this.sellDataX.includes(this.state.currentPrice)) {
                 this.tooltip.classList.add('red');
                 this.tooltip.classList.remove('green');
                 this.currentDot
                     .attr("class", "dot red");
                 this.greenLine
                     .transition()
                     .duration(120)
                     .attr('stroke-width', 1);
                 this.redLine
                     .transition()
                     .duration(120)
                     .attr('stroke-width', 2)
             }else {
                 this.currentDot
                     .attr("class", "dot green");
                 this.tooltip.classList.add('green');
                 this.tooltip.classList.remove('red');
                 this.greenLine
                     .transition()
                     .duration(120)
                     .attr('stroke-width', 2);
                 this.redLine
                     .transition()
                     .duration(120)
                     .attr('stroke-width', 1)
             }
         };

         this.mouseout = () => {
             this.currentDot
                 .transition()
                 .duration(120)
                 .attr("r", 0);

             select(this.tooltip)
                 .transition()
                 .duration(120)
                 .style('opacity',0);

             this.greenLine
                 .transition()
                 .duration(120)
                 .attr('stroke-width', 1);

             this.redLine
                 .transition()
                 .duration(120)
                 .attr('stroke-width', 1)
         };

         this.mouseTracker
             .on("mousemove", this.mousemove)
             .on("mouseout", this.mouseout)

    }

    updateData() {
        const node = select(this.node);
        node.select('.x-axis')
            .transition(750)
            .call(this.xAxis)
            .style('shape-rendering', 'crispEdges')
            .selectAll(".tick line").attr("stroke", "lightgrey");

        node.select('.y-axis')
            .transition(750)
            .call(this.yAxis)
            .style('shape-rendering', 'crispEdges')
            .selectAll(".tick line").attr("stroke", "lightgrey");

        this.redLine
            .transition(750)
            .attr("d", this.lineFunc(this.sellData));

        this.greenLine
            .transition(750)
            .attr("d", this.lineFunc(this.buyData));

        this.redArea
            .data([this.sellData])
            .transition(750)
            .attr("d", this.areaFunc);

        this.greenArea
            .data([this.buyData])
            .transition(750)
            .attr("d", this.areaFunc)
    }

    componentDidMount() {
        this.sellData = this.props.sellData;
        this.buyData = this.props.buyData;
        this.prepareData();
        this.drawChart();
    }

    componentDidUpdate(){
        this.sellData = this.props.sellData;
        this.buyData = this.props.buyData;
        this.prepareData();
        this.updateData();
    }

    render() {
        return (
            <div id="chart">
                <div id="tooltip" ref={(el) => this.tooltip = el} style={{
                    left: this.state.tooltipX,
                    top: this.state.tooltipY
                }}>
                    <p className="tooltip-text">Price: <span id="tooltip_price">{this.state.currentPrice}</span> USDT</p>
                    <p className="tooltip-text">Buy orders: <span id="tooltip_price">{this.state.currentValue}</span></p>
                </div>
                <svg
                    width={this.props.width}
                    height={this.props.height}
                    ref={(el) => {
                        this.node = el
                    }}>
                </svg>
            </div>);
    }
}

export default CanvasChart;
