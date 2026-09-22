import { WebSocket } from "ws";

async function testAppUrl() {
  console.log("Attempting WebSocket connection to app URL...");
  const ws = new WebSocket("wss://ais-pre-cs2t53fqk2t2p2i2smns7y-744138412938.asia-east1.run.app/ws?tz=UTC&lang=en");
  ws.on("open", () => {
    console.log("App URL: Connected!");
    ws.close();
  });
  ws.on("error", (e) => {
    console.log("App URL WS Error:", e.message);
  });
}
testAppUrl();
