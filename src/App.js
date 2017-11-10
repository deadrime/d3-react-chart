import React, {Component} from 'react';
import './App.css';

import CanvasChart from './d3/chart';

const sellData = [[7400, 0.05], [7700, 0.26], [7800, 0.61], [7900, 0.76], [9999, 0.79]];
const buyData = [[3700, 2.99], [5500, 2.78], [6100, 2.5], [6400, 2.04], [6500,0.62],[7000, 0.09]];

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            sellData: sellData,
            buyData: buyData
        };
    }

    componentDidMount() {
        const getRandomData = (min, max) => {
            return Math.random() * (max - min) + min;
        };


        setInterval(() => {
            const sortByPrice = (a,b) => {
              return a[0] < b[0] ? -1 : 1
            };

            let newSellData = this.state.sellData.map(d=>[d[0] - getRandomData(-100,100),d[1]]).sort(sortByPrice);
            let newBuyData = this.state.buyData.map(d=>[d[0] - getRandomData(-100,100),d[1]]).sort(sortByPrice);


            this.setState({
                sellData: newSellData,
                buyData: newBuyData
            });
        }, 3000)
    }

    render() {
        return (
            <div className="App">
                <h1>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab adipisci aliquam deserunt, fuga hic ipsa modi nam optio placeat quaerat recusandae tempora unde vel! Delectus dolor facere ipsa non voluptatibus?</h1>
                <CanvasChart
                    sellData = {this.state.sellData}
                    buyData = {this.state.buyData}
                    height={600}
                    width={800}
                />
            </div>
        );
    }
}

export default App;
