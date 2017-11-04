import React from "react";
import {scaleLinear, scaleBand} from "d3-scale";
import {extent, max, sum} from "d3-array";

//import { line, curveStep } from "d3-shape";

class CanvasChart extends React.Component {
    constructor(props) {
        super(props);
    }

    SortedData() {
        return this.props.data.sort((a, b) => a.volume < b.volume ? -1 : 1);
    }

    clearCanvas() {
        let canvas = this.canvas;
        let context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    drawGreen() {
        let data = this.SortedData();
        let canvas = this.canvas;
        let context = canvas.getContext('2d');

        let width = canvas.width,
            height = canvas.height;

        let x = scaleLinear()
            .rangeRound([height / 2, 0]);

        let y = scaleBand()
            .rangeRound([0, width]);

        x.domain([0, max(data, (d) => d.volume)]);
        y.domain(data.map((d) => d.price));

        let yWidth = y.bandwidth();
        context.fillStyle = "green";
        data.forEach((d) => {
            context.fillRect(x(d.volume), y(d.price), width / 2 - x(d.volume), yWidth);
        });
    }

    drawRed() {
        let data = this.SortedData();
        let canvas = this.canvas;
        let context = canvas.getContext('2d');


        let width = canvas.width,
            height = canvas.height;

        let x = scaleLinear()
            .rangeRound([height / 2, height]);

        let y = scaleBand()
            .rangeRound([0, width]);

        x.domain([0, max(data, (d) => d.volume)]);
        y.domain(data.map((d) => d.price));

        let yWidth = y.bandwidth();
        context.fillStyle = "red";
        data.forEach((d) => {
            context.fillRect(x(d.volume), y(d.price), width / 2 - x(d.volume), yWidth);
        });
    }

    redraw(){
        this.clearCanvas();
        this.drawGreen();
        this.drawRed();
    }

    componentDidMount() {
        this.redraw();
    }

    componentDidUpdate() {
        this.redraw();
    }

    render() {
        return (
            <canvas
                width={this.props.size.w}
                height={this.props.size.h}
                ref={(el) => {this.canvas = el}}
            />);
    }
}

export default CanvasChart;
