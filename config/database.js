const mongoose = require('mongoose')
const findOrCreate = require('mongoose-findorcreate')

require("dotenv").config()

const conn = process.env.DB_STRING

const connection = mongoose.createConnection(conn);

connection.on('connecting', () => {
  console.log('connected');
});


const UserSchema = new mongoose.Schema({
  username: String,
  hash: String,
  salt: String,
  googleId:String,
  facebookId:String
})

UserSchema.plugin(findOrCreate)

const User = connection.model("User", UserSchema)//no need to export, can excess it in mongoose.Model

module.exports = connection

