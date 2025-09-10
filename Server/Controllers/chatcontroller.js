import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function  chat(c){
  try {
    const body = await c.req.json();
    const { message } = body;

const response = await client.chat.completions.create({
  model: "llama-3.1-8b-instant", 
  messages: [{ role: "user", content: message }],
});



    return c.json({ reply: response.choices[0].message.content });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Something went wrong" }, 500);
  }

}