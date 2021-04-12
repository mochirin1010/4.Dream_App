const express = require('express');
const mysql = require('mysql');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();

app.set("view engine", "ejs");

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Start sever port: " + port);
});

app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));

require('dotenv').config()
const env = process.env

const connection = mysql.createConnection({
  host: 'localhost',
  user: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD,
  database: 'list_app',
  dateStrings: 'date'
});

connection.connect((err) => {
  if (err) {
    console.log('error connecting: ' + err.stack);
    return;
  }
  console.log('success');
});


app.use(
  session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  if (req.session.userId === undefined) {
    res.locals.username = "ゲスト";
    res.locals.isLoggedIn = false;
  } else {
    res.locals.username = req.session.username;
    res.locals.userId = req.session.userId;
    res.locals.isLoggedIn = true;
  }
  next();
});


app.get('/', (req, res) => {
  res.render('top.ejs');
});

app.get('/calendar', (req, res) => {
  res.render('calendar.ejs');
});

app.get('/index/:id', (req, res) => {
  connection.query(
    'SELECT * FROM goals',
   (error, results) => {
    res.render('index.ejs', {goals:results});
  }
  );
});

app.get('/profile/:id', (req, res) => {
  res.render('profile.ejs');
});

app.post('/update/:id', (req, res) => {
  const userName = req.body.userName;
  const id = req.params.id;
  connection.query(
    'UPDATE users SET username = ? WHERE id = ?',
    [userName, id],
    (error, results) => {
      req.session.username = userName;
      res.redirect('/index/:id');
    }
   );
});


app.get('/goals', (req, res) => {
  connection.query(
    'SELECT * FROM goals JOIN users ON goals.user_id = users.id',
   (error, results) => {
    res.render('goals.ejs', {goals:results});
  }
  );
});

app.get('/goals_new', (req, res) => {
  res.render('goals_new.ejs');
});

app.post('/goals_create', (req, res) => {
  const date = req.body.date;
  const target_date = req.body.target_date;
  const content = req.body.content;
  const user_id = req.session.userId;
  connection.query(
    'INSERT INTO goals (date, target_date, content, user_id) VALUES (?, ?, ?, ?)',
     [date, target_date, content, user_id],
     (error, results) => {
      res.redirect('/goals')
    }
  );
});

app.post('/goals_delete/:id', (req, res) => {
  const id = req.params.id;
  connection.query(
    'DELETE FROM goals WHERE id = ?',
    [id],
    (error, results) => {
      res.redirect('/goals');
    }
  );
});

app.get('/goals_edit/:id', (req, res) => {
  const id = req.params.id;
  connection.query(
    'SELECT * FROM goals WHERE id = ?',
    [id],
    (error, results) => {
      res.render('goals_edit.ejs', {goal: results[0]});
    }
  );
});

app.post('/goals_update/:id', (req, res) => {
  const date = req.body.date;
  const target_date = req.body.target_date;
  const content = req.body.content;
  const id = req.params.id;
  connection.query(
    'UPDATE goals SET date = ?, target_date = ?, content = ? WHERE id = ?',
    [date, target_date, content, id],
    (error, results) => {
      res.redirect('/goals');
    }
  );
});

app.get('/signup', (req, res) => {
  res.render('signup.ejs', {errors: []});
});

app.post('/signup',
(req, res, next) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

  const errors = [];

  if (username ===  "") {
    errors.push('ユーザー名が空です');
  }
  if (email === "") {
    errors.push('メールアドレスが空です');
  }
  if (password === "") {
    errors.push('パスワードが空です');
  }

  if (errors.length > 0) {
    res.render('signup.ejs', {errors: errors});
  } else {
    next();
  }
},
(req, res, next) => {
  const email = req.body.email;
  const errors = [];

  connection.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (error, results) => {
      if (results.length > 0) {
        errors.push("ユーザー登録に失敗しました");
        res.render('signup.ejs', {errors: errors});
      } else {
        next();
      }
    }
  ); 
},
(req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  bcrypt.hash(password, 10, (error, hash) => {
    connection.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hash],
      (error, results) => {
        req.session.userId = results.insertId;
        req.session.username = username;
        res.redirect('/goals');
      }
    );
  });
});
  

app.get('/login', (req, res) => {
  res.render('login.ejs');
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  connection.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (error, results) => {
      if (results.length > 0) {
        const plain = req.body.password;
        const hash = results[0].password;
        bcrypt.compare(plain, hash, (error, isEqual) => {
          if(isEqual) {
            req.session.userId = results[0].id;
            req.session.username = results[0].username;
            res.redirect('/goals');
          } else {
            res.redirect('/login');
          }
        });
      } else {
        res.redirect("/login");
      }
    }
  );
});

app.get('/logout', (req, res) =>{
  req.session.destroy((error) => {
    res.redirect("/");
  });
});


// connection.end();
// app.listen(3000);
