const fs=require('fs');
const s=fs.readFileSync('client/renderer.js','utf8');
let stack=[];
for(let i=0;i<s.length;i++){
  const c=s[i];
  // skip strings and comments
  if(c=="'"){i++; while(i<s.length && s[i]!="'") i++; continue;}
  if(c=='"'){i++; while(i<s.length && s[i]!='"') i++; continue;}
  if(c=='`'){i++; while(i<s.length && s[i] != '`') { if(s[i]=='\\') i++; i++; } continue;}
  if(c=='/' && s[i+1]=='/') { while(i<s.length && s[i]!='\n') i++; continue;}
  if(c=='/' && s[i+1]=='*') { i+=2; while(i+1<s.length && !(s[i]=='*' && s[i+1]=='/')) i++; i++; continue;}
  if('{(['.includes(c)) stack.push({char:c,pos:i});
  else if('})]'.includes(c)){
    const last=stack.pop();
    if(!last){ console.log('Unmatched closing',c,'at',i); break; }
    const o=last.char;
    if((o=='('&&c!=')')||(o=='['&&c!=']')||(o=='{'&&c!='}')){
      console.log('Mismatched',o,c,'at',i,'opened at',last.pos);
      break;
    }
  }
}
if(stack.length) console.log('Unclosed stack (top last):', stack.slice(-5));
else console.log('All balanced');
