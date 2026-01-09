const express=require("express");
const fs=require("fs");
const { exec }=require("child_process");
const bodyParser=require("body-parser");
const path=require("path");
const app=express();
const PORT=process.env.PORT||3000;
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.post("/deploy",(req,res)=>{
const {botName,owner,prefix}=req.body;
const configPath=path.join(__dirname,"../config/config.js");
const configContent=`module.exports={botName:"${botName}",owner:"${owner}@s.whatsapp.net",prefix:"${prefix}",autoTyping:true,autoRecording:true};`;
fs.writeFileSync(configPath,configContent);
exec("node ../index.js",(error,stdout,stderr)=>{if(error)console.error(error);});
res.json({message:"✅ Bot deployed successfully! Check console logs."});
});
app.listen(PORT,()=>{console.log(`🚀 Panel running on http://localhost:${PORT}`);});
















