// Send users to index.html
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const interfaces = os.networkInterfaces();
let hostname = "127.0.0.1";

for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) {
            hostname = iface.address;
            break;
        }
    }
    if (hostname !== "127.0.0.1") break;
}
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    let filePath = path.join(
        __dirname,
        "public",
        req.url === "/" ? "index.html" : req.url
    );

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end("404 Not Found");
        } else {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(content);
        }
    });
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
