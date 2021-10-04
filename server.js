const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const exerciseUsers = require('./models/user.js');
const mongodb = require('mongodb')
const mongoose = require('mongoose')
require('dotenv').config({ path: '.env' })
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("Mongodb connected...")
})
.catch(error => console.error(error));
app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//Convert User Schema into a Model
const ExerciseUsers = mongoose.model('ExerciseUsers', exerciseUsers);

//Create New User
const createUser = (username, done) => {
  ExerciseUsers.create({username: username}, (err, data) => {
    if(err) done(err);
    done(null, data);
  });
};

//Post New User
app.post('/api/users', (req, res) => {
  let username = req.body.username;
  createUser(username, (err, data) => {
    if(err){
      res.send("Some error occured");
    } 
    res.send({username: data.username, _id: data._id});
  })
});

//Get all users
app.get('/api/users', (req, res) => {
  ExerciseUsers.find({}).select('username _id').exec((err, data) => {
    if(err) console.log(err);
    res.send(data);
  })
})

///Add Exercise
app.post('/api/users/:_id/exercises', (req, res) => {
  
  let { description, duration } = req.body
  const userId = req.params._id 
  console.log(userId);
  console.log(duration)
  
  ExerciseUsers.findByIdAndUpdate({_id: userId}, {
    $push: {
      exercise: {
        description: description,
        duration: Number(duration),
        date: req.body.date ?
        new Date(req.body.date).toDateString() :
        new Date().toDateString()
      }
    }
  }, {new: true}, (err, data) => {
    if(!userId || !description || !duration){
      res.send("Please all fields correctly")
    }
    if(err) {
      res.send("error");
    } if(data!==null) {
      res.json({
        username: data.username,
        description: description,
        duration: Number(duration),
        _id: data._id,
        date: req.body.date ?
        new Date(req.body.date).toDateString() :
        new Date().toDateString(),
       
      });
    }
    else{
      res.send("Please all fields correctly.")
    }
  })
})

//Retrieve users exercise data
app.get('/api/users/:_id/logs', (req, res) => {
  let userId = req.params._id;  
  let from = req.query.from !== undefined ? new Date(req.query.from) : null
  let to = req.query.to !== undefined ? new Date(req.query.to) : null
  let limit = parseInt(req.query.limit)
  
  ExerciseUsers.findOne({_id: userId}, (err, data) => {
    
    let count = data.exercise.length;
    
    if(data == null) {
      res.send("User not found")
    } else {
      if(from && to) {
        res.send({
          _id: userId,
          username: data.username,
          count: limit || count,
          log: data.exercise.filter(e => e.date >= from && e.date <= to)
                            .slice(0, limit || count)
        })
      } else {
        res.send({
          _id: userId,
          username: data.username,
          count: limit || count,
          log: data.exercise.slice(0, limit || count)
        })
      }
    }
  })
});

const deleteAllDocs = () => {
  ExerciseUsers.remove({}, (err, data) => {
    if(err) console.log(err);
    console.log("All users were deleted");
  })
}
// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

/*const callback = (err, data) => {
    err ? console.log(err) : console.log(data);
  }*/
