const amqp = require('amqp')

const conn = amqp.createConnection({host: 'localhost'})

conn.on('error', (e) => {
  console.log(e)
})

conn.on('ready', () => {
  console.log('ready!!')
  const msg = process.argv.slice(2).join(' ') || 'Hello World!';
  
  const exchange = conn.exchange('logs', {
    type: 'fanout',
    durable: false
  })
  // 由于exchange的类型是fanout，因此第一个参数直接忽略
  exchange.publish('logsAll', msg, {})
  
  setTimeout(() => {
    conn.close()
    process.exit(0)
  }, 500)
})