import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { ensureDataDir, readJson, writeJson } from "./utils/filedb.js";
import { authRequired } from "./middleware/auth.js";

const app = express();
app.use(cors());
app.use(express.json({limit:"2mb"}));
app.use(morgan("dev"));

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || "data";
ensureDataDir(DATA_DIR);

const USERS_FILE = "users.json";
const MATCHES_FILE = "matches.json";
const MSG_FILE = "messages.json";

const loadUsers = ()=> readJson(DATA_DIR, USERS_FILE, []);
const saveUsers = (u)=> writeJson(DATA_DIR, USERS_FILE, u);
const loadMatches = ()=> readJson(DATA_DIR, MATCHES_FILE, []);
const saveMatches = (m)=> writeJson(DATA_DIR, MATCHES_FILE, m);
const loadMsgs = ()=> readJson(DATA_DIR, MSG_FILE, []);
const saveMsgs = (ms)=> writeJson(DATA_DIR, MSG_FILE, ms);

const publicUser = (u)=>{ const {passHash, ...rest}=u; return rest; };

app.get("/health",(req,res)=>res.json({ok:true, ts:Date.now()}));

app.post("/auth/register",(req,res)=>{
  const {email,password,name,gender,lookingFor}=req.body||{};
  if(!email||!password||!name) return res.status(400).json({error:"missing_fields"});
  const users=loadUsers();
  if(users.find(x=>x.email.toLowerCase()===email.toLowerCase()))
    return res.status(409).json({error:"email_exists"});
  const id=nanoid();
  const passHash=bcrypt.hashSync(password,10);
  const user={id,email,passHash,name,
    gender:gender||"unspecified",
    lookingFor:lookingFor||["female","male","non-binary"],
    age:null,city:"",bio:"",interests:[],photos:[],
    createdAt:new Date().toISOString()
  };
  users.push(user); saveUsers(users);
  const token=jwt.sign({sub:id},process.env.JWT_SECRET,{expiresIn:"30d"});
  res.json({token,user:publicUser(user)});
});

app.post("/auth/login",(req,res)=>{
  const {email,password}=req.body||{};
  if(!email||!password) return res.status(400).json({error:"missing_fields"});
  const users=loadUsers();
  const user=users.find(x=>x.email.toLowerCase()===email.toLowerCase());
  if(!user) return res.status(401).json({error:"bad_credentials"});
  if(!bcrypt.compareSync(password,user.passHash))
    return res.status(401).json({error:"bad_credentials"});
  const token=jwt.sign({sub:user.id},process.env.JWT_SECRET,{expiresIn:"30d"});
  res.json({token,user:publicUser(user)});
});

app.get("/users/me",authRequired,(req,res)=>{
  const me=loadUsers().find(x=>x.id===req.userId);
  if(!me) return res.status(404).json({error:"not_found"});
  res.json({user:publicUser(me)});
});

app.put("/users/me",authRequired,(req,res)=>{
  const users=loadUsers();
  const idx=users.findIndex(x=>x.id===req.userId);
  if(idx<0) return res.status(404).json({error:"not_found"});
  const allowed=["name","age","city","bio","interests","photos","gender","lookingFor"];
  for(const k of allowed) if(k in req.body) users[idx][k]=req.body[k];
  saveUsers(users);
  res.json({user:publicUser(users[idx])});
});

app.get("/profiles",authRequired,(req,res)=>{
  const users=loadUsers();
  const me=users.find(x=>x.id===req.userId);
  if(!me) return res.status(404).json({error:"not_found"});
  const looking=Array.isArray(me.lookingFor)?me.lookingFor:[me.lookingFor];
  const candidates=users.filter(u=>u.id!==me.id && looking.includes(u.gender));
  res.json({profiles:candidates.map(publicUser)});
});

app.post("/matches/like/:targetId",authRequired,(req,res)=>{
  const {targetId}=req.params;
  const users=loadUsers();
  const me=users.find(x=>x.id===req.userId);
  const target=users.find(x=>x.id===targetId);
  if(!me||!target) return res.status(404).json({error:"user_not_found"});

  let matches=loadMatches();
  let match=matches.find(m=>m.users.includes(me.id)&&m.users.includes(target.id));
  if(!match){
    match={id:nanoid(),users:[me.id,target.id],likes:{},createdAt:new Date().toISOString()};
    matches.push(match);
  }
  match.likes[me.id]=true;
  const mutual=match.likes[me.id]&&match.likes[target.id];
  saveMatches(matches);
  res.json({matchId:match.id,mutual});
});

app.get("/matches",authRequired,(req,res)=>{
  const matches=loadMatches().filter(m=>m.users.includes(req.userId));
  res.json({matches});
});

app.post("/messages/:matchId",authRequired,(req,res)=>{
  const {matchId}=req.params; const {text}=req.body||{};
  if(!text) return res.status(400).json({error:"missing_text"});
  const match=loadMatches().find(m=>m.id===matchId&&m.users.includes(req.userId));
  if(!match) return res.status(404).json({error:"match_not_found"});
  const msgs=loadMsgs();
  const msg={id:nanoid(),matchId,from:req.userId,text,createdAt:new Date().toISOString()};
  msgs.push(msg); saveMsgs(msgs);
  res.json({message:msg});
});

app.get("/messages/:matchId",authRequired,(req,res)=>{
  const {matchId}=req.params;
  const match=loadMatches().find(m=>m.id===matchId&&m.users.includes(req.userId));
  if(!match) return res.status(404).json({error:"match_not_found"});
  const msgs=loadMsgs().filter(m=>m.matchId===matchId);
  res.json({messages:msgs});
});

app.listen(PORT,()=>console.log("Sennight backend on",PORT));