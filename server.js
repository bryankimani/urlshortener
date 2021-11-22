require('dotenv').config();
const express = require('express');
const cors = require('cors');

const shortid = require('shortid');

const bodyParser = require('body-parser');
const dns = require('dns');

const app = express();


// Basic Configuration
const port = process.env.PORT || 3000;

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const { Schema } = mongoose;

const urlSchema = new Schema({
  longUrl: { type:String, required: true},
  shorUrl: { type:String, required: true}
});


let Url;

Url = mongoose.model('Url', urlSchema);

app.use(cors());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))
 
// parse application/json
app.use(bodyParser.json());
app.use(bodyParser.raw());


app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


app.post('/api/shorturl', function(req, res) {

  const submittedUrl = req.body.url;

  dns.resolve(submittedUrl, (err, value) => { 
    if(err) { 
        console.log(err); 
        res.send({ error: 'invalid url' }) 
    } 

    let urlExists = Url.findOne({longUrl: submittedUrl});

    if (urlExists) {
      res.send(urlExists) 
    } else {
      // if valid, we create the url code
      const shortUrlCode = shortid.generate();

      const url = new Url({submittedUrl,shortUrlCode});
      url.save(function(err, data) {
        if (err) {
          res.send({ error: err});
          done(err);
        }
        res.send({ original_url: submittedUrl, short_url: shortUrlCode});
        done(null, data);
      });
       
    }
  }) 
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
