const mongoose = require('mongoose')

const Schema = mongoose.Schema;
const exerciseUsers = new Schema({
  username: {type: String, required: true},
  exercise: [{
    description: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }]
});

//Convert User Schema into a Model
module.exports = exerciseUsers;