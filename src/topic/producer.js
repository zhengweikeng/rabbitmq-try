const amqp = require('amqp')

const conn = amqp.createConnection({host: 'localhost'})

conn.on('error', (e) => {
  console.log(e)
})

conn.on('ready', () => {
  console.log('ready!!')
  
  const args = process.argv.slice(2)
  const key = (args.length > 0) ? args[0] : 'anonymous.info'
  const msg = args.slice(1).join(' ') || 'Hello World!'
  
  const exchange = conn.exchange('topic_logs', {
    type: 'topic',
    durable: false
  })
  
  exchange.publish(key, msg, {})
  console.log(`send a message: ${msg}, route is: ${severity}`)
  
  setTimeout(() => {
    conn.disconnect()
    process.exit(0)
  }, 500)
})