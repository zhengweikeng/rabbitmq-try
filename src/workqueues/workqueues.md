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
  conn.queue('second-queue', {
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
      prefetchCount: 1
    }, (message, headers, deliveryInfo, ack) => {
      const secs = message.data.toString().split('.').length - 1
      console.log(`Got a message from queue: ${deliveryInfo.queue}, message is: ${message.data.toString()}`)
      
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
  const msg = process.argv.slice(2).join(' ') || "Hello World!";
  conn.publish('second-queue', msg, {
    // 持久化数据
    deliveryMode: 2
  })
})
```
我们可以开多个消费者服务，然后用一个生产者发送数据
```bash
node consumer.js
node consumer.js
node consumer.js

node producer.js a message.
node producer.js a message..
node producer.js a message...
node producer.js a message....
node producer.js a message.....
```
这样每个消费者都会被轮询的得到消费数据的机会。这里我们通过.的数目来代表数据处理的耗时程度。

#### Acknowledgment
上面的代码在消费者模块配置了acknowledgment。  
在处理耗时任务是，很多情况会出现处理中途出现异常，甚至导致服务宕掉，这样客户端便得不到响应。  
默认情况下，rabbitmq在发送数据之后，该数据便从内存移除了，这样如果消费者模块被杀掉，那么这块数据就找不回来了。

也因此rabbitmq提供了acknowledgment来解决这种情况。就是让消费者处理完数据后给一个响应。如果未收到该响应，便要重新将数据入队，再次发送。

可以尝试起两个消费者服务，然后发送一个耗时任务`node producer.js a message..........`  
接着马上ctrl+c关闭其中一个消费者服务，便会发送另外一个消费者服务将会收到发送过来的数据。

注意到这里还有个prefetchCount的配置，默认是1。这表明了一个消费者在同一时刻只能处理一个任务

#### Durability
顾名思义，数据持久化。是为了解决rabbitmq服务因一些原因宕掉而丢失数据的情况，将数据持久化后，即使重启rabbitmq服务也依然不会和之前的队列丢失联系，数据也能够找回。durable必须在生产者和消费者都进行配置。