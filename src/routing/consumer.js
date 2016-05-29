const amqp = require('amqp')
const conn = amqp.createConnection({host: 'localhost'})

const args = process.argv.slice(2)
if (args.length === 0) {
  args.push('info')
}

conn.on('error', (e) => {
  console.log(e)
})

conn.on('ready', () => {
  conn.exchange('direct_logs', { type: 'direct', durable: false }, (exchange) => {
    conn.queue('', { exclusive: true }, (queue) => {
      console.log(`Queue ${queue.name} is open`)
      
      args.forEach((arg) => queue.bind(exchange, arg, ()=> console.log('bind finish')))
      console.log(`bind to route: ${args}`)
          
      queue.subscribe({ack: false}, (message, headers, deliveryInfo, ack) => {
        console.log(`Got a message with from exchange: ${deliveryInfo.exchange}`)
        console.log(`route is: ${deliveryInfo.routingKey}, message is: ${message.data.toString()}`)
      })
    })
  })
})