import React from 'react'
import Chart from './Chart'
import io from 'socket.io-client'


class App extends React.Component {
    state = {
        buyData: null,
        sellData: null
    }
	constructor(props) {
        super(props)
        const HOST = window.location.origin.replace(/^http/, 'ws')
        console.log(HOST)
        const socket = io(HOST)
        socket.on('data', (data) => {
            this.setState({
                buyData: data.buyData,
                sellData: data.sellData
            })
        })  
    }
    render() {
        return(
            <Chart
                buyData={this.state.buyData}
                sellData={this.state.sellData}
                from='BTC'
                to='USDT'
                width={880}
                height={385}
            />
        )
    }
}

export default App