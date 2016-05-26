const amqp = require('amqp')

const conn = amqp.createConnection({host: 'localhost'})

conn.on('ready', () => {
  console.log('ready!!')
  conn.publish('first-queue', 'hello world')
})