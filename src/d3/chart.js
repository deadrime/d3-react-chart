import React from "react";
import {scaleLinear} from "d3-scale";
import {max, min} from "d3-array";
import {select, append, mouse, event} from 'd3-selection'
import {axisLeft, axisBottom} from 'd3-axis';
import {transition} from 'd3-transition';
import {brushX} from 'd3-brush'

import concat from 'lodash/concat';
// import forEach from 'lodash/forEach';
// import sortBy from 'lodash/sortBy';

import {line, area} from 'd3-shape';

import './style.css'

class CanvasChart extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            node: null,
            currentPrice: 0,
            currentValue: 0,
            tooltipX: -999,
            tooltipY: -999,
            showBuy: true,
            showSell: true,
        };
        this.toggleBuy = this.toggleBuy.bind(this);
        this.toggleSell = this.toggleSell.bind(this);
    }

    getClosest(num, arr) {
        let curr = arr[0];
        let diff = Math.abs(num - curr);
        let id = 0;
        for (let val = 0; val < arr.length; val++) {
            const newdiff = Math.abs(num - arr[val]);
            if (newdiff < diff) {
                diff = newdiff;
                curr = arr[val];
                id = val;
            }
        }
        return id;
    }

    prepareData(sellData, buyData) {
        buyData = this.state.showBuy ? buyData : [];
        sellData = this.state.showSell ? sellData : [];

        this.margin = {top: 20, right: 20, bottom: 30, left: 50};

        this.w = this.props.width - this.margin.left - this.margin.right;
        this.h = this.props.height - this.margin.top - this.margin.bottom;

        this.sellDataX = sellData.map(d => d[0]);
        this.sellDataY = sellData.map(d => d[1]);

        this.buyDataX = buyData.map(d => d[0]);
        this.buyDataY = buyData.map(d => d[1]);

        this.allXdata = concat(this.buyDataX, this.sellDataX);
        this.allYdata = concat(this.buyDataY, this.sellDataY);

        console.log(this.sellDataX);
        const maxY = Math.round(max(this.allYdata)*2)/2;
        this.x = scaleLinear().domain([min(this.allXdata), max(this.allXdata)]).range([0, this.w]);
        this.y = scaleLinear().domain([0, maxY]).range([this.h, 0]);

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

    drawChart(sellData, buyData) {
        select(this.node).append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", this.w)
            .attr("height", this.h);

        const node = select(this.node)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        // надписи и направляющие по oX
        node.append("g")
            .attr('class', 'x-axis')
            .attr("transform", "translate(0," + this.h + ")")
            .call(this.xAxis)
            .style('shape-rendering', 'crispEdges')
            .selectAll(".tick line").attr("stroke", "lightgrey");

        // надписи и направляющие по oY
        node.append("g")
            .call(this.yAxis)
            .attr('class', 'y-axis')
            .style('shape-rendering', 'crispEdges')
            .selectAll(".tick line").attr("stroke", "lightgrey");

        // штука, внутри которой будет все элементы графика
        this.chart = node.append("g")
            .attr('class', 'chart-area')
            .style("clip-path", "url(#clip)");

        // красная линия
        this.redLine = this.chart.append("path")
            .attr("id", "redline")
            .attr("d", this.lineFunc(sellData))
            .attr("stroke", "rgba(179, 29, 29, 0.8)")
            .attr("stroke-width", 1)
            .style("fill", "none");

        // зеленая линия
        this.greenLine = this.chart.append("path")
            .attr("d", this.lineFunc(buyData))
            .attr("stroke", "rgba(76, 175, 80, 0.8)")
            .attr("stroke-width", 1)
            .style("fill", "none");

        // красная область
        this.redArea = this.chart.append("path")
            .data([sellData])
            .attr("d", this.areaFunc)
            .style("fill", "rgba(255, 40, 40, 0.5)");

        // зеленая область
        this.greenArea = this.chart.append("path")
            .data([buyData])
            .attr("d", this.areaFunc)
            .style("fill", "rgba(40, 255, 87, 0.5)");

        // текущая точка
        this.currentDot = this.chart.append("circle")
            .attr("class", "dot")
            .attr("cx", -999)
            .attr("cy", -999)
            .attr("r", 0)
            .attr("id", "current-dot");

        // тут можно получить значения выделенной области
        const brushended = () => {
            const s = event.selection;
            console.log(s);

            zoom();
        };

        const zoom = () => {
            // тут должен быть ресайз
        };

        const idled = () => {
            idleTimeout = null;
        };

        let mybrush = brushX().on("end", brushended),
            idleTimeout,
            idleDelay = 350;

        // область для зума и отслеживания перемещения мыши
        this.mouseTracker = this.chart.append("g")
            .attr("class", "brush")
            .call(mybrush);

        // функция для
        const mousemove = () => {
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
                tooltipX: this.x(dotData[0]) + chartPos.x - tooltipW / 2,
                tooltipY: this.y(dotData[1]) + (this.margin.top + this.margin.bottom) / 2 + 14
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
            } else {
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

        const mouseout = () => {
            this.currentDot
                .transition()
                .duration(120)
                .attr("r", 0);

            select(this.tooltip)
                .transition()
                .duration(120)
                .style('opacity', 0);

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
            .on("mousemove", mousemove)
            .on("mouseout", mouseout);
    }

    updateChart(sellData, buyData) {
        const node = select(this.node);
        // ресайзинг oX
        node.select('.x-axis')
            .transition(750)
            .call(this.xAxis)
            .style('shape-rendering', 'crispEdges')
            .selectAll(".tick line").attr("stroke", "lightgrey");
        // ресайзинг oY
        node.select('.y-axis')
            .transition(750)
            .call(this.yAxis)
            .style('shape-rendering', 'crispEdges')
            .selectAll(".tick:not(:first-of-type) line").attr("stroke", "lightgrey");

        this.redLine
            .transition(750)
            .attr("d", this.lineFunc(sellData));

        this.greenLine
            .transition(750)
            .attr("d", this.lineFunc(buyData));

        this.redArea
            .data([sellData])
            .transition(750)
            .attr("d", this.areaFunc);

        this.greenArea
            .data([buyData])
            .transition(750)
            .attr("d", this.areaFunc)
    }

    componentDidMount() {
        this.prepareData(this.props.sellData, this.props.buyData);
        this.drawChart(this.props.sellData, this.props.buyData);
    }

    componentDidUpdate() {
        this.prepareData(this.props.sellData, this.props.buyData);
        this.updateChart(this.props.sellData, this.props.buyData);
    }

    toggleBuy() {
        this.setState({
            showBuy: !this.state.showBuy
        })
    }

    toggleSell() {
        this.setState({
            showSell: !this.state.showSell
        })
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
                <div>
                    <button onClick={this.toggleBuy}>Переключить buy</button>
                    <button onClick={this.toggleSell}>Переключить sell</button>
                </div>
            </div>);
    }
}

export default CanvasChart;
