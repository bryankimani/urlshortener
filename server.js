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
  shortUrl: { type:String, required: true}
});


let Url;

Url = mongoose.model('Url', urlSchema);

app.use(cors());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))
 
// parse application/json
app.use(bodyParser.json());
app.use(bodyParser.raw());

app.engine('html', require('ejs').renderFile);

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/login', function(req, res) {
  res.sendFile(process.cwd() + '/views/sign-in.html');
});

app.get('/faqs', function(req, res) {
  res.sendFile(process.cwd() + '/views/faq.html');
});

app.get('/rates', function(req, res) {
  res.sendFile(process.cwd() + '/views/payout-rates.html');
});



app.get('/register', function(req, res) {
  res.sendFile(process.cwd() + '/views/sign-up.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


app.post('/api/shorturl', function(req, res) {

  function validURL(str) {
    var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
    if(!regex .test(str)) {
      return false;
    } else {
      return true;
    }
  };

  const submittedUrl = req.body.url;
  const isSubmittedUrlValid = validURL(submittedUrl);

  if (isSubmittedUrlValid) {
    // if valid, we create the url code
    Url.exists({longUrl: submittedUrl}, function(err, longUrlExists) {
      if (err) res.send({error : err});

      if (longUrlExists) {
        res.send({message: "Submitted URL exists"});
      } else {
        
        const shortUrlCode = shortid.generate();

        const url = new Url({longUrl: submittedUrl, shortUrl: shortUrlCode});
        console.log(shortUrlCode + " " + url);

        url.save(function(err, data) {
          if (err) {
            console.log(err);
            res.send({ error: err});
          }
          console.log(data);
          res.redirect('/urls');
        });
      }
    });
  } else {
    res.send({ error: 'invalid url' });
  }
});

app.get('/api/shorturl/:shortUrl/', function(req, res) {

  const submittedShortUrl = req.params.shortUrl;

  Url.findOne({shortUrl: submittedShortUrl}, function(err, result) {
      if (err) res.send({error : err});

      if(result !== null && result.longUrl !== null) {
        res.redirect(result.longUrl);
      } else {
        res.send({ error: "That shortUrl is not associated with any URL"});
      }
  });

});

app.get('/urls', function(req, res) {


  Url.find({}, function(err, results) {
      if (err) res.render(__dirname + '/views/url.html', {error : err});

      if(results !== null ) {
        console.log(results);
        res.render(__dirname  + '/views/url.html', {results});
      } else {
        res.render(__dirname  + '/views/url.html', { error: "That shortUrl is not associated with any URL"});
      }
  }).sort({_id: 'desc'});

});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
