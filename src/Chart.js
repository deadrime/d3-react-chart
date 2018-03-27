import React from "react";
import {scaleLinear} from "d3-scale";
import {max, min} from "d3-array";
import {select, mouse} from 'd3-selection';
import {axisLeft, axisBottom} from 'd3-axis';
import {brushX} from 'd3-brush';
import {css} from 'glamor';
import concat from 'lodash/concat';
import includes from 'lodash/includes';
import transform from 'lodash/transform';
import map from 'lodash/map';
import {line, area} from 'd3-shape';

const toPrecious = (value, precious = 9) => {
	const parsed = parseFloat(value, 10)
	  .toFixed(precious)
	  .toString()
	  .substr(0, precious + 1)
	return parsed[parsed.length - 1] === '.'
	  ? parsed.concat('0')
	  : parsed
}

const ChartStyle = css({
	'position': 'relative',
	'& .domain': {
		'stroke': 'none'
	}
});

const dotStyle = css({
	'stroke': 'rgba(255,255,255,.8)',
	'strokeWidth': '2',
	'&.red': {
		'fill': 'red'
	},
	'&.green': {
		'fill': 'green'
	}
});

const tooltipStyle = css({
	"position": "absolute",
	"padding": "5px",
	"background": "rgba(255, 255, 255, 0.95)",
	"color": "#000",
	"borderRadius": "2px",
	"pointerEvents": "none",
	"& p": {
		"fontSize": "12px",
		"padding": "0 0.4em",
		"margin": "0.2em 0"
	},
	"&.red": {
		'boxShadow': '0 0 0 1px red',
	},
	"&.green": {
		'boxShadow': '0 0 0 1px green',
	}
});

const tooltipTriangleStyle = css({
	"pointerEvents": "none",
	"opacity": "0",
	"position": "absolute",
	"zIndex": "1",
	"content": "''",
	"width": "0",
	"height": "0",
	"borderStyle": "solid",
	"borderWidth": "0 8px 8px 8px",
	"borderColor": "transparent transparent red transparent",
	"&::before": {
		"content": "''",
		"position": "absolute",
		"zIndex": "2",
		"width": "0px",
		"height": "0px",
		"left": "-7px",
		"top": "1px",
		"borderStyle": "solid",
		"borderWidth": "0 7px 7px 7px",
		"borderColor": "transparent transparent #fff transparent"
	}
});

const greenLineStyle = css({
	"stroke": "rgba(76, 175, 80, 0.8)",
	"fill": "none"
});

const redLineStyle = css({
	"stroke": "rgba(179, 29, 29, 0.8)",
	"fill": "none"
});

const redAreaStyle = css({
	"fill": "rgba(255, 95, 115, 0.4)"
});

const greenAreaStyle = css({
	"fill": "rgba(1, 170, 120, 0.4)"
});

const yAxisStyle = css({
	'shapeRendering': 'crispEdges',
	"& .tick line": {
		"stroke": "lightgrey"
	},
	"& .tick text": {
		"transform": "translateX(-5px)"
	}
});

const xAxisStyle = css({
	'shapeRendering': 'crispEdges',
	"& .tick line": {
		"stroke": "lightgrey"
	},
	"& .tick text": {
		"transform": "translateY(5px)"
	}
})

const toggler = css({
	'display': 'flex',
	'alignItems': 'center'
});

const buyTogglerDot = css({
	'width': '1em',
	'height': '1em',
	'display': 'block',
	'borderRadius': '50%',
	'background': 'rgb(1, 170, 120)',
});

const sellTogglerDot = css({
	'width': '1em',
	'height': '1em',
	'display': 'block',
	'borderRadius': '50%',
	'background': 'rgb(255, 95, 115)',
});

class CanvasChart extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			currentPrice: 0,
			currentValue: 0,
			tooltipX: -999,
			tooltipY: -999,
			showBuy: true,
			showSell: true,
			dataIsLoaded: false
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
		this.buyData = this.state.showBuy ? buyData : [];
		this.sellData = this.state.showSell ? sellData : [];
		console.log(this.state.showBuy, this.buyData)

		if (!this.buyData && !this.sellData) {
			this.setState({
				dataIsLoaded: false
			})
		} else {
			this.setState({
				dataIsLoaded: true
			})
		}

		const transformData = (d) => transform(d, (result, value, key) => {
			let newVolume = Number(value.volume);
			newVolume = result[key - 1] ? newVolume + Number(result[key - 1].volume) : newVolume;
			result.push({
				price: Number(value.price),
				volume: newVolume
			});
			return value;
		}, []);

		this.buyData = transformData(this.buyData);
		this.sellData = transformData(this.sellData);
		
		this.margin = {top: 20, right: 20, bottom: 20, left: 20};

		this.w = this.props.width - this.margin.left - this.margin.right;
		this.h = this.props.height - this.margin.top - this.margin.bottom;

		this.sellDataX = map(this.sellData, d => d.price);
		this.sellDataY = map(this.sellData, d => d.volume);

		this.buyDataX = map(this.buyData, d => d.price);
		this.buyDataY = map(this.buyData, d => d.volume);

		this.allXdata = concat(this.buyDataX, this.sellDataX);
		this.allYdata = concat(this.buyDataY, this.sellDataY);

		const maxY = max(this.allYdata) * 1.25;
		this.x = scaleLinear().domain([min(this.allXdata), max(this.allXdata)]).range([0, this.w]);
		this.y = scaleLinear().domain([0, maxY]).range([this.h, 0]);

		this.lineFunc = line()
			.x((d) => this.x(d.price))
			.y((d) => this.y(d.volume));

		// функция создания области
		this.areaFunc = area()
			.x((d) => this.x(d.price))
			.y0(this.h)
			.y1((d) => this.y(d.volume));

		this.xAxisFunc = axisBottom(this.x).ticks(6).tickSize(-this.h);
		this.yAxisFunc = axisLeft(this.y).ticks(6).tickSize(-this.w);
	}

	drawChart() {
		select(this.node).append("defs").append("clipPath")
			.attr("id", "clip")
			.append("rect")
			.attr("width", this.w)
			.attr("height", this.h);

		const node = select(this.node)
			.append("g")
			.attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

		// надписи и направляющие по oX
		this.xAxisNode = node.append("g")
			.call(this.xAxisFunc)
			.attr('class', `${xAxisStyle}`)
			.attr("transform", "translate(0," + this.h + ")");

		// надписи и направляющие по oY
		this.yAxisNode = node.append("g")
			.call(this.yAxisFunc)
			.attr('class', `${yAxisStyle}`);

		// штука, внутри которой будет все элементы графика
		this.chart = node.append("g")
			.attr('class', 'chart-area')
			.style("clip-path", "url(#clip)");

		// красная линия
		this.redLine = this.chart.append("path")
			.attr("d", this.lineFunc(this.sellData))
			.attr("class", `${redLineStyle}`)
			.attr("stroke-width", 1);

		// зеленая линия
		this.greenLine = this.chart.append("path")
			.attr("d", this.lineFunc(this.buyData))
			.attr("class", `${greenLineStyle}`)
			.attr("stroke-width", 1);

		// красная область
		this.redArea = this.chart.append("path")
			.data([this.sellData])
			.attr("d", this.areaFunc)
			.attr("class", `${redAreaStyle}`);

		// зеленая область
		this.greenArea = this.chart.append("path")
			.data([this.buyData])
			.attr("d", this.areaFunc)
			.attr("class", `${greenAreaStyle}`);

		this.currentDot = this.chart.append("circle")
			.attr("class", `${dotStyle}`)
			.attr("cx", -999)
			.attr("cy", -999)
			.attr("r", 0);

		// тут можно получить значения выделенной области
		const brushended = () => {
			//const s = event.selection;
			//console.log(s);
		};

		let mybrush = brushX().on("end", brushended)
		// idleTimeout,
		// idleDelay = 350;

		// область для зума и отслеживания перемещения мыши
		this.mouseTracker = this.chart.append("g")
			.attr("class", "brush")
			.call(mybrush);

		let mouse_x = 0; // тут лежит текущая позиция мыши

		const updateTooltip = (mouse_x) => {
			if (!this.state.dataIsLoaded) {
				return
			}
			const tooltipW = this.tooltip.offsetWidth,
				tooltipH = this.tooltip.offsetHeight,
				triangleW = this.tooltipTriangle.offsetWidth,
				triangleH = this.tooltipTriangle.offsetHeight,
				graph_x = this.x.invert(mouse_x),
				nearestID = this.getClosest(graph_x, this.allXdata),
				dotData = [this.allXdata[nearestID], this.allYdata[nearestID]];

			// меняю координаты текущей точки
			this.currentDot
				.attr("cx", this.x(dotData[0]))
				.attr("cy", this.y(dotData[1]))

			const minPadding = 8;
			const paddingFromDot = 14;

			let tooltipX = this.x(dotData[0]) + this.margin.left - tooltipW / 2,
				tooltipY = this.y(dotData[1]) + this.margin.top + paddingFromDot,
				triangleX = this.x(dotData[0]) + this.margin.left - triangleW / 2,
				triangleY = this.y(dotData[1]) + this.margin.top - triangleH + paddingFromDot;

			if (tooltipX < minPadding) {
				tooltipX = minPadding;
			}
			else if (tooltipX + tooltipW > this.props.width - minPadding) {
				tooltipX = this.props.width - minPadding - tooltipW;
			}

			if (tooltipY > this.props.height / 2) {
				tooltipY -= tooltipH + paddingFromDot * 2;
				triangleY -= paddingFromDot * 2 - triangleH;
				select(this.tooltipTriangle).style('transform', 'rotate(180deg)')
			}
			else {
				select(this.tooltipTriangle).style('transform', 'rotate(0deg)')
			}

			// позиция и появление треугольника
			select(this.tooltipTriangle)
				.style('left', `${triangleX}px`)
				.style('top', `${triangleY}px`);

			// появление подзказки
			this.setState({
				currentPrice: this.allXdata[nearestID],
				currentValue: this.allYdata[nearestID],
				tooltipX: tooltipX,
				tooltipY: tooltipY
			});

		};

		const mousemove = () => {
			mouse_x = mouse(this.mouseTracker.node())[0]; // высчитываем новую позицию, если мышка двинулась
			updateTooltip(mouse_x); // обновляем подсказку
			// появление подсказки
			select(this.tooltip)
				.transition()
				.duration(100)
				.style('opacity', 1);

			// появление чертовой стрелки
			select(this.tooltipTriangle)
				.transition()
				.duration(100)
				.style('opacity', 1);

			// появление точки
			this.currentDot
				.transition()
				.duration(120)
				.attr("r", 4);

			// косметичесская хрень
			if (includes(this.sellDataX, this.state.currentPrice)) {
				this.tooltip.classList.add('red');
				this.tooltip.classList.remove('green');

				this.currentDot
					.classed("red", true)
					.classed("green", false);

				this.greenLine
					.transition()
					.duration(120)
					.attr('stroke-width', 1);

				select(this.tooltipTriangle)
					.style("border-bottom-color", "red");

				this.redLine
					.transition()
					.duration(120)
					.attr('stroke-width', 2)
			}
			else {
				this.currentDot
					.classed("red", false)
					.classed("green", true);

				this.tooltip.classList.add('green');
				this.tooltip.classList.remove('red');

				select(this.tooltipTriangle)
					.style("border-bottom-color", "green");

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

		const updateData = () => {
			updateTooltip(mouse_x); // если пришли новые данные - юзаемм старую позицию мышки
		};

		const mouseout = () => { // скрываем все штуки
			this.currentDot
				.transition()
				.duration(120)
				.attr("r", 0);

			select(this.tooltip)
				.transition()
				.duration(120)
				.style('opacity', 0);

			select(this.tooltipTriangle)
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
			.on("mouseout", mouseout)
			.on("updatedata", updateData)
	}

	updateChart() {
		// ресайзинг oX
		this.mouseTracker.dispatch("updatedata");

		this.xAxisNode
			.transition(750)
			.call(this.xAxisFunc);

		// ресайзинг oY
		this.yAxisNode
			.transition(750)
			.call(this.yAxisFunc);

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
			.attr("d", this.areaFunc);
	}

	componentDidMount() {
		this.prepareData(this.props.sellData, this.props.buyData);
		this.drawChart();
	}

	componentWillReceiveProps(nextProps) {
		this.prepareData(nextProps.sellData, nextProps.buyData);
		this.updateChart();
	}

	toggleBuy() {
		this.setState(
			{
				showBuy: !this.state.showBuy,
				showSell: true
			},
			() => {
				this.prepareData(this.props.sellData, this.props.buyData)
				this.updateChart();
			}
		)
	}

	toggleSell() {
		this.setState(
			{
				showSell: !this.state.showSell,
				showBuy: true
			},
			() => {
				this.prepareData(this.props.sellData, this.props.buyData)
				this.updateChart();
			}
		)
	}

	render() {
		return (
			<div {...ChartStyle}>
				<div
					{...tooltipTriangleStyle}
					style= {({
						display: !this.state.dataIsLoaded ? 'none' : null
					})}
					ref={(el) => this.tooltipTriangle = el}
				/>
				<div 
					className = {tooltipStyle}
					ref={(el) => {this.tooltip = el}}
					style= {({
						left: this.state.tooltipX,
						top: this.state.tooltipY,
						display: !this.state.dataIsLoaded ? 'none' : null
					})}
				>
					<p>Цена: <span>{toPrecious(this.state.currentPrice, 8)}<b> {this.props.to}</b></span></p>
					<p>Ордера: <span>{toPrecious(this.state.currentValue, 8)}<b></b></span></p>
				</div>
				<svg
					width= {this.props.width}
					height= {this.props.height}
					ref={(el) => {this.node = el}}
				/>
				<div>
					<div onClick={this.toggleBuy} {...toggler}><span {...buyTogglerDot}></span> <span>Покупка</span></div>
					<div onClick={this.toggleSell} {...toggler}><span {...sellTogglerDot}></span> <span>Продажа</span></div>
				</div>
			</div>
		)
	}
}

export default CanvasChart