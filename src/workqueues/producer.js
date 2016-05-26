const amqp = require('amqp')

const conn = amqp.createConnection({host: 'localhost'})

conn.on('error', (e) => {
  console.log(e)
})

conn.on('ready', () => {
  console.log('ready!!')
  
  conn.publish('second-queue', 'workqueues', {
    deliveryMode: 'persistent'
  })
})