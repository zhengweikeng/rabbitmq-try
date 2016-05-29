const amqp = require('amqp')

const conn = amqp.createConnection({host: 'localhost'})

conn.on('error', (e) => {
  console.log(e)
})

conn.on('ready', () => {
  console.log('ready!!')
  
  conn.queue('second-queue', {
    durable: true
  }, (queue) => {
    console.log(`Queue ${queue.name} is open`)
    
    queue.subscribe({
      ack: true,
      prefetchCount: 1
    }, (message, headers, deliveryInfo, ack) => {
      const secs = message.data.toString().split('.').length - 1
      console.log(`Got a message from queue: ${deliveryInfo.queue}, message is: ${message.data.toString()}`)
      
      setTimeout(() => {
        console.log('task done!!')
        ack.acknowledge()
      }, secs * 1000)      
    })
  })
})