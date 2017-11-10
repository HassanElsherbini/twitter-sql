'use strict';
var express = require('express');
var router = express.Router();
const client = require('../db/index')

module.exports = function makeRouterWithSockets(io) {
  function respondWithAllTweets(req, res, next) {
    let query = `
      SELECT users.name, tweets.content, tweets.id FROM tweets
      JOIN users ON users.id = tweets.user_id
    `
    client.query(query, function (err, result) {
      if (err) return next(err) // pass errors to Express
      var tweets = result.rows
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true })
    })
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function (req, res, next) {
    let query = `
      SELECT users.name, tweets.content, tweets.id FROM users
      JOIN tweets ON users.id = tweets.user_id
      WHERE users.name=$1;
    `
    client.query(query, [req.params.username], function (err, result) {
      if (err) return next(err) // pass errors to Express
      var tweets = result.rows
      res.render('index',
        { name: req.params.username, tweets, showForm: true })
    })
  })

  // single-tweet page
  router.get('/tweets/:id', function (req, res, next) {

    let query = `
      SELECT users.name, tweets.content, tweets.id FROM tweets
      JOIN users ON users.id = tweets.user_id
      WHERE tweets.id=$1;
    `
    client.query(query, [req.params.id]
      , function (err, result) {
        if (err) return next(err) // pass errors to Express
        var tweets = result.rows
        res.render('index',
          { title: req.param.username + " 's tweets", tweets, showForm: true })
      })
  })

  // create a new tweet
  router.post('/tweets', function (req, res, next) {

    var addNewUser = function(){
      let addUser = `INSERT INTO users
      (name, picture_url)
      VALUES
      ($1, 'https://pbs.twimg.com/profile_images/2450268678/olxp11gnt09no2y2wpsh_normal.jpeg');`;
      client.query(addUser, [req.body.name]
        , function (err, result2){
          if (err) return next(err);
        });
    };

    var addNewTweet = function(err, data){
      if(err) return next(err);

      let addTweet = `INSERT INTO tweets
      (user_id, content)
      VALUES
      ($1, $2);`;
      client.query(addTweet, [data.rows[0].id, req.body.content]
        , function (err, data){
          if (err) return next(err);
          res.redirect('back');
        });
    };
    // check if user existsd
    let checkIfExists = `SELECT * FROM users WHERE name = $1;`;

    client.query(checkIfExists, [req.body.name]
      , function (err, result) {

        if (err) return next(err); // pass errors to Express
        // if user exists: add the tweet
        if (result.rows.length){
            addNewTweet(null, result);
        } else {
          let imgUrl = 'https://pbs.twimg.com/profile_images/2450268678/olxp11gnt09no2y2wpsh_normal.jpeg';
          let addUser = `INSERT INTO users (name, picture_url) VALUES ($1, $2) Returning id;`;
          client.query(addUser, [req.body.name, imgUrl], addNewTweet);
        }


      });
  });

    // let query = `
    //   SELECT users.name, tweets.content, tweets.id FROM tweets
    //   JOIN users ON users.id = tweets.user_id
    //   WHERE tweets.id=$1;
    // `
    // client.query(query, [req.params.id], function (err, result) {
    //     if (err) return next(err) // pass errors to Express
    //     const newTweet = result.rows
    // io.sockets.emit('new_tweet', newTweet)
   // res.redirect('/')
    // })


  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
