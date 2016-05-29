const amqp = require('amqp')

const conn = amqp.createConnection({host: 'localhost'})

conn.on('error', (e) => {
  console.log(e)
})

conn.on('ready', () => {
  console.log('ready!!')
  
  const args = process.argv.slice(2)
  const msg = args.slice(1).join(' ') || 'Hello World!'
  const severity = args.length > 0 ? args[0] : 'info'
  
  const exchange = conn.exchange('direct_logs', {
    type: 'direct',
    durable: false
  })
  
  exchange.publish(severity, msg, {})
  console.log(`send a message: ${msg}, route is: ${severity}`)
  
  setTimeout(() => {
    conn.disconnect()
    process.exit(0)
  }, 500)
})