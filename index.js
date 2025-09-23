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
app.use(cors());

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

app.post("/api/shorturl", (req, res) => {
  console.log(req.body);
  const url = req.body.url;
  // Validate protocol first
  if (!hasProtocolHTTP(url)) {
    return res.json({ error: "invalid url" });
  }

  dns.lookup(new URL(url).hostname, async (err, address) => {
    if (err || !address) {
      return res.json({ error: "invalid url" });
    }

    const urlCount = await urls.countDocuments();
    const urlDoc = {
      url,
      short_url: urlCount,
    };
    const results = await urls.insertOne(urlDoc);
    console.log(results);
    res.json({ original_url: url, short_url: urlCount });
  });
});

app.get("/api/shorturl/:shorturl", async (req, res) => {
  const shorturl = req.params.shorturl;
  const urlDoc = await urls.findOne({ short_url: +shorturl });
  res.redirect(urlDoc.url);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
