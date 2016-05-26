const amqp = require('amqp')

const conn = amqp.createConnection({host: 'localhost'})

conn.on('error', (e) => {
  console.log(e)
})

conn.on('ready', () => {
  console.log('ready!!')
  
  conn.queue('first-queue', (queue) => {
    console.log(`Queue ${queue.name} is open`)
    
    queue.subscribe((message, headers, deliveryInfo, messageObject) => {
      console.log(`Got a message with routing key ${deliveryInfo.routingKey}`);
    })
  })
})