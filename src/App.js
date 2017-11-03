import React, { Component } from 'react';
import './App.css';

import MyChart from './d3/chart';


const DATA = [
  { "price": 7251, "volume": 6.7 },
  { "price": 7250, "volume": 3.4 },
  { "price": 7247, "volume": 1.0 },
  { "price": 7246, "volume": 7.5 },
  { "price": 7244, "volume": 11.5 },
  { "price": 7245, "volume": 41.9 },
  { "price": 7243, "volume": 0.8 },
  { "price": 7241, "volume": 0.3 },
  { "price": 7240, "volume": 11.5 },
  { "price": 7239, "volume": 2.0 },
  { "price": 7237, "volume": 1.0 },
  { "price": 7236, "volume": 35.2 },
  { "price": 7235, "volume": 8.5 },
  { "price": 7233, "volume": 11.5 }
]

class App extends Component {
  render() {
    return (
      <div className="App">
        <MyChart data={DATA} size={{h:200,w:200}} />
      </div>
    );
  }
}

export default App;
