const amqp = require('amqp')

const conn = amqp.createConnection({host: 'localhost'})

conn.on('error', (e) => {
  console.log(e)
})

conn.on('ready', () => {
  console.log('ready!!')
  const msg = process.argv.slice(2).join(' ') || "Hello World!";
  conn.publish('second-queue', msg, {
    deliveryMode: 2
  })
})