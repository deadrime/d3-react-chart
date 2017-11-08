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

    drawChart(sellData, buyData) {
        const margins = [10, 16, 10, 16];

        let node = select(this.node);
        const w = this.props.width - margins[1] - margins[3];
        const h = this.props.height - margins[0] - margins[2];

        node = select(this.node)
            .append("g")
                    .attr("transform", "translate(" + margins[3] + "," + margins[0] + ")");

        const sellDataX = sellData.map(d => d[0]);
        const sellDataY = sellData.map(d => d[1]);

        const buyDataX = buyData.map(d => d[0]);
        const buyDataY = buyData.map(d => d[1]);

        const allXdata = concat(buyDataX, sellDataX);
        const allYdata = concat(buyDataY, sellDataY);

        // функции для вычисления позиции точек x y
        const x = scaleLinear().domain([min(buyDataX), max(sellDataX)]).range([0, w]);
        const y = scaleLinear().domain([0, max(buyDataY)]).range([h, 0]);

        // функция создания линии
        const lineFunc = line()
            .x((d) => x(d[0]))
            .y((d) => y(d[1]));

        // функция создания области
        const areaFunc = area()
            .x((d) => x(d[0]))
            .y0(h)
            .y1((d) => y(d[1]));

        // надписи и направляющие по oX
        const xAxis = axisBottom().scale(x).tickSize(-h);
        node.append("g")
            .attr("transform", "translate(0," + h + ")")
            .call(xAxis)
            .style('shape-rendering', 'crispEdges')
            .selectAll(".tick line").attr("stroke", "lightgrey");

        // надписи и направляющие по oY
        const yAxis = axisLeft().scale(y).tickSize(-w);
        node.append("g")
            .call(yAxis)
            .style('shape-rendering', 'crispEdges')
            .selectAll(".tick:not(:first-of-type) line").attr("stroke", "lightgrey");

        // красная линия
        const redLine = node.append("path")
            .attr("id", "redline")
            .attr("d", lineFunc(sellData))
            .attr("stroke", "red")
            .attr("stroke-width", 1)
            .style("fill", "none");

        console.log(redLine);
        // зеленая линия
        const greenLine = node.append("path")
            .attr("d", lineFunc(buyData))
            .attr("stroke", "green")
            .attr("stroke-width", 1)
            .style("fill", "none");

        // красная область
        node.append("path")
            .data([sellData])
            .attr("d", areaFunc)
            .style("fill", "rgba(255, 40, 40, 0.5)");

        // зеленая область
        node.append("path")
            .data([buyData])
            .attr("d", areaFunc)
            .style("fill", "rgba(40, 255, 87, 0.5)");

        // текущая точка
        const currentDot = node.append("circle")
            .attr("class", "dot")
            .attr("cx", -999)
            .attr("cy", -999)
            .attr("r", 0)
            .attr("id", "current-dot");

        // невидимая область для отслеживания позиции мыши
        const mouseTracker = node.append("rect")
            .attr("width", w)
            .attr("height", h)
            .attr("x", 0)
            .attr("y", 0)
            .attr("id", "mouse-tracker")
            .style("fill", "transparent");

        const mousemove = () => {
            const mouse_x = mouse(mouseTracker.node())[0];
            const chartPos = mouseTracker.node().getBoundingClientRect();
            const tooltipW = this.tooltip.offsetWidth;
            const graph_x = x.invert(mouse_x);
            const nearestID = this.getClosest(graph_x, allXdata);
            const dotData = [allXdata[nearestID], allYdata[nearestID]];
            currentDot
                .attr("cx", x(dotData[0]))
                .attr("cy", y(dotData[1]))
                .transition()
                .duration(120)
                .attr("r", 4);

            select(this.tooltip)
                .transition()
                .duration(100)
                .style('opacity', 1);

            this.setState({
                currentPrice: allXdata[nearestID],
                currentValue: allYdata[nearestID],
                tooltipX: x(dotData[0]) + chartPos.x - tooltipW/2 ,
                tooltipY: y(dotData[1]) + (margins[0]+ margins[2])/2 + 14
            });

            if (sellDataX.includes(this.state.currentPrice)) {
                this.tooltip.classList.add('red');
                this.tooltip.classList.remove('green');
                currentDot
                    .attr("class", "dot red");
                greenLine
                    .transition()
                    .duration(120)
                    .attr('stroke-width', 1);
                redLine
                    .transition()
                    .duration(120)
                    .attr('stroke-width', 2)
            }else {
                currentDot
                    .attr("class", "dot green");
                this.tooltip.classList.add('green');
                this.tooltip.classList.remove('red');
                greenLine
                    .transition()
                    .duration(120)
                    .attr('stroke-width', 2);
                redLine
                    .transition()
                    .duration(120)
                    .attr('stroke-width', 1)
            }
        };

        const mouseout = () => {
            currentDot
                .transition()
                .duration(120)
                .attr("r", 0);

            select(this.tooltip)
                .transition()
                .duration(120)
                .style('opacity',0);

            greenLine
                .transition()
                .duration(120)
                .attr('stroke-width', 1);

            redLine
                .transition()
                .duration(120)
                .attr('stroke-width', 1)
        };

        mouseTracker
            .on("mousemove", mousemove)
            .on("mouseout", mouseout)
    }

    redraw() {
        const sellData = [[7400, 0.05], [7700, 0.26], [7800, 0.61], [7900, 0.76], [9999, 0.79]];
        const buyData = [[3700, 2.99], [5500, 2.78], [6100, 2.5], [6400, 2.04], [6500,0.62],[7000, 0.09]];
        this.drawChart(sellData, buyData);
    }

    componentDidMount() {
        this.redraw();
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
