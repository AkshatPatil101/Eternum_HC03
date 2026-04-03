const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(cors());
let activeClients = new Set();

wss.on("connection", (ws) => {
  console.log("Browser connected to WebSocket");
  activeClients.add(ws);

  ws.on("close", () => {
    activeClients.delete(ws);
    console.log("Browser disconnected");
  });
});

app.post("/dispatch-route", (req, res) => {
  const incomingData = req.body;
  console.log("Received HTTP Request. Preparing to forward to WebSocket...");

  res.status(202).json({ message: "Data received. Queuing for WebSocket push in 4s." });

  setTimeout(() => {
    const payload = JSON.stringify(incomingData);
    
    activeClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });

    console.log("Data pushed");
  }, 1000);
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket ready at ws://localhost:${PORT}`);
});