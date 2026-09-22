import { WebSocket } from "ws";

async function testWithCookie() {
  console.log("Fetching cookie from www.quiktalks.com...");
  const res = await fetch("https://www.quiktalks.com/", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
  });
  const cookie = res.headers.get("set-cookie") || "";
  console.log("Got response status:", res.status, "Cookie:", cookie ? cookie.slice(0, 40) + "..." : "none");

  // Now connect to WebSocket with cookie
  const ws = new WebSocket("wss://www.quiktalks.com/ws?tz=UTC&lang=en", {
    headers: {
      "Cookie": cookie,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Origin": "https://www.quiktalks.com"
    }
  });

  ws.on("open", () => {
    console.log("SUCCESS! Connected to wss://www.quiktalks.com/ws with cookie!");
    ws.send(JSON.stringify({ type: "ping" }));
  });
  ws.on("message", (msg) => {
    console.log("Recv:", msg.toString());
    ws.close();
  });
  ws.on("error", (e) => {
    console.log("WS error:", e.message);
  });
}

testWithCookie();
