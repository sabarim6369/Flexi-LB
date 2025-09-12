import express from "express";

const app = express();
const PORT = 4001;

app.get("/", (req, res) => {
  res.json({
    server: "Server 1",
    message: "Hello from Server 1 🚀",
    
    time: new Date().toISOString(),

    
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server 1 running on http://localhost:${PORT}`);
});
