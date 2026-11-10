/* s28i: dev tools (mock_textdb.js, make_bundle.sh, make_cheer.js, refresh_data.py ...) are not shipped. Lookup: FBN_TOOLS env, else ../tools if present, else /workspace/fantasy-bball-devtools/tools */
const fs=require('fs'),path=require('path');
function toolsDir(){if(process.env.FBN_TOOLS)return process.env.FBN_TOOLS;const up=path.join(__dirname,'..','tools');if(fs.existsSync(up))return up;return '/workspace/fantasy-bball-devtools/tools'}
module.exports={toolsDir,tool:f=>path.join(toolsDir(),f)};
