import React from "react";
import { scaleLinear } from "d3-scale";
import { max, sum } from "d3-array";
import { select } from "d3-selection";
import { legendColor } from "d3-svg-legend";
import { transition } from "d3-transition";
import { line, curveStep } from "d3-shape";

export default class MyChart extends React.Component {
  constructor(props) {
    super(props);
    this.createBarChart = this.createBarChart.bind(this);
    this.state = {
      Data: null
    };
  }
  componentDidMount() {
    this.createBarChart();
  }
  componentDidUpdate() {
    this.createBarChart();
  }
  createBarChart() {
    const node = this.node;

    const Data = this.props.data.sort((a, b) => {
      return a.volume < b.volume ? -1 : 1;
    });

    this.setState({ Data: Data });
  }

  createLines = () =>
    line()
      .x(d => d.volume)
      .y(d => d.price)
      .curve(curveStep);

  render() {
    return (
      <div>
        <canvas
          ref={node => (this.node = node)}
          width={this.props.size.h}
          height={this.props.size.h}
        />
        {this.createLines().context(this.node)(this.state.Data)}
      </div>
    );
  }
}
