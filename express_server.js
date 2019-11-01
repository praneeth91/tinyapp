const express = require("express");
const cookieSession = require('cookie-session');
const app = express();
const getUserByEmail = require("./helper");
const bcrypt = require('bcrypt');
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key 1','key 2'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};
function generateRandomString() {
  let all = "abcdefghijklmnopqrstuvwxyz0123456789";
  let randomText ="";
  for (let i = 0; i < 6; i++) {
    randomText+= all.charAt(Math.floor(Math.random() * all.length));
  }
  return randomText;
}
function urlsForUser(id) {
  let newObj = {};
  let arr = Object.keys(urlDatabase);
  for (let key of arr) {
    if (urlDatabase[key]["userID"]=== id) {
      newObj[key] = urlDatabase[key];
    }
  }
  return newObj;
}
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
    // All GET methods
app.get("/", (req, res) => {
  if(req.session.user_id === undefined){
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});
    
app.get("/urls", (req, res) => {
  if(!req.session.user_id){
    res.send("<html><body> <b>Please Login to view URLS</b></body></html>\n");
  } else {
  let id = req.session.user_id;
  let userUrlDatabase = urlsForUser(id);
  let templateVars = { urls: userUrlDatabase, user_id: users[req.session.user_id]};
  res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  if(!req.session.user_id){
    res.redirect("/login");
  } else {
  let templateVars = {user_id: users[req.session.user_id]};
  res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if(!req.session.user_id){
    res.redirect("/login");
  } else if (urlDatabase[req.params.shortURL] === undefined){
    res.send("<html><body> <b>Invalid URL</b></body></html>\n");
  } else if(req.session.user_id !== urlDatabase[req.params.shortURL].userID){
    res.send("<html><body> <b>You Don't own this URL</b></body></html>\n");
  }
  else {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL],user_id: users[req.session.user_id] };
  res.render("urls_show", templateVars);
  }
});

app.get("/register", (req, res) =>{
  if(req.session.user_id){
    res.redirect("/urls");
  } else {
  let templateVars = {user_id: users[req.session.user_id]};
  res.render("registration", templateVars);
  }
});

app.get("/login", (req, res) =>{
  if(req.session.user_id){
    res.redirect("/urls");
  } else {
  let templateVars = {user_id: users[req.session.user_id]};
  res.render("login", templateVars);
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => { 
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.send("<html><body> <b>No URL exists for given ID</b></body></html>\n");
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL; 
    res.redirect(longURL);
  }
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
    // All POST Methods
app.post("/urls", (req, res) => {
  if(!req.session.user_id){
    res.send("<html><body> <b>Please login to continue</b></body></html>\n");
  } else {
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {};
    urlDatabase[shortURL]["longURL"] = req.body.longURL;
    urlDatabase[shortURL]["userID"] = req.session.user_id;
    res.redirect(`/urls/${shortURL}`);
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
   if(!req.session.user_id){
   res.send("<html><body> <b>Please login to continue</b></body></html>\n");
  } else if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
      res.send("<html><body> <b>You are not authorized to delete this </b></body></html>\n");
  } else {
      delete urlDatabase[req.params.shortURL];
      res.redirect("/urls");
  }
});

app.post("/urls/:shortURL", (req,res) => {
  if(!req.session.user_id){
    res.send("<html><body> <b>Please login to continue</b></body></html>\n");
  } else if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
      res.send("<html><body> <b>You are not authorized to Edit this </b></body></html>\n");
  } else {
      urlDatabase[req.params.shortURL].longURL = req.body.newLongurl;
      res.redirect("/urls");
  }
});

app.post("/urls/:user_id/logout", (req,res) => {
  req.session.user_id = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  let randomid = generateRandomString();
  let useremail = req.body.email;
  let userpassword = req.body.password;
  let hashedPassword = bcrypt.hashSync(userpassword, 10);
  if(useremail === "" || userpassword === "") {
    res.status(400).send(`email and/or password can't be empty`);    
  } else if(getUserByEmail(useremail,users).email !== undefined) {//The functions returns an object containing email,password,id
    res.status(400).send(`user with given email already exists`);    
  }
  users[randomid] = {id:randomid, email:useremail, password:hashedPassword};
  req.session.user_id = randomid;
  res.redirect("/urls");
})

app.post("/login", (req,res) => {
  let useremail = req.body.email;
  let userpassword = req.body.password;
  let obj1 = getUserByEmail(useremail,users);//The functions returns an object containing email,password,id
  if(obj1.email !== useremail) {
    res.status(403).send("user with the given email doesn't exist");
  } else if(!bcrypt.compareSync(userpassword,obj1.password)) {
    res.status(403).send("password doesn't match");
  }
  req.session.user_id = obj1.id;
  res.redirect("/urls");
})
