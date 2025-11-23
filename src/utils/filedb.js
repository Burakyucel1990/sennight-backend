import fs from "fs";
import path from "path";

export function ensureDataDir(dir){
  if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true});
}
export function readJson(dir, name, fallback){
  const p = path.join(dir, name);
  if(!fs.existsSync(p)) return fallback;
  try{ return JSON.parse(fs.readFileSync(p, "utf-8")); }
  catch{ return fallback; }
}
export function writeJson(dir, name, data){
  const p = path.join(dir, name);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf-8");
}