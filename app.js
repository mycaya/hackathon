/**
 * Module dependencies.
 */
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');
const multer = require('multer');
const https = require('https');
const fs = require('fs');

//Framework to display a web page
var app = express();
const router = express.Router();
require('dotenv').config()

var mongo = require('mongodb').MongoClient;

const upload = multer({ dest: path.join(__dirname, 'uploads') });

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: '.env.example' });

/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const userController = require('./controllers/user');
const apiController = require('./controllers/api');
const contactController = require('./controllers/contact');

/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');


/**
 * Connect to MongoDB.
 */
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

/**
 * Express configuration.
 */
app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 80);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(expressStatusMonitor());
app.use(compression());
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public')
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  cookie: { maxAge: 1209600000 }, // two weeks in milliseconds
  sessionid: Math.random(),
  store: new MongoStore({
    url: process.env.MONGODB_URI,
    autoReconnect: true,
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
/*app.use((req, res, next) => {
  if (req.path === '/api/upload') {
    // Multer multipart/form-data handling needs to occur before the Lusca CSRF check.
    next();
  } else {
    lusca.csrf()(req, res, next);
  }
}); */
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user
    && req.path !== '/login'
    && req.path !== '/signup'
    && !req.path.match(/^\/auth/)
    && !req.path.match(/\./)) {
    req.session.returnTo = req.originalUrl;
  } else if (req.user
    && (req.path === '/account' || req.path.match(/^\/api/))) {
    req.session.returnTo = req.originalUrl;
  }
  next();
});
app.use('/', express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/chart.js/dist'), { maxAge: 31557600000 }));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/popper.js/dist/umd'), { maxAge: 31557600000 }));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js'), { maxAge: 31557600000 }));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/jquery/dist'), { maxAge: 31557600000 }));
app.use('/webfonts', express.static(path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free/webfonts'), { maxAge: 31557600000 }));

//Redirect all traffic to login untill ADFS federation
app.get('/', (req, res) => {
  res.redirect('/memes');
});

app.use(express.static('public'));

//Pages
const home = require('./pages/home/home');
app.use('/', home);

const memes = require('./pages/memes/memes');
app.use('/', memes);

const test = require('./pages/test/test');
app.use('/', test);

const s3 = require('./pages/s3/s3');
app.use('/', s3);

const seo = require('./pages/seo/seo');
app.use('/', seo);

const login = require('./pages/login/login');
app.use('/', login);

const infinite = require('./pages/infinite/infinite');
app.use('/', infinite);

const scroll = require('./pages/scroll/scroll');
app.use('/', scroll);

//APIs

const fileupload = require('./apis/fileupload');
app.use('/', fileupload);

//const upload = require('./apis/fileupload');
//app.use('/', upload);

const memeshot = require('./apis/memeshot');
app.use('/memeshot', memeshot);

const moar = require('./apis/moar');
app.use('/', moar);

const nsfw = require('./apis/nsfw');
app.use('/', nsfw);

app.use(bodyParser.urlencoded())
app.use(bodyParser.json())
app.post('/catchr', function (req, res, next) {
    console.log('Hit catchr: '+(req.body));
    //res.send('Hit catchr: '+(JSON.stringify(req.body)));
    res.send('Hit catchr: '+ JSON.stringify(req.body));
})

//var router = require('express').Router();
app.post('/memeshot', function (req, res, next) {
    console.log('memeshot: '+(JSON.stringify(req.body)));
    const limit = parseInt(req.body.limit) || 4;
    const skip = parseInt(req.body.skip) || 0;

    // Switch - 1 equals No Dupe is On
    const nodup = 1;

    const url = 'mongodb://localhost:27017'
    mongo.connect(url, (err, client) => {
        if (err) {
            console.error(err)
            }
            const db = client.db('figeur')
            const memes = db.collection('memes')
            const memeshot = db.collection('memeshot')
            const sessions = db.collection('session')

            //If we're using No Duplicates..
            if (nodup==1){
              //Ensure User has a 'seen' array
                sessions.updateOne(
                  { sessionid: (req.body.sessionid), "seen.0": { "$exists": false } },
                  { "$set": { "seen": [] } }
              )
              //Grab their Duplicates
              sessions.findOne({sessionid: (req.body.sessionid)}, function (err, result){
                if (result) {
                }
                exclude = result.seen;

                //Exclude seen and fetch next set of _ids
                memes.find({ "_id": {"$nin": exclude}}).sort({created_on:-1}).skip(skip).limit(limit).project( {_id: 1} ).map(x => x._id).toArray((err, items) => {

                  //Push next set of _ids to 'seen' array
                  sessions.updateOne(
                    {sessionid: (req.body.sessionid)},
                    { $push:{ seen: { $each: items } }}
                    );
                    
                    //Fetch the images in that set of _ids and send to browser
                    memes.find({ "_id": {"$in": items}}).sort({created_on:-1}).toArray((err, items) => {
                    res.send(JSON.stringify(items));
                    });
                });
              });
              
//Increment master counter
memeshot.updateOne(
      { loads: 'loads' },
      { $inc:{ memeshot: 1 }}
   );
//Increment user-specific counter   
memeshot.findOne({sessionid: (req.body.sessionid)}, (err, match) => {
if(match){
   memeshot.updateOne(
      { sessionid: req.body.sessionid },
      { $inc:{ memeshot: 1 }}
   )
  }else{
   memeshot.insertOne(
      { sessionid: req.body.sessionid },
      { $inc:{ memeshot: 1 }}
   )
  };
});

//If including Duplicates
}else{

memes.find().sort({created_on:-1}).skip(skip).limit(limit).toArray((err, items) => {
res.send(JSON.stringify(items));
});

memeshot.updateOne(
      { loads: 'loads' },
      { $inc:{ memeshot: 1 }}
   );
memeshot.findOne({sessionid: (req.body.sessionid)}, (err, match) => {
if(match){
   memeshot.updateOne(
      { sessionid: req.body.sessionid },
      { $inc:{ memeshot: 1 }}
   )
  }else{
   memeshot.insertOne(
      { sessionid: req.body.sessionid },
      { $inc:{ memeshot: 1 }}
   )
  };
});

//Close Else/Dupe  
}
//Close Mongo Connect
});
//Close POST call
})


app.post('/moar', function (req, res, next) {
  console.log('moar: '+(req.body));
 //res.send('Hit catchr: '+(JSON.stringify(req.body)));

 const url = 'mongodb://localhost:27017'
 mongo.connect(url, (err, client) => {
   if (err) {
       console.error(err)
       }
   const db = client.db('figeur')
   const collection = db.collection('likes')
           let doc = {
            _id: _id
           };
           console.log(doc);
           collection.insert(doc, (err, doc) => {
           //res.json(doc);
           });
});
});

/**
 * Primary app routes.
 */
//app.get('/', homeController.index);
app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.get('/contact', contactController.getContact);
app.post('/contact', contactController.postContact);
app.get('/account/verify', passportConfig.isAuthenticated, userController.getVerifyEmail);
app.get('/account/verify/:token', passportConfig.isAuthenticated, userController.getVerifyEmailToken);
app.get('/account', passportConfig.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);

/**
 * API examples routes.
 */
app.get('/api', apiController.getApi);
app.get('/api/lastfm', apiController.getLastfm);
app.get('/api/nyt', apiController.getNewYorkTimes);
app.get('/api/steam', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getSteam);
app.get('/api/stripe', apiController.getStripe);
app.post('/api/stripe', apiController.postStripe);
app.get('/api/scraping', apiController.getScraping);
app.get('/api/twilio', apiController.getTwilio);
app.post('/api/twilio', apiController.postTwilio);
app.get('/api/clockwork', apiController.getClockwork);
app.post('/api/clockwork', apiController.postClockwork);
app.get('/api/foursquare', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFoursquare);
app.get('/api/tumblr', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTumblr);
app.get('/api/facebook', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFacebook);
app.get('/api/github', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getGithub);
app.get('/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTwitter);
app.post('/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postTwitter);
app.get('/api/instagram', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getInstagram);
app.get('/api/paypal', apiController.getPayPal);
app.get('/api/paypal/success', apiController.getPayPalSuccess);
app.get('/api/paypal/cancel', apiController.getPayPalCancel);
app.get('/api/lob', apiController.getLob);
//app.get('/api/upload', lusca({ csrf: true }), apiController.getFileUpload);
//app.post('/api/upload', upload.single('myFile'), lusca({ csrf: true }), apiController.postFileUpload);
app.get('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getPinterest);
app.post('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postPinterest);
app.get('/api/here-maps', apiController.getHereMaps);
app.get('/api/google-maps', apiController.getGoogleMaps);
//app.get('/api/google/drive', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getGoogleDrive);
app.get('/api/chart', apiController.getChart);
//app.get('/api/google/sheets', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getGoogleSheets);
app.get('/api/quickbooks', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getQuickbooks);

/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/auth/instagram', passport.authenticate('instagram', { scope: ['basic', 'public_content'] }));
app.get('/auth/instagram/callback', passport.authenticate('instagram', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/snapchat', passport.authenticate('snapchat'));
app.get('/auth/snapchat/callback', passport.authenticate('snapchat', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));
/* app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
}); */
app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/' }));

app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], accessType: 'offline', prompt: 'consent' }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});

/**
 * OAuth authorization routes. (API examples)
 */
app.get('/auth/foursquare', passport.authorize('foursquare'));
app.get('/auth/foursquare/callback', passport.authorize('foursquare', { failureRedirect: '/api' }), (req, res) => {
  res.redirect('/api/foursquare');
});
app.get('/auth/tumblr', passport.authorize('tumblr'));
app.get('/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/api' }), (req, res) => {
  res.redirect('/api/tumblr');
});
app.get('/auth/steam', passport.authorize('openid', { state: 'SOME STATE' }));
app.get('/auth/steam/callback', passport.authorize('openid', { failureRedirect: '/api' }), (req, res) => {
  res.redirect(req.session.returnTo);
});
app.get('/auth/pinterest', passport.authorize('pinterest', { scope: 'read_public write_public' }));
app.get('/auth/pinterest/callback', passport.authorize('pinterest', { failureRedirect: '/login' }), (req, res) => {
  res.redirect('/api/pinterest');
});
app.get('/auth/quickbooks', passport.authorize('quickbooks', { scope: ['com.intuit.quickbooks.accounting'], state: 'SOME STATE' }));
app.get('/auth/quickbooks/callback', passport.authorize('quickbooks', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo);
});

/**
 * Error Handler.
 */
if (process.env.NODE_ENV === 'development') {
  // only use in development
  app.use(errorHandler());
} else {
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Server Error');
  });
}

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');
});

module.exports = app;
module.exports = router;