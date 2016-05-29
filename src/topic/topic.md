### Topic
Topic类型的exchange，可以做到比direct类型的exchange更大的扩展性，例如我想给队列增加多个匹配属性，让exchange不是只能够匹配一个route。

例如官网给的例子：

我们可以发送一些描述动物属性的信息给队列。如下图所示。

这种模式下，routeKey必须为一系列字母组成，并且以.分隔，如stock.usd.nyse。

而且rabbitmq还提供了两种通配符，*和#。

*:可以匹配一个单词  
\#:可以零或者以上的单词

这里我们将动物描述为：speed.colour.species  
将*.orange.*这种类型的routeKey发送到队列1。  
将*.*.rabbit和lazy.#的routeKey发送到队列2。

因此当你的routeKey为quick.orange.rabbit时，两个队列都将收到消息；  
lazy.orange.elephant也是将被两者收到；  
而routeKey为quick.orange.fox只会被队列1收到，lazy.brown.fox则只会被队列2收到。

另外routeKey为lazy.pink.rabbit的消息只会被队列2收到一次，即使它同时匹配了两种情况。

quick.brown.fox则不会被任何队列收到。

如果routeKey为orange或者quick.orange.male.rabbit的消息也不会被任何队列收到。  
而如果为lazy.orange.male.rabbit，即使有四个单词，也是匹配第二个队列的情况的。

```javascript
// 生产者
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

// 消费者
const amqp = require('amqp')
const conn = amqp.createConnection({host: 'localhost'})

const args = process.argv.slice(2)
if (args.length === 0) {
  args.push('info')
}

conn.on('error', (e) => {
  console.log(e)
})

conn.on('ready', () => {
  conn.exchange('topic_logs', { type: 'topic', durable: false }, (exchange) => {
    conn.queue('', { exclusive: true }, (queue) => {
      console.log(`Queue ${queue.name} is open`)
      
      args.forEach((arg) => queue.bind(exchange, arg, ()=> console.log('bind finish')))
      console.log(`bind to route: ${args}`)
          
      queue.subscribe({ack: false}, (message, headers, deliveryInfo, ack) => {
        console.log(`Got a message with from exchange: ${deliveryInfo.exchange}`)
        console.log(`route is: ${deliveryInfo.routingKey}, message is: ${message.data.toString()}`)
      })
    })
  })
})
```
