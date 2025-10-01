import { createServer } from 'http';
import crypto from 'crypto';
import { readFile } from 'fs/promises';
import path from 'path';

const PORT = 3002;
const DATA_FILE = path.join('data', 'link.json');
import { writeFile } from 'fs/promises';
const serveFile = async (res, filePath, contentType) => {
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch (error) {
    res.writeHead(404, { "Content-Type": contentType });
    res.end("<h1>404 Not Found</h1>");
  }
};
const loadLinks = async () => {
    try {
       const data =  await readFile(DATA_FILE, 'utf-8');
       if (data.trim() === '') {
           return {};
       }
       return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await writeFile(DATA_FILE, JSON.stringify({}));
            return {};
        }
        throw error;
    }
}
const saveLinks = async (links) => {
    await writeFile(DATA_FILE, JSON.stringify(links, null, 2));
}

const server = createServer(async (req, res) => {
  if (req.method === "GET") {
    if (req.url === "/") {
      // Serve index.html
      return serveFile(res, path.join("public", "index.html"), "text/html");
    } else if (req.url === "/style.css") {
      // Serve style.css
      return serveFile(res, path.join("public", "style.css"), "text/css");
    } else {
      // Handle short code redirects
      const shortCode = req.url.slice(1); // Remove leading '/'
      if (shortCode) {
        const links = await loadLinks();
        const originalUrl = links[shortCode];
        if (originalUrl) {
          res.writeHead(302, { Location: originalUrl });
          return res.end();
        } else {
          res.writeHead(404, { "Content-Type": "text/plain" });
          return res.end("Short code not found");
        }
      }
    }
  }

  if(req.method === "POST" && req.url === "/shorten") {
    const links = await loadLinks();
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
        console.log('Received data to shorten:', body);
        const { url, shortCode } = JSON.parse(body);
        if (!url) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "No URL provided" }));
        }
        let finalShortCode = shortCode || crypto.randomBytes(4).toString('hex');
        links[finalShortCode] = url;
        await saveLinks(links);
        console.log(`Shortened URL: ${url} to code: ${finalShortCode}`);

        // Respond with the shortened code
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ shortCode: finalShortCode }));
    });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
