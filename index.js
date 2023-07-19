require('dotenv').config('.env');
const cors = require('cors');
const express = require('express');
const app = express();
const morgan = require('morgan');
const { PORT = 3000 } = process.env;
// TODO - require express-openid-connect and destructure auth from it

const { User, Cupcake } = require('./db');

// middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));

/* *********** YOUR CODE HERE *********** */
// follow the module instructions: destructure config environment variables from process.env
// follow the docs:
  // define the config object
  // attach Auth0 OIDC auth router
  // create a GET / route handler that sends back Logged in or Logged out
  const { auth } = require('express-openid-connect');

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: 'AUTH0_SECRET',
  baseURL: 'http://localhost:3000',
  clientID: 'AUTH0_CLIENT_ID',
  issuerBaseURL: 'https://dev-wcs41l236uyz3vjg.us.auth0.com'
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// req.isAuthenticated is provided from the auth router
app.get('/', (req, res) => {
  console.log(req.oidc.user); 
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});


app.get('/', (req, res) => {
  const isAuthenticated = req.oidc.isAuthenticated();
  const user = req.oidc.user;

  let html = '<html><body>';
  if (isAuthenticated) {
    html += `<h1>Welcome, ${user.name}!</h1>`;
    html += `<p>Email: ${user.email}</p>`;
  } else {
    html += '<h1>Please log in to access this page</h1>';
  }
  html += '</body></html>';

  res.send(html);
});

app.get('/cupcakes', async (req, res, next) => {
  try {
    const cupcakes = await Cupcake.findAll();
    res.send(cupcakes);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

const findOrCreateUser = (req, res, next) => {
  const { username, name, email } = req.oidc.user;
  User.findOrCreate({
    where: { username },
    defaults: { name, email }
  })
    .then(([user, created]) => {
      req.user = user;
      next();
    })
    .catch((error) => {
      console.error('Error finding or creating user:', error);
      next(error);
    });
};
app.use('/auth', auth(config), findOrCreateUser);



// error handling middleware
app.use((error, req, res, next) => {
  console.error('SERVER ERROR: ', error);
  if(res.statusCode < 400) res.status(500);
  res.send({error: error.message, name: error.name, message: error.message});
});

app.listen(PORT, () => {
  console.log(`Cupcakes are ready at http://localhost:${PORT}`);
});

