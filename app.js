var fs = require('fs')
var ejs = require('ejs')
var mongoose = require('mongoose')
var express = require('express')
var passport = require('passport')
var FacebookStrategy = require('passport-facebook').Strategy;;
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

app.use(express.static('public'));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost/webprogramming", function(err){
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
  User.remove({id: req.session.user_id}, function(err){
    if(err){
      console.log(err)
      throw err
    }
  user.save(function(err){
    if(err){
      console.log("/edit save Error")
      throw err
    }
    else {
      console.log('Edit success')
      req.session.username = body.username;
      req.session.user_id = body.id;
      req.session.email = body.email;
      req.session.password = body.password;
      res.redirect('/main')
    }
  })
})
})

app.get('/logout', function(req, res){
  console.log('Logout USER : '+req.session.username)
  req.session.destroy(function(){
    req.session;
  });
  res.redirect('/')
})

// passport.use(new FacebookStrategy({
//     clientID: '1649437005348937',
//     clientSecret: '5452e5edeb1623b12b87efd4692feb98',
//     callbackURL: "/auth/facebook/callback",
//     profileFields: ['id', 'email', 'gender', 'link', 'locale', 'name', 'timezone', 'verified'],
//   },
//   function(accessToken, refreshToken, profile, done) {
//     console.log(profile)
//     console.log("email : "+profile.emails)
//     user = new User({
//       username: profile.familyName+profile.givenName,
//       id: profile.emails
//     })
//
//     User.findOne({
//       id: profile.emails
//     }, function(err, result){
//       if(err){
//         console.log("findOne err")
//         //throw err
//       }
//       if(result){
//         console.log(profile.familyName+profile.givenName+" Facebook Login")
//         done(null, true, { message: "Login Success!"})
//       }
//       else{
//         user.save(function(err){
//           if(err){
//             console.log("save err")
//             //throw err
//           }
//           else{
//             console.log(profile.familyName+profile.givenName+" Facebook User Save")
//             done(null, true, { message: 'Register Success!'})
//           }
//         })
//       }
//     })
//   }
// ));

// passport.serializeUser(function(user, done) {
//   console.log("serialize")
//   done(null, user);
// });
//
// passport.deserializeUser(function(user, done) {
//   console.log("deserialize")
//   done(null, user);
// });
//
// app.get('/auth/facebook', //facebook 로그인을 위한 함수 , 로그인 링크 : http://soylatte.kr/auth/facebook
//   passport.authenticate('facebook', { scope: ['email', 'public_profile', 'read_stream', 'publish_actions'] })//페이스북에서 받아올 정보 퍼미션 설정
// );
//
// app.get('/auth/facebook/callback', //로그인후에 성공, 실패 여부에 따른 리다이렉션(링크이동)
//   passport.authenticate('facebook',
//   {
//     successRedirect: '/',
//     failureRedirect: '/'
//   }));
