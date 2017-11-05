import React from "react";
import {scaleLinear, scaleBand} from "d3-scale";
import {max} from "d3-array";
import forEach from 'lodash/forEach';
import sortBy from 'lodash/sortBy';

class CanvasChart extends React.Component {
    clearCanvas() {
        let canvas = this.canvas;
        let context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    drawChart(data) {
        const canvas = this.canvas;
        const context = canvas.getContext('2d');

        const width = canvas.width,
              height = canvas.height;

        const greenX = scaleLinear()
                .rangeRound([width / 2, 0]),
              redX = scaleLinear()
                .rangeRound([width / 2, width]),
              Y = scaleBand()
                .rangeRound([0, height]);

        greenX.domain([0, max(data, (d) => d.volume)]);
        redX.domain([0, max(data, (d) => d.volume)]);
        Y.domain(data.map((d) => d.price));

        let rectWidth = Y.bandwidth();

        console.log(data.map(i => i.volume).join(' '));
        console.log(data.map(i => i.price).join(' '));

        // зеленый график
        context.fillStyle = "green";
        forEach(data, (d) => {
            context.fillRect(greenX(d.volume), Y(d.price), width / 2 - greenX(d.volume), rectWidth);
            console.log('x(volume):', greenX(d.volume), '| y(price):', Y(d.price));
            //context.fillRect(x(d.volume), y(d.price), 5, 5);
        });

        // красный график
        context.fillStyle = "red";
        forEach(data, (d) => {
            context.fillRect(redX(d.volume), Y(d.price), width / 2 - redX(d.volume), rectWidth);
        });
    }

    redraw() {
        const data = sortBy(this.props.data, 'volume');
        console.log(data);
        this.clearCanvas();
        this.drawChart(data);
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
                ref={(el) => {
                    this.canvas = el
                }}
            />);
    }
}

export default CanvasChart;
