const express = require("express");
const morgan = require('morgan');
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
require("dotenv").config();
const app = express();

const PORT = process.env.PORT || 3000;

const initializePassport = require("./passportConfig");

initializePassport(passport);

// Middleware

// Parses details from a form
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.json());


app.use(
  session({
    // Key we want to keep secret which will encrypt all of our information
    secret: process.env.SESSION_SECRET,
    // Should we resave our session variables if nothing has changes which we dont
    resave: false,
    // Save empty value if there is no vaue which we do not want to do
    saveUninitialized: false
  })
);
// Funtion inside passport which initializes passport
app.use(passport.initialize());
// Store our variables to be persisted across the whole session. Works with app.use(Session) above
app.use(passport.session());
app.use(flash());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/users/register", checkAuthenticated, (req, res) => {
  res.render("register.ejs");
});

app.get("/users/login", checkAuthenticated, (req, res) => {
  // flash sets a messages variable. passport sets the error message
  console.log(req.session.flash.error);
  res.render("login.ejs");
  
});
app.get("/users/visitorinfo", (req, res) => {
  res.render("visitorinfo");
});

app.get("/users/dashboard2", checkNotAuthenticated, (req, res) => {
  console.log(req.isAuthenticated());
  res.render("dashboard2.ejs", { user: req.user.name });
});



app.get("/users/logout", (req, res) => {
  req.logout();
  res.render("index", { message: "You have logged out successfully" });
});

app.post("/users/register", async (req, res) => {
  let { name, email, password, password2 } = req.body;

  let errors = [];

  console.log({
    name,
    email,
    password,
    password2
  });

  if (!name || !email || !password || !password2) {
    errors.push({ message: "Please enter all fields" });
  }

  if (password.length < 6) {
    errors.push({ message: "Password must be a least 6 characters long" });
  }

  if (password !== password2) {
    errors.push({ message: "Passwords do not match" });
  }

  if (errors.length > 0) {
    res.render("register", { errors, name, email, password, password2 });
  } else {
    hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    // Validation passed
    pool.query(
      `SELECT * FROM users
        WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results.rows);

        if (results.rows.length > 0) {
          return res.render("register", {
            message: "Email already registered"
          });
        } else {
          pool.query(
            `INSERT INTO users (name, email, password)
                VALUES ($1, $2, $3)
                RETURNING id, password`,
            [name, email, hashedPassword],
            (err, results) => {
              if (err) {
                throw err;
              }
              console.log(results.rows);
              req.flash("success_msg", "You are now registered. Please log in");
              res.redirect("/users/login");
            }
          );
        }
      }
    );
  }
});

app.post(
  "/users/login",
  passport.authenticate("local", {
    successRedirect: "/users/dashboard2",
    failureRedirect: "/users/login",
    failureFlash: true
  })
);

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/users/dashboard2");
  }
  next();
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/users/login");
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


app.get('/', (req, res)=>{
  res.sendFile(__dirname + '/index.html');
}); 

// app.listen(port, function start(){
//   console.log(`server started on ${port}`);
// })

// 데이터 조회
app.get('/info/get', (req, res)=> {
  try{ 
  pool.connect(async (error, client, release)=>{
    let resp = await client.query(`Select * FROM PG_STAT_USER_TABLES`);
    // release(); 
    res.send(resp.rows);
  })
  }catch(error){
    console.log(error);
  }
})




// async function readtodos() {
//   try {
//     const results = await client.query("Select * from dongyou_visitor;")
//     return result.rows();
//   }
//   catch(e){
//     return[];
//   }
// }



//테이블 만들기
app.post('/info/create', (req, res)=> {
  try{  
  pool.connect(async (error, client, release)=>{
    // console.log(req.body.delcolumn);
    // console.log(req.body.delete);
    let resp = await client.query(`Create table ${req.body.create_tb} (${req.body.tb_colname1} Varchar(50),
    ${req.body.tb_colname2} Varchar(50),
    ${req.body.tb_colname3} Varchar(50),
    ${req.body.tb_colname4} Varchar(50),
    ${req.body.tb_colname5} Varchar(50),
    ${req.body.tb_colname6} Varchar(50),
    ${req.body.tb_colname7} Varchar(50))`); 
    console.log(resp);
    res.send(resp.rows);
  
  })
  }catch(error){
    console.log(error);
  }
})

//테이블 제거하기
app.post('/info/drop', (req, res)=> {
  try{  
  pool.connect(async (error, client, release)=>{
    let resp = await client.query(`Drop table ${req.body.create_tb}`); 
    console.log(resp);
    res.send(resp.rows);
  
  })
  }catch(error){
    console.log(error);
  }
})


//칼럼 추가, 조회 쿼리
app.post('/info/add3', (req, res, res2)=> {
  try{  
  pool.connect(async (error, client, release)=>{
    // console.log(req.body.delcolumn);
    // console.log(req.body.delete);
    let resp = await client.query(`INSERT INTO ${req.body.create_tb} VALUES ('${req.body.tb_colname1}', '${req.body.tb_colname2}', '${req.body.tb_colname3}',
    '${req.body.tb_colname4}', '${req.body.tb_colname5}', '${req.body.tb_colname6}', '${req.body.tb_colname7}')`); 
    // console.log(resp);
    let resp2 = await client.query(`Select * from ${req.body.create_tb}`);
    // console.log(resp2);
    res.send(resp2.rows);
    // index = res.redirect('/info/get2');
    // return index;
  })
  }catch(error){
    console.log(error);
  }
})  


// 데이터 넣기
// app.post('/info/add', (req, res)=> {
//   try{ 
//   pool.connect(async (error, client, release)=>{
//     let resp = await client.query(`INSERT INTO dongyou (vendor) VALUES ('${req.body.add}')`); 
//     console.log(resp);
//     res.redirect('/info/get');
//   })
//   }catch(error){
//     console.log(error);
//   }
// })

// 데이터 넣기_방문자 출입 이력
app.post('/info/add2', (req, res)=> {
  try{ 
  pool.connect(async (error, client, release)=>{
    let resp = await client.query(`INSERT INTO dongyou_visitor (이름, 사번, 방문목적, 사용날짜, 비고, 팀) VALUES ('${req.body.이름}', 
    '${req.body.사번}','${req.body.방문목적}','${req.body.사용날짜}','${req.body.비고}','${req.body.팀}')`); 
    console.log(resp);
    index = res.redirect('/info/get');
    return index;
  })
  }catch(error){
    console.log(error);
  }
})  

// 데이터 삭제
app.post('/info/delete', (req, res)=> {
  try{  
  pool.connect(async (error, client, release)=>{
    // console.log(req.body.delcolumn);
    // console.log(req.body.delete);
    let resp = await client.query(`DELETE FROM dongyou_visitor where ${req.body.delcolumn} = '${req.body.delete}'`); 
    console.log(resp);
    res.redirect('/info/get');
  
  })
  }catch(error){
    console.log(error);
  }
})

// // 데이터 Update
// app.post('/info/update', (req, res)=> {
//   try{ 
//   pool.connect(async (error, client, release)=>{
//     let resp = await client.query(`UPDATE dongyou SET vendor = '${req.body.newvalue}' WHERE vendor = '${req.body.oldvalue}'`); 
//     console.log(resp);
//     res.redirect('/info/get');
//   })
//   }catch(error){
//     console.log(error);
//   }
// })