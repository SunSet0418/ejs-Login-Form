var fs = require('fs')
var ejs = require('ejs')
var mongoose = require('mongoose')
var express = require('express')
var bodyParser = require('body-parser')
var session = require('express-session')
var schema = mongoose.Schema;
var app = express();

app.use(bodyParser.urlencoded({
  extended: true
}))

app.use(session({
  secret: 'secret key',
  resave: false,
  saveUninitialized: true,
  cookie:{
    maxAge: 1000 * 60 * 60
  }
}))

mongoose.connect("mongodb://localhost/ejs-login-form", function(err){
  if(err){
    console.log("DB Error")
    throw err
  }
})

var UserSchema = new schema({
  username: {
    type: String
  },
  email: {
    type: String
  },
  id: {
    type: String
  },
  password: {
    type: String
  }
})

var MemoSchema = new schema({
  email: {
    type: String
  },
  index: {
    type: String
  }
})

var User = mongoose.model('user', UserSchema)
var Memo = mongoose.model('memo', MemoSchema)

app.listen(3000, function(){
  console.log("Server Running at 3000 Port")
})

app.get('/', function (req, res){
  fs.readFile('index.ejs', 'utf-8', function(err, data){
    res.end(ejs.render(data, {
      username: req.session.username
    }))
  })
})

app.get('/login', function(req, res){
  fs.readFile('login.html', 'utf-8', function(err, data){
    res.send(data)
  })
})

app.post('/login', function(req, res){
  var body = req.body;
  User.findOne({
    id: body.id
  }, function(err, result){
    if(err){
      console.log('/login post Error')
      throw err
    }
    if(result){
      if(result.password == body.password){
        req.session.user_id = result.id;
        req.session.email = result.email;
        req.session.username = result.username;
        req.session.password = result.password;
        console.log('Username : '+req.session.username)
        console.log('ID : '+req.session.user_id)
        console.log('Password : '+req.session.password)
        console.log('Login Success '+result.username)
        res.redirect('/main')
      }
      else if(result.password != body.password){
        res.redirect('/')
      }
    }
    else {
      console.log("로그인 실패")
      res.redirect('/')
    }
  })
})

app.get('/insert', function(req, res){
  fs.readFile('insert.html', 'utf-8', function(err, data){
    res.send(data)
  })
})

app.post('/insert', function(req, res){
  var body = req.body;
  user = new User({
    username: body.username,
    email: body.email,
    id: body.id,
    password: body.password
  })

  User.findOne({
    id: body.id
  }, function(err, result){
    if(err){
      console.log("/insert Error")
      throw err
    }
    if(result){
      res.redirect('/')
    }
    else {
      user.save(function(err){
        if(err){
          console.log("save Error")
          throw err
        }
        else {
          console.log(body.username+" save success")
          res.redirect('/')
        }
      })
    }
  })
})

app.get('/delete', function(req, res){
  fs.readFile('remove.html', 'utf-8', function(err, data){
    res.send(data)
  })
})

app.post('/delete', function(req, res){
  var body = req.body;

  User.findOne({
    id: body.id
  }, function(err, result){
    if(err){
      console.log('/delete POST Error')
      throw err
    }
    if(result){
      User.remove({id: body.id}, function(err){
        if(body.password == result.password){
          User.remove({id: result.id}, function(err){
            if(err){
              console.log('User Delete ERR!')
              throw err
            }
            else{
              console.log('User '+ result.username + ' Delete Success!')
              req.session.destroy(function(){
                req.session;
              });
              res.redirect('/')
            }
          })
        }
        else if(body.password != result.password){
          console.log('Password Error')
          res.redirect('/')
        }
      });
    }
    else {
      res.redirect('/');
    }
  })
})

app.get('/main', function(req, res){
    fs.readFile('main.ejs', 'utf-8', function(err, data){
      res.end(ejs.render(data, {username : req.session.username}));
    })
})

app.get('/edit', function(req, res){
  fs.readFile('edit.ejs', 'utf-8', function(err, data){
    res.end(ejs.render(data, {
      username: req.session.username,
      email: req.session.email,
      id: req.session.user_id,
      password: req.session.password
    }))
  })
})

app.post('/edit', function(req, res){
  var body = req.body;

  user = new User({
    username: body.username,
    email: body.email,
    id: body.id,
    password: body.password
  })
    User.update({
        id : req.session.user_id
    },{$set:{username:body.username,email:body.email,password:body.password}},(err)=>{
        if(err){
            console.log(err)
            throw err
        }
        else{
            req.session.username = body.username
            req.session.email = body.email
            req.session.password = body.password
            console.log('Update Success')
            res.redirect('/')
        }
    })
})

app.get('/logout', function(req, res){
  console.log('Logout USER : '+req.session.username)
  req.session.destroy(function(){
    req.session;
  });
  res.redirect('/')
})