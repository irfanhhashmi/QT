import { WebSocket } from "ws";

async function testWssConnection() {
  console.log("Attempting WebSocket connection to wss://www.quiktalks.com/ws ...");
  
  try {
    const ws = new WebSocket("wss://www.quiktalks.com/ws?tz=UTC&lang=en", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Origin": "https://www.quiktalks.com"
      }
    });

    ws.on("open", () => {
      console.log("SUCCESS! Connected to wss://www.quiktalks.com/ws");
      ws.send(JSON.stringify({ type: "ping" }));
    });

    ws.on("message", (data) => {
      console.log("RECV from server:", data.toString());
      setTimeout(() => {
        ws.close();
      }, 1000);
    });

    ws.on("error", (err) => {
      console.error("WS ERROR:", err);
    });

    ws.on("close", (code, reason) => {
      console.log(`WS CLOSED: code=${code}, reason=${reason.toString()}`);
    });
  } catch (err) {
    console.error("Exception connecting:", err);
  }
}

testWssConnection();
