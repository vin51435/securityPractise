// @you can refer express-session-authentication project (final-all-in-one branch)
const express = require("express");
const ejs = require("ejs");
const session = require("express-session");
var passport = require("passport");
const MongoStore = require("connect-mongo")

const connection = require("./config/database")
const User = connection.models.User;
const genPassword = require("./lib/passwordUtils").genPassword;
var routes = require("./routes");

require("dotenv").config()

const app = express();

app.use(express.json())
app.use(express.static("public"))
app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: true }));


require("./config/passport")// Need to require the entire Passport config module so app.js knows about it

const sessionStore = MongoStore.create({
  mongoUrl: process.env.DB_STRING,
  CollectionName: "session"
})

app.use(session({//@creating session middleware
  // secret: process.env.SECRET,
  secret: "process.env.SECRET",
  resave: false,
  saveUninitialized: true,
  store: sessionStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24
  }
}))

require("./config/passportOAuth")//google auth strategy
require("./config/passportOAuthFacebook")//facebook

//initializing passport, start using passport for authentication
app.use(passport.initialize());//@populates req.user if user present
app.use(passport.session());//@let passport use session ,both middlware connected


app.get("/", (req, res) => {
  res.render("home")
})

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));//scope inclues email and profile id

app.get('/auth/google/secrets',//needs to be exactly what you had in redirect uri in google api
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login", (req, res) => {
  res.render("login")
})

app.post("/login", passport.authenticate("local", { failureRedirect: "/login", successRedirect: "/secrets" }), (err, req, res, next) => {
  if (err) next(err);
});


app.get("/register", (req, res) => {
  res.render("register")
})

app.post("/register", function (req, res) {
  const saltHash = genPassword(req.body.password);

  const salt = saltHash.salt;
  const hash = saltHash.hash;

  const newUser = new User({
    username: req.body.username,
    hash: hash,
    salt: salt
  });
  newUser.save()
    .then((user) => {
      console.log(user);
    })
    .catch(err => {
      console.log("cannot save")
      res.send("error, cannot save")
    })
  res.redirect("/login");
});

app.get("/secrets", (req, res) => {
  User.find({ "secret": { $ne: null } })
  .then(found=>{ 
    res.render("secrets",{secrets:found})
  })
  .catch(err=>console.log(err))
})

app.get("/submit", (req, res) => {
  res.set(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0"
  );//clear cached data of the page
  if (req.isAuthenticated()) {
    res.render("submit")
  } else {
    res.redirect("/login")
    console.log("auth? " + req.isAuthenticated())
  }
})

app.post("/submit", (req, res) => {
  const submittedSecret = req.body.secret
  //find the current user and save the secret into their doc
  // passport saves user detail after login in req.user
  // console.log(req.user)
  User.findById(req.user.id)
    .then(found => {
      found.secret.push(submittedSecret)
      found.save().then(() => res.redirect("/secrets"))
    })
    .catch(err => console.log(err))
})

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect("/login");
  });
})

function errorHandler(err, req, res, next) {
  // if(err){
  //   res.send("<h1>There was an error</h1>")
  // }
  res.json({ err: err })
}
app.use(errorHandler)

app.listen(3000, (req, res) => {
  console.log("Server started on port 3000.");
})


//client id    783644874822-le1hf7calolcgj63ivrnv7ql7mb5c02n.apps.googleusercontent.com
//client secret     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