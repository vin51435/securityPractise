require('dotenv').config()
const express = require('express');
const ejs = require('ejs');
const { default: mongoose } = require('mongoose');
// const encrypt = require('mongoose-encryption');//?using md5
// const md5 = require("md5")//?using bcrypt
const bcrypt = require("bcryptjs")
const salt = bcrypt.genSaltSync(5);

const app = express();

app.use(express.static("public"))
app.set('view engine', 'ejs')
app.use(express.urlencoded({
  extended: true
}));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/securityPractiseUser")
  console.log("DB was connected")
}
main().catch(err => console.log("DB no connecte" + err))

const userSchema = new mongoose.Schema({
  email: String,
  password: String
})

// userSchema.plugin(encrypt,{secret:process.env.SECRET_KEY,encryptedFields:["password"]})
//?using md5

const User = mongoose.model("User", userSchema)

app.get("/", (req, res) => {
  res.render("home")
})

app.get("/login", (req, res) => {
  res.render("login")
})

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = (req.body.password);
  User.findOne({ email: username })
    .then(found => {
      if (bcrypt.compare(password, found.password)) {
        res.render("secrets")
      } else {
        res.send("Wrong password")
      }
    })
    .catch(err => console.log(err))
})


app.get("/register", (req, res) => {
  res.render("register")
})

app.post("/register", (req, res) => {
  bcrypt.hash(req.body.password, salt, function (err, hash) {
    const newUser = new User({
      email: req.body.username,
      password: hash
    })
    newUser.save()
      .then(() => {
        console.log("saved user")
        res.render("secrets")
      })
      .catch(err => console.log(err))
  })
})

app.listen(3000, (req, res) => {
  console.log("Server started on port 3000.");
})