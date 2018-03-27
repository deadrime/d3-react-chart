const path = require('path')
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const port = process.env.PORT || 8080
const request = require('request-promise')

app.use(express.static(path.join(__dirname, '../../build')))

app.get('/', (req,res,next) => {
    res.sendFile(__dirname + './index.html')
})

const convertData = (data) => {
    return data.map(data => ({
        price: data[0],
        volume: data[1]
    }))
}

const getData = async () => {
    const sellData = request('https://kitchen-4.kucoin.com/v1/BTC-USDT/open/orders-sell?limit=100&group=1000&c=&lang=ru_RU', {json: true})
    const buyData = request('https://kitchen-4.kucoin.com/v1/BTC-USDT/open/orders-buy?limit=100&group=1000&c=&lang=ru_RU', {json: true})
    try {
        const result = await Promise.all([buyData, sellData])
        return({
            buyData: convertData(result[0].data),
            sellData: convertData(result[1].data)
        })
    }
    catch(err) {
        throw err
    }
}

io.on('connection', async (client) => {
    let data = await getData()
    client.emit('data', data)
    setInterval( async () => {
        try {
            data = await getData()
            client.emit('data', data)
        }
        catch (err) {
            return
        }
    }, 3000)
})

server.listen(port)
