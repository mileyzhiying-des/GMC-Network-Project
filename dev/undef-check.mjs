// 检查两类问题（CMD-1027-11）：① 被调用但全站没定义的函数；② 同一函数里 var X = function 在定义之前就被调用（var 提升成 undefined）
// 用法：node dev/undef-check.mjs   （在项目根目录；用 vite 自带的 rolldown 解析器，不写任何文件）
import fs from 'fs';
import { parseAst } from 'rolldown/parseAst';
const FILES = fs.readdirSync('prototype/shared').filter(f => f.endsWith('.js') && !/^(storepack|lz-string)/.test(f));
const BUILTIN = new Set(Object.getOwnPropertyNames(globalThis).concat(['window','document','alert','confirm','prompt','setTimeout','clearTimeout','setInterval','clearInterval','requestAnimationFrame','cancelAnimationFrame','localStorage','sessionStorage','navigator','location','history','fetch','FileReader','Blob','URL','Image','Audio','BroadcastChannel','MutationObserver','ResizeObserver','IntersectionObserver','Intl','getComputedStyle','matchMedia','btoa','atob','XMLHttpRequest','FormData','Event','CustomEvent','AudioContext','SpeechSynthesisUtterance','speechSynthesis','MediaRecorder','performance','screen','innerWidth','scrollTo','open','print','close','focus','LZString','structuredClone','queueMicrotask','encodeURIComponent','decodeURIComponent','escape','unescape','Notification','indexedDB','crypto','TextEncoder','TextDecoder','DOMParser','HTMLElement','Element','Node','NodeFilter','AbortController','addEventListener','removeEventListener']));
const asts = {}; const G = new Set();
function declNames(p, out){ if(!p) return; if(p.type==='Identifier') out.push(p.name); else if(p.type==='ObjectPattern') p.properties.forEach(x=>declNames(x.value||x.argument||x, out)); else if(p.type==='ArrayPattern') p.elements.forEach(x=>declNames(x, out)); else if(p.type==='AssignmentPattern') declNames(p.left, out); else if(p.type==='RestElement') declNames(p.argument, out); }
for(const f of FILES){ const code = fs.readFileSync('prototype/shared/'+f,'utf8'); try{ asts[f] = { ast: parseAst(code, {lang:'js'}), code }; }catch(e){ console.log('PARSE ERROR', f, e.message.slice(0,120)); } }
// 全局名：所有文件顶层声明 + window.X = / 未声明赋值
function walk(n, fn){ if(!n || typeof n!=='object') return; if(Array.isArray(n)){ n.forEach(x=>walk(x,fn)); return; } if(typeof n.type==='string') fn(n); for(const k in n){ if(k==='type'||k==='start'||k==='end') continue; walk(n[k], fn); } }
for(const f in asts){ asts[f].ast.body.forEach(s=>{ if(s.type==='FunctionDeclaration') G.add(s.id.name); else if(s.type==='VariableDeclaration') s.declarations.forEach(d=>{ const o=[]; declNames(d.id,o); o.forEach(x=>G.add(x)); }); });
  walk(asts[f].ast, n=>{ if(n.type==='AssignmentExpression' && n.left.type==='MemberExpression' && n.left.object.type==='Identifier' && n.left.object.name==='window' && !n.left.computed && n.left.property.name) G.add(n.left.property.name); if(n.type==='AssignmentExpression' && n.left.type==='Identifier') G.add(n.left.name); }); }
const out1 = [], out2 = [];
function scopeNames(fnNode){ const names = new Set(); (fnNode.params||[]).forEach(p=>{ const o=[]; declNames(p,o); o.forEach(x=>names.add(x)); }); if(fnNode.id && fnNode.type==='FunctionExpression') names.add(fnNode.id.name);
  const body = fnNode.body; (function w(n, top){ if(!n || typeof n!=='object') return; if(Array.isArray(n)){ n.forEach(x=>w(x,top)); return; } if(n.type==='FunctionDeclaration'){ names.add(n.id.name); return; } if(n.type==='FunctionExpression' || n.type==='ArrowFunctionExpression') return; if(n.type==='ClassDeclaration' && n.id) names.add(n.id.name); if(n.type==='VariableDeclaration') n.declarations.forEach(d=>{ const o=[]; declNames(d.id,o); o.forEach(x=>names.add(x)); }); if(n.type==='CatchClause' && n.param){ const o=[]; declNames(n.param,o); o.forEach(x=>names.add(x)); } for(const k in n){ if(k==='type'||k==='start'||k==='end') continue; w(n[k], false); } })(body); return names; }
function check(f, ast, code){
  const line = pos => code.slice(0,pos).split('\n').length;
  function visit(n, chain){ if(!n || typeof n!=='object') return; if(Array.isArray(n)){ n.forEach(x=>visit(x,chain)); return; }
    let ch = chain;
    if(n.type==='FunctionDeclaration' || n.type==='FunctionExpression' || n.type==='ArrowFunctionExpression'){ ch = chain.concat([scopeNames(n)]);
      // ② 同一函数作用域里 var X = function，在声明位置之前被调用
      if(n.body && n.body.type==='BlockStatement'){ const decls = {}; (function w(m){ if(!m||typeof m!=='object') return; if(Array.isArray(m)){ m.forEach(w); return; } if(m.type==='FunctionDeclaration'||m.type==='FunctionExpression'||m.type==='ArrowFunctionExpression') return; if(m.type==='VariableDeclarator' && m.id.type==='Identifier' && m.init && (m.init.type==='FunctionExpression'||m.init.type==='ArrowFunctionExpression')) if(!(m.id.name in decls)) decls[m.id.name] = m.start; for(const k in m){ if(k==='type'||k==='start'||k==='end') continue; w(m[k]); } })(n.body.body);
        Object.keys(decls).forEach(nm=>{ const dpos = decls[nm]; walk(n.body, m=>{ if(m.type==='CallExpression' && m.callee.type==='Identifier' && m.callee.name===nm && m.start < dpos){
            // 引用在更深的嵌套函数里 且 该嵌套函数本身是在声明前"立刻执行"的回调（forEach 等）才是 md2 这种问题；这里全部列出，人工看
            const inner = []; walk(n.body, q=>{ if((q.type==='FunctionExpression'||q.type==='ArrowFunctionExpression'||q.type==='FunctionDeclaration') && q.start<m.start && q.end>m.end && q!==n) inner.push(q); });
            out2.push(f+':'+line(m.start)+'  '+nm+'() 在 '+line(dpos)+' 行才定义'+(inner.length? '（在嵌套函数里）':'（同层，必炸）')); } }); }); } }
    if(n.type==='CallExpression' && n.callee.type==='Identifier'){ const nm = n.callee.name; if(!G.has(nm) && !BUILTIN.has(nm) && !ch.some(s=>s.has(nm))) out1.push(f+':'+line(n.start)+'  '+nm+'()'); }
    for(const k in n){ if(k==='type'||k==='start'||k==='end') continue; visit(n[k], ch); } }
  visit(ast, []);
}
for(const f in asts) check(f, asts[f].ast, asts[f].code);
console.log('被调用但没定义的函数: '+out1.length); out1.forEach(x=>console.log('  '+x));
console.log('var X = function 在定义前被调用: '+out2.length); out2.forEach(x=>console.log('  '+x));
const hard = out2.filter(x=>x.includes('必炸')).length;
console.log('（"在嵌套函数里"的多半是之后才调用的回调，需人工看；"必炸"和"没定义"才算错）');
process.exit(out1.length||hard ? 1 : 0);
