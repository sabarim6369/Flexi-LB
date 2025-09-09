import amqplib from "amqplib";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,  // your Gmail address
    pass: process.env.MAIL_PASS,  // app password if 2FA enabled
  },
});

async function startConsumer() {
  const connection = await amqplib.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue(process.env.EMAIL_QUEUE, { durable: true });
  console.log("Email service listening...");

  channel.consume(process.env.EMAIL_QUEUE, async (msg) => {
    if (!msg) return;
    const { to, subject, template, context } = JSON.parse(msg.content.toString());

    // Simple text rendering based on template
    let text = "";
    if (template === "serverDown") {
      text = `Hi ${context.username},\n\nServer ${context.serverName} is down. Please check immediately.`;
    } else if (template === "performanceAlert") {
      text = `Hi ${context.username},\n\nPerformance alert: ${context.details}`;
    } else if (template === "weeklyReport") {
      text = `Hi ${context.username},\n\nHere is your weekly report: ${context.summary}`;
    }

    try {
      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to,
        subject,
        text,
      });
      console.log(`Email sent to ${to} for template ${template}`);
      channel.ack(msg); // mark message as processed
    } catch (err) {
      console.error("Failed to send email:", err);
      // optionally retry: channel.nack(msg, false, true)
    }
  });
}

startConsumer();
