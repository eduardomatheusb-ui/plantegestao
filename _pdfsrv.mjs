import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
const ROOT = "C:/Users/Eduardo Almeida/Documents/Plante Top/content/biblia";
const T = { ".pdf":"application/pdf", ".html":"text/html; charset=utf-8" };
createServer(async (req,res)=>{
  try{
    let p = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
    const full = normalize(join(ROOT,p));
    if(!full.startsWith(normalize(ROOT))){res.writeHead(403).end();return;}
    const data = await readFile(full);
    res.writeHead(200,{"Content-Type":T[extname(full).toLowerCase()]||"application/octet-stream","Cache-Control":"no-store","Content-Disposition":"inline"});
    res.end(data);
  }catch(e){res.writeHead(404).end("404 "+req.url);}
}).listen(8100,()=>console.log("pdf server em http://localhost:8100"));
