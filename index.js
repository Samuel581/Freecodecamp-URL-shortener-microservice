require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dns = require("node:dns");
const { MongoClient } = require("mongodb");

// Express configuration
const app = express();
const port = process.env.PORT || 3000;

// Mongo DB configuration
const client = new MongoClient(process.env.DB_URL);
const database = client.db("urlshortener");
var urls = database.collection("urls");

// Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors({ origin: "*" }));

function hasProtocolHTTP(rawUrl) {
  try {
    const { protocol } = new URL(rawUrl);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.get("/api/hello", (req, res) => {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", async (req, res) => {
  console.log(req.body);
  const url = req.body.url;
  // Validate protocol first
  if (!hasProtocolHTTP(url)) {
    return res.json({ error: "invalid url" });
  }

  try {
    // Convert dns.lookup to Promise to avoid callback hell
    const hostname = new URL(url).hostname;

    await new Promise((resolve, reject) => {
      dns.lookup(hostname, (err, address) => {
        if (err || !address) {
          reject(new Error("Invalid hostname"));
        } else {
          resolve(address);
        }
      });
    });

    const urlCount = await urls.countDocuments();
    const shortUrl = urlCount + 1; // Start from 1, not 0

    const urlDoc = {
      url,
      short_url: shortUrl,
    };

    await urls.insertOne(urlDoc);
    res.json({ original_url: url, short_url: shortUrl });
  } catch (error) {
    return res.json({ error: "invalid url" });
  }
});

app.get("/api/shorturl/:shorturl", async (req, res) => {
  const shorturl = req.params.shorturl;
  const urlDoc = await urls.findOne({ short_url: +shorturl });
  res.redirect(urlDoc.url);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
