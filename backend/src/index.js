import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import rateLimit from "express-rate-limit";


const app =  express();
const Port = 3000;
const JWT_SECRET = "super_secret_key";

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

// middleware to read json 
app.use(express.json());

app.use(express.static("public"));

// USERS (FAKE DB)

let users = [];



let jokes = [
  { id: 1, joke: "Why don't programmers like nature? Too many bugs." },
  { id: 2, joke: "Why did the computer go to the doctor? Because it caught a virus." },
  { id: 3, joke: "Why do Java developers wear glasses? Because they don't C#." }
];


// <======= RATE LIMITING =============>

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: "Too many requests, please try again later."
});

app.use(apiLimiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // only 5 login attempts per 15 min
  message: "Too many login attempts. Try again later."
});



// <==========AUTH ROUTES=============>

// REGISTER

app.post("/register",async (req,res)=>{
  const {username,password,role} = req.body;

  const existingUser = users.find(u => u.username === username);
  if(existingUser){
    return res.status(400).json({message:"User already exists"});
  }

  const hashedPassword = await bcrypt.hash(password,10);

  const newUser = {
    id: users.length+1,
    username: username,
    passwordHash: hashedPassword,
    role: role || "user"
    //role diya hoga to woh save hoga otherwise user 
  }

  users.push(newUser);

  res.status(201).json({message:"User registered successfully"});
});

// LOGIN

app.post("/login",loginLimiter, async (req,res)=>{
  const {username,password} = req.body;

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password,user.passwordHash);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    {id:user.id, role: user.role},
    JWT_SECRET,
    { expiresIn: "1h"}
  );

  res.json({token});
});

// <---------- JWT MIDDLEWARE --------->
  function authenticateToken(req,res,next){
    const authHeader = req.headers["authorization"];

    if(!authHeader){
      return res.status(401).json({message:"Token required"});
    }
    
    const token = authHeader.split(" ")[1];

    jwt.verify(token,JWT_SECRET,(err,user)=>{
      if(err) return res.status(403).json({message:"Invalid token"});

      req.user = user;
      next();
    })
  }  


// <------------ ROLE AUTHORIZATION ------------->

function authorizeRole(role){
  return (req,res,next) => {
    if(req.user.role !== role){
      return res.status(403).json({message:"Access denied"});
    }
    next();
  };
}


// <-------------- PROTECTED ROUTES ------------> 

//anyone logged in 
app.get("/jokes",authenticateToken,(req,res)=>{
  res.json(jokes);
});

app.get("/jokes/random",authenticateToken,(req,res)=>{
  const randomIndex = Math.floor(Math.random()*jokes.length);
  res.json(jokes[randomIndex]);
});

// code to get a sprecific joke
// id is the url parameter
app.get("/jokes/:id",authenticateToken,(req,res)=>{
  const id = parseInt(req.params.id);

  const joke = jokes.find(j=> j.id===id);

  if(!joke){
    return res.status(404).json({error:"Joke not found"});
  }
  res.json(joke);
});


//admin only
app.post("/jokes",authenticateToken,authorizeRole("admin"),(req,res)=>{

  if (!req.body.joke) {
  return res.status(400).json({ message: "Joke is required" });
  }

  const newJoke = {
    id: jokes.length + 1,
    joke: req.body.joke
  };

  jokes.push(newJoke);
  res.status(201).json(newJoke);
});

// <------------- START SERVER ----------->

app.listen(Port,()=>{
  console.log(`Jokes API is running on http://localhost:${Port}`);
});

