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
        console.log((this.SortedData()));
        let data = this.SortedData();
        let canvas = this.canvas;
        let context = canvas.getContext('2d');

        let width = canvas.width,
            height = canvas.height;

        let x = scaleLinear()
            .rangeRound([width / 2, 0]);

        let y = scaleBand()
            .rangeRound([0, height]);

        x.domain([0, max(data, (d) => d.volume)]);
        y.domain(data.map((d) => d.price));

        let yWidth = y.bandwidth();
        context.fillStyle = "green";

        console.log(data.map(i => i.volume).join(' '));
        console.log(data.map(i => i.price).join(' '));
        data.forEach((d) => {
            //context.fillRect(x(d.volume), y(d.price), width / 2 - x(d.volume), yWidth);
            console.log('x(volume):',x(d.volume),'| y(price):', y(d.price));
            context.fillRect(x(d.volume), y(d.price), 5, 5);
        });
    }

    drawRed() {
        let data = this.SortedData();
        let canvas = this.canvas;
        let context = canvas.getContext('2d');

        let width = canvas.width,
            height = canvas.height;

        let x = scaleLinear()
            .rangeRound([width / 2, width]);

        let y = scaleBand()
            .rangeRound([0, height]);

        x.domain([0, max(data, (d) => d.volume)]);
        y.domain(data.map((d) => d.price));

        let yWidth = y.bandwidth();
        context.fillStyle = "red";
        data.forEach((d) => {
            context.fillRect(x(d.volume), y(d.price), width / 2 - x(d.volume), yWidth);
        });
    }

    redraw(){
        console.log(this.SortedData().map(i => i.volume).join(' '));
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
