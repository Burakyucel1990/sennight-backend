import jwt from "jsonwebtoken";
export function authRequired(req, res, next){
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if(!token) return res.status(401).json({error:"no_token"});
  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  }catch{
    return res.status(401).json({error:"bad_token"});
  }
}