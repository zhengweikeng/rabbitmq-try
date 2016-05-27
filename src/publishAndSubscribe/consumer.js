const amqp = require('amqp')

const conn = amqp.createConnection({host: 'localhost'})

conn.on('error', (e) => {
  console.log(e)
})

conn.on('ready', () => {
  conn.exchange('logs', { type: 'fanout', durable: false }, (exchange) => {
    conn.queue('', { exclusive: true }, (queue) => {
      console.log(`Queue ${queue.name} is open`)
      
      queue.bind(exchange, '', () => {
        queue.subscribe({ack: false}, (message, headers, deliveryInfo, ack) => {
          console.log(`Got a message with routing key ${deliveryInfo.routingKey}, message is: ${message.data.toString()}`)
        })
      })
    })
  })
})