### Routing
之前我们是将消息广播出去，连接到同一个exchange的消费者都将收取到消息。

可是有时我们的消息可能只需要让部分特殊的消费者收到。例如我们处理日志，error类型的日志可能会写到文件，info的日志可能就直接打印到控制台。

此时exchange的路由功能就可以帮助我们达到这个目的，而此时exchange的类型就不是fanout了，我们可以用direct。

direct类型的exchange将会把我们的消息发送到绑定这个路由的队列中去。

#### 生产者推送消息
```javascript
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
```
这里exchange在发布消息的时候，配上了第一个参数便是routingKey，即我们的路由值。

这样便会往指定的路由发送消息了。

#### 消费者获取消息
```javascript
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
  conn.exchange('direct_logs', { type: 'direct', durable: false }, (exchange) => {
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
代码和之前的没什么区别，主要是我们会循环绑定队列到多个路由上。注意bind的最后一个回调函数，虽然我们bind会被调用多次，但是该回调函数只会被调用一次，即只会被最后一次bind的时候调用一次。

运行代码：
```bash
node consumer.js error warn
# Queue amq.gen-pop_p221GJ2PPg9RTC424g is open
# bind to route: error,warn
# bind finish

node consumer.js
# Queue amq.gen-98mCQ9HHQfNsDukBup0goA is open
# bind to route: info
# bind finish

node producer.js  info "it is a info"
node producer.js  error "it is an error"
node producer.js  warn "it is a warn"
```

#### fanout和direct的相互转化
也可以将direct转化为fanout，只要将每个队列都绑定相同的路由routing_key即可实现。
```javascript
// productor
const exchange = conn.exchange('direct_logs', {
  type: 'direct',
  durable: false
})
  
exchange.publish('key', msg, {})

// consumer
queue.bind(exchange, 'key')
```
