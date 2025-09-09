// utils/rabbitmq.js
import amqplib from "amqplib";

let channel = null;

export async function getChannel() {
  if (channel) return channel;

  const connection = await amqplib.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertQueue(process.env.EMAIL_QUEUE, { durable: true });
  return channel;
}

export async function sendToQueue(message) {
  try {
    const ch = await getChannel();
    ch.sendToQueue(process.env.EMAIL_QUEUE, Buffer.from(JSON.stringify(message)), { persistent: true });
    console.log("Message pushed to queue:", message);
  } catch (err) {
    console.error("RabbitMQ error:", err);
  }
}
