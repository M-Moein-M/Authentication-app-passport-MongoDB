const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

// loading database
const { User, createUser } = require('../database');

router.get('/', isNotAuthenticated, (req, res) => {
  res.render('register', {
    isUserLogged: req.isAuthenticated(),
    username: req.isAuthenticated() ? req.user.username : null,
  });
});

router.post('/', isNotAuthenticated, (req, res) => {
  // this object will be used so that user don't have to fill the form from scratch
  const renderObj = { registerErrors: [] };

  if (req.body.password.length < 6) {
    renderObj.registerErrors.push('Password must be at least 6 characters!');
    renderObj.email = req.body.email; // we don't want the user to type the email again
    renderObj.username = req.body.username;
  }

  // checking for users with same username or email and also check for some other errors and then we add the new user
  User.findOne({ email: req.body.email }, (err, userFoundWithEmail) => {
    if (err) {
      console.log('Error in register post request');
      console.log(err);
      res.redirect('register');
    }

    // check if the input username is already exists
    User.findOne({ username: req.body.username }, (err, userFoundWithUsername) => {
      if (err) {
        console.log('Error in register post request');
        console.log(err);
        res.redirect('register');
      }

      if (userFoundWithEmail != null) {
        // there's an user with same email
        renderObj.registerErrors.push('This email already exists!');
        renderObj.email = null;
        renderObj.username = req.body.username;
        renderObj.isUserLogged = req.isAuthenticated();
        renderObj.username = req.isAuthenticated() ? req.user.username : null;
      }

      if (userFoundWithUsername != null) {
        // there's an user with same username
        renderObj.registerErrors.push('This username already exists!');
        renderObj.email = userFoundWithEmail ? null : req.body.email;
        renderObj.username = null;
      }
      // if we've some errors we show them to user
      if (renderObj.registerErrors.length != 0) {
        res.render('register', renderObj);
      } else {
        // inserting new user to database
        const { email, username, password } = req.body;

        // initialize new user
        const user = {
          email,
          username,
          password: bcrypt.hashSync(password, 10),
        };
        createUser(user);

        // show a confirmation alert and redirect the user to log-in to their account
        req.flash('appMsg', 'You may now sign-in with your account');
        res.render('login', {
          isUserLogged: req.isAuthenticated(),
          username: req.isAuthenticated() ? req.user.username : null,
        });
      }
    });
  });
});

// make sure user is not authenticated already
function isNotAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) next();
  else res.redirect('/');
}

module.exports = router;