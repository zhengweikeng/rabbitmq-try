### Work Queues
很多时候，会有很多消费者来消费数据，例如我们会为我们的应用起多个服务，做负载均衡。

现在我们也模拟这种情况。即有多个消费者服务，他们监听着同一个队列。
```javascript
const amqp = require('amqp')
const conn = amqp.createConnection({host: 'localhost'})
conn.on('error', (e) => {
  console.log(e)
})

conn.on('ready', () => {
  console.log('ready!!')
  // 这里设置了一个durable。
  // 用于防止rabbitmq服务挂了，通过配置durable来将队列数据持久化。
  // 这样当rabbitmq重启后，数据便不会丢失
  conn.queue('first-queue', {
    durable: true
  }, (queue) => {
    console.log(`Queue ${queue.name} is open`)
    
    //这里设置ack和fetchCount参数
    // rabbitmq有一种叫acknowledgments的机制，可以确保你的这条消息是一定会被处理
    // 当你的消息处理是一个很耗时的操作，那么在这个过程中有可能会造成程序忽然奔溃的情况。
    // 而默认情况下，消息一出队，不管消费者处理是否成功，都会送缓存中删除数据。
    // 因此我们可以通过，传递一个确认信息给rabbitmq，告知消息已经处理完。
    // 如果处理失败，即rabbitmq服务没有接收到该ack，则会将该消息再次入队，并再次发送。
    queue.subscribe({
      ack: true,
      // 每次只发送一条消息。只有等到发送给rabbitmq确认信息ack后才会继续发送下一条数据
      fetchCount: 1
    }, (message, headers, deliveryInfo, ack) => {
      const secs = msg.content.toString().split('.').length - 1
      console.log(`Got a message with routing key ${deliveryInfo.routingKey}, message is: ${message.content.toString()}`)
      setTimeout(() => {
        console.log('task done!!')
        // 数据已经被处理完毕，发生确认信息告知rabbitmq
        ack.acknowledge()
      }, secs * 1000)      
    })
  })
})

// producer.js
const amqp = require('amqp')
const conn = amqp.createConnection({host: 'localhost'})
conn.on('error', (e) => {
  console.log(e)
})

conn.on('ready', () => {
  console.log('ready!!')
  conn.publish('second-queue', 'workqueues', {
    // 为了数据持久化，避免服务宕机导致数据丢失。
    deliveryMode: 'persistent'
  })
})
```