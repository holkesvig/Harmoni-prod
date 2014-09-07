// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express'); 		// call express
var app        = express(); 				// define our app using express
var bodyParser = require('body-parser');
var Firebase = require("firebase");

var echojs = require('echojs');

var echo = echojs({
  key: "67JMF0LHR3LLSLUSB"
});

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080; 		// set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router(); 				// get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
	
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
	next(); // make sure we go to the next routes and don't stop here
});

router.route('/create')
	.get(function(req, res) {
		// http://developer.echonest.com/docs/v4/song.html#search
		echo('playlist/dynamic/create').get({
		  artist: req.query.artist,
		  type: "artist-radio",
		  results: "1",
		  bucket: 'id:spotify',
		  limit: "true"
		}, function (err, json) {
		  res.send({session_id: json.response.session_id, song: json.response.songs[0]});

		  // console.log(json.response);

		  var roomRef = new Firebase('https://mhacks-iv.firebaseio.com/room-metadata');
		  var groupRef = roomRef.child('-JWCZSCw98UxfdzulHSB');
		  groupRef.update({
		  	session_id: json.response.session_id,
		  	currentSong: json.response.songs[0]
		  });

		});
	});

router.route('/nextSong')
	.get(function(req, res) {
		// http://developer.echonest.com/docs/v4/song.html#search
		 echo('playlist/dynamic/next').get({
		  session_id: req.query.session_id,
		  results: "1",
		  lookahead: "5"
		}, function (err, json) {
			res.send({songs: json.response.songs, lookahead: json.response.lookahead});
		});
	});

router.route('/peak')
	.get(function(req, res) {
		// http://developer.echonest.com/docs/v4/song.html#search
		 echo('playlist/dynamic/next').get({
		  session_id: req.query.session_id,
		  results: "0",
		  lookahead: "5"
		}, function (err, json) {
			res.send({songs: json.response.songs, lookahead: json.response.lookahead});
		});
	});

router.route('/vote')
	.get(function(req, res) {
		// http://developer.echonest.com/docs/v4/song.html#search
		if(req.query.vote) {
			echo('playlist/dynamic/feedback').get({
			  session_id: req.query.session_id,
			  favorite_song: "last",
			  favorite_artist: "last"
			}, function (err, json) {
				res.send({response: json.response});
			});
		} else {
			echo('playlist/dynamic/feedback').get({
			  session_id: req.query.session_id,
			  ban_song: "last"
			}, function (err, json) {
				res.send({response: json.response});
			});
		}
	});

router.route('/info')
	.get(function(req, res) {
		// http://developer.echonest.com/docs/v4/song.html#search
		echo('playlist/dynamic/info').get({
		  session_id: req.query.session_id
		}, function (err, json) {
			res.send({response: json.response});
		});
	});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
	res.json({ message: 'hooray! welcome to our api!' });	
});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);