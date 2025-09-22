require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('node:dns')

// Basic Configuration
const port = process.env.PORT || 3000;

let urls = {}

function checkUrl(url) {
  try{
    let parsedUrl = new URL(url)
    if(parsedUrl.protocol==='http:' || parsedUrl.protocol==='https:'){
      return true
    }
    else return false
  }
  catch(err){
    console.log(`Unexpected error: ${err}`)
  }
}

function random4Digit(){
  return Math.floor(1000 + Math.random() * 9000).toString()
}


app.use(express.urlencoded({extended: false}));
app.use(express.json())
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
  let url = req.body.url;
  console.log(url)
  if(checkUrl(url)){
    console.log(url)
    let shortUrl = random4Digit()
    urls[shortUrl] = url
    res.json({original_url: url, short_url: shortUrl})
  }
  else{
    console.log('Invalid URL')
    res.json({error: 'invalid url'})
  }
})

app.get('/api/shorturl/:shorturl', (req, res) => {
  let shorturl = req.params.shorturl;
  console.log(shorturl)
  if(urls[shorturl]){
    redirectUrl = urls[shorturl];
    dns.lookup(redirectUrl, () => {
      res.redirect(redirectUrl)
    });
  }
  else{
    res.json({
      error: "No short URL found for the given input"
    })
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
