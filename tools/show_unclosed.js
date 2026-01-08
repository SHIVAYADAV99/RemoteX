const fs=require('fs');
const s=fs.readFileSync('client/renderer.js','utf8');
let stack=[];
for(let i=0;i<s.length;i++){
  const c=s[i];
  if(c=="'"){i++; while(i<s.length && s[i]!="'") i++; continue;}
  if(c=='"'){i++; while(i<s.length && s[i]!='"') i++; continue;}
  if(c=='`'){i++; while(i<s.length && s[i] != '`') { if(s[i]=='\\') i++; i++; } continue;}
  if(c=='/' && s[i+1]=='/') { while(i<s.length && s[i]!='\n') i++; continue;}
  if(c=='/' && s[i+1]=='*') { i+=2; while(i+1<s.length && !(s[i]=='*' && s[i+1]=='/')) i++; i++; continue;}
  if('{(['.includes(c)) stack.push({char:c,pos:i});
  else if('})]'.includes(c)){
    stack.pop();
  }
}
console.log('Unclosed:', stack.slice(-6));
for(const it of stack.slice(-6)){
  const start=Math.max(0,it.pos-40);
  const end=Math.min(s.length,it.pos+40);
  console.log('--- context around',it.pos,'---');
  console.log(s.slice(start,end));
}
