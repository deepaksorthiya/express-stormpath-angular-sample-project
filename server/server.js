'use strict';

var bodyParser = require('body-parser');
var express = require('express');
var path = require('path');
var stormpath = require('express-stormpath');

/**
 * Create the Express application.
 */
var app = express();

/**
 * The 'trust proxy' setting is required if you will be deploying your
 * application to Heroku, or any other environment where you will be behind an
 * HTTPS proxy.
 */
app.set('trust proxy',true);

/*
  We need to setup a static file server that can serve the assets for the
  angular application.  We don't need to authenticate those requests, so we
  setup this server before we initialize Stormpath.

 */

app.use('/',express.static(path.join(__dirname, '..', 'client'),{ redirect: false }));

/**
 * Now we initialize Stormpath, any middleware that is registered after this
 * point will be protected by Stormpath.
 */

console.log('Initializing Stormpath');

app.use(stormpath.init(app, {
  web: {

    // This produces option will disable the default HTML pages that express-stormpath
    // will serve, we don't need them because our Angular app is responsible for them.

    produces: ['application/json'],

    // This allows the /me endpoint to expose the user's custom data to the angular app

    me: {
      expand: {
        customData: true
      }
    }
  }
}));

/**
 * Now that our static file server and Stormpath are configured, we let Express
 * know that any other route that hasn't been defined should load the Angular
 * application.  It then becomes the responsibility of the Angular application
 * to define all view routes, and redirect to the home page if the URL is not
 * defined.
 */
app.route('/*')
  .get(function(req, res) {
    res.sendFile(path.join(__dirname, '..', 'client','index.html'));
  });

/**
 * We want to require authentication for our profile route, so we use the
 * authenticationRequired middleware to enforce this.
 */
app.post('/profile', stormpath.authenticationRequired, bodyParser.json(), require('./routes/profile'));

/**
 * Start the web server.
 */
app.on('stormpath.ready',function () {
  console.log('Stormpath Ready');
});

var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Application running at http://localhost:'+port);
});