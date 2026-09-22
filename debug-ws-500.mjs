import https from "https";

const req = https.request("https://www.quiktalks.com/ws", {
  method: "GET",
  headers: {
    "Connection": "Upgrade",
    "Upgrade": "websocket",
    "Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ==",
    "Sec-WebSocket-Version": "13",
    "Host": "www.quiktalks.com",
    "Origin": "https://www.quiktalks.com"
  }
}, (res) => {
  console.log("Status:", res.statusCode, res.statusMessage);
  console.log("Headers:", JSON.stringify(res.headers, null, 2));
  let data = "";
  res.on("data", (chunk) => { data += chunk; });
  res.on("end", () => {
    console.log("Body:", data);
  });
});

req.on("error", (e) => {
  console.error("Req error:", e);
});

req.end();
