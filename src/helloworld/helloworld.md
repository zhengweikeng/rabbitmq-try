### 第一个事例hello world
该事例模拟了最简单的一种情况。队列消息的消费端（称之为消费者）监听一个队列。

队列消息的生产端（称之为生产者）会向该队列发送消息。

消费者在该队列上监听到有数据传来，便可以进行数据处理
```javascript
// comsumer.js
const amqp = require('amqp')
const util = require('util')
const conn = amqp.createConnection({host: 'localhost'})
conn.on('error', (e) => {
  console.log(e)
})

conn.on('ready', () => {
  console.log('ready!!')
  // 可以认为是建立了一条连接到该队列的通道
  // 还有一些其他的配置信息。后续例子再讲
  conn.queue('first-queue', (queue) => {
    console.log(`Queue ${queue.name} is open`)
    // 监听队列
    queue.subscribe((message, headers, deliveryInfo, messageObject) => {
      // 在这里面做消息处理
      console.log(`message: ${util.inspect(message)}`)
      console.log(`headers: ${util.inspect(headers)}`)
      console.log(`deliveryInfo: ${util.inspect(deliveryInfo)}`)
      console.log(`messageObject: ${util.inspect(messageObject)}`)
    })
  })
})

// producer.js
const amqp = require('amqp')
const conn = amqp.createConnection({host: 'localhost'})
conn.on('ready', () => {
  console.log('ready!!')
  // 该方法其实是向一个默认的exchange发送一条消息。
  // 当默认的exchange的值是空串''时，则以routeing key为名发送数据
  // 此时可以认为就是往队列名为routeing key发送数据
  conn.publish('first-queue', 'hello world')
})
```