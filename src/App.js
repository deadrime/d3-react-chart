import React, {Component} from 'react';
import './App.css';

//import MyChart from './d3/chart';

import CanvasChart from './d3/chart_worked';

const DATA = [
    {"price": 7251, "volume": 6.7},
    {"price": 7250, "volume": 3.4},
    {"price": 7247, "volume": 1.0},
    {"price": 7246, "volume": 7.5},
    {"price": 7244, "volume": 11.5},
    {"price": 7245, "volume": 41.9},
    {"price": 7243, "volume": 0.8},
    {"price": 7241, "volume": 0.3},
    {"price": 7240, "volume": 11.5},
    {"price": 7239, "volume": 2.0},
    {"price": 7237, "volume": 1.0},
    {"price": 7236, "volume": 35.2},
    {"price": 7235, "volume": 8.5},
    {"price": 7233, "volume": 11.5}
];

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: DATA,
            livemod: false,
            intervalId: null,
            updateInterval: 2000
        }
    }
    
    test() { // изменение данных
        if (!this.state.livemod) {
            const intervalId = setInterval(() => {
                const NewData = DATA.map(i => {
                    let newPrice = parseInt(i.price + (Math.random() * (10 - (-10)) + (-10)));
                    let newVolume = i.volume + (Math.random() * (10 - (-10)) + (-10));
                    newVolume = newVolume < 0 ? 0 : newVolume;
                    return {
                        price: newPrice,
                        volume: newVolume
                    }
                });
                this.setState({
                    data: NewData
                })
            }, this.state.updateInterval);
            this.setState({
                livemod: !this.state.livemod,
                intervalId: intervalId
            });
        }
        else {
            clearInterval(this.state.intervalId);
            this.setState({
                livemod: false,
                intervalId: null
            })
        }

    }

    render() {
        return (
            <div className="App">
                <h1 onClick={() => this.test()}>Тыц</h1>
                <CanvasChart data={this.state.data} size={{h: 500, w: 500}}/>
            </div>
        );
    }
}

export default App;
