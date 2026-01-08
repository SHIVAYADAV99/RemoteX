const fs=require('fs');
const s=fs.readFileSync('client/renderer.js','utf8');
const pairs={'{':0,'}':0,'(':0,')':0,'[':0,']':0};
for(const c of s){if(pairs.hasOwnProperty(c))pairs[c]++;}
console.log('counts',pairs);
let stack=[];
for(let i=0;i<s.length;i++){
  const c=s[i];
  if(c=="'"){i++; while(i<s.length && s[i]!="'") i++;}
  if(c=='"'){i++; while(i<s.length && s[i]!='"') i++;}
  if(c=='`'){i++; while(i<s.length && s[i] != '`') { if(s[i]=='\\') i++; i++; } }
  if(c=='/' && s[i+1]=='/') { while(i<s.length && s[i]!='\n') i++; }
  if(c=='/' && s[i+1]=='*') { i+=2; while(i+1<s.length && !(s[i]=='*' && s[i+1]=='/')) i++; i++; }
  if('{([})]'.includes(c)){
    if('{(['.includes(c)) stack.push(c);
    else{ const o=stack.pop(); if(!o){ console.error('Unmatched closing',c,'at',i); break;} if((o=='('&&c!=')')||(o=='['&&c!=']')||(o=='{'&&c!='}')){ console.error('Mismatched',o,c,'at',i); break;} }
  }
}
console.log('stack top',stack[stack.length-1],'stack size',stack.length);
