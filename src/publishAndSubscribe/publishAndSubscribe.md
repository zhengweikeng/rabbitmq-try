### Exchanges
这次引入了Exchanges的概念。通过前面我们构造了一个生产者producer向消费者consumer发送数据的案例。

其实，本质上来说producer是不会直接将发送消息到rabbitmq的队列的。producer只是将消息发送到了Exchange，再由Exchange将消息发送到队列。

因此一个Exchange扮演了两方面的角色，一个是从producer接收数据，一个是向队列发送数据。

而一个Exchange必须明确知道消息的去处。是发送到一个具体的队列，还是给多个队列，还是将其丢弃。这些都是由Exchange的类型决定的。

Exchange的类型有direct,topic,headers,fanout。这次我们来模拟fanout类型的exchange，也即将消息广播出去。消费者实时的获取最新数据。

#### 生产者广播消息
```javascript
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
  exchange.publish('', msg, {})
  
  setTimeout(() => {
    conn.close()
    process.exit(0)
  }, 500)
})
```
这次，我们不让生产者直接向队列发送消息，而是通过exchange的方式。

注意到publish的第一个参数是空，该参数是一个路由，这后续章节会解释。

另外，如果exchange的类型是fanout，则在publish时第一个参数即使设置了值也是无效的。

#### 消费者绑定exchange并接收消息
```javascript
const amqp = require('amqp')
const conn = amqp.createConnection({host: 'localhost'})
conn.on('error', (e) => {
  console.log(e)
})

conn.on('ready', () => {
  conn.exchange('logs', { type: 'fanout', durable: false }, (exchange) => {
    conn.queue('', { exclusive: true }, (queue) => {
      console.log(`Queue ${queue.name} is open`)
      
      queue.bind(exchange, '', () => {
        queue.subscribe({ack: false}, (message, headers, deliveryInfo, ack) => {
          console.log(`Got a message with routing key ${deliveryInfo.routingKey}, message is: ${message.data.toString()}`)
        })
      })
    })
  })
})
```
注意到我们连接到和生产者同一个exchange后队列的创建方式，这里我们不命名队列名字，这会让rabbitmq创建一个随机的队列名。   
并且队列的配置中，将exclusive设置为true，表明该队列只能用于本连接，并且当消费者断开队列连接时，该队列将被删除。

为什么exclusive要设置为true，是因为本次的消费者只需要获取最新的消息，它并不需要关心以前的旧的消息。

之后，队列会绑定到之前创建的exchange，bind的第二个参数是一个路由，这个在后续章节会描述。

一般情况下，队列只有绑定到exchange后才能收到消息。否则只能队列只能接收默认exchange发来的消息。之前的那些例子就是接收默认exchange发来的消息。

最后就是订阅该exchange的消息了，一旦该exchange有消息便会被接收处理。注意这里我们的ack为false，因为此时的rabbitmq不需要关心谁收到了消息了。

接下来创建两个消费者和一个生产者来模拟一下
```bash
node consumer.js
# Queue amq.gen-ieoUHTIh3YAotmhPvc3ySw is open
# Got a message with from exchange logs, message is: Hello World!

node consumer.js
# Queue amq.gen-bouvPKmpznz9USbT7C7gAg is open
# Got a message with from exchange logs, message is: Hello World!

node producer.js
```
可以看到rabbitmq为消费者创建了队列名为随机码的队列，并接收到消息。