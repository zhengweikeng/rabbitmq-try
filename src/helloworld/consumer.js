const amqp = require('amqp')
const util = require('util')
const conn = amqp.createConnection({host: 'localhost'})

conn.on('error', (e) => {
  console.log(e)
})

conn.on('ready', () => {
  console.log('ready!!')
  
  conn.queue('first-queue', (queue) => {
    console.log(`Queue ${queue.name} is open`)
    
    queue.subscribe((message, headers, deliveryInfo, messageObject) => {
      console.log(`message: ${util.inspect(message)}`)
      console.log(`headers: ${util.inspect(headers)}`)
      console.log(`deliveryInfo: ${util.inspect(deliveryInfo)}`)
      console.log(`messageObject: ${util.inspect(messageObject)}`)
    })
  })
})