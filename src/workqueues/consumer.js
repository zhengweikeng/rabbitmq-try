const amqp = require('amqp')

const conn = amqp.createConnection({host: 'localhost'})

conn.on('error', (e) => {
  console.log(e)
})

conn.on('ready', () => {
  console.log('ready!!')
  
  conn.queue('first-queue', {
    durable: true
  }, (queue) => {
    console.log(`Queue ${queue.name} is open`)
    
    queue.subscribe({
      ack: true,
      fetchCount: 1
    }, (message, headers, deliveryInfo, ack) => {
      const secs = msg.content.toString().split('.').length - 1
      console.log(`Got a message with routing key ${deliveryInfo.routingKey}, message is: ${message.content.toString()}`)
      
      setTimeout(() => {
        console.log('task done!!')
        ack.acknowledge()
      }, secs * 1000)      
    })
  })
})