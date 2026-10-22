/* CMD-1022-12 死代码隔离（取代 CMD-1022-11）：这几个函数目前没有任何地方在用（旧的「关联之前案件」下拉，被 1022-06 的到店弹窗和 1022-05 的关联案件块取代）。
   内容原样搬过来、照样加载（万一有人调用也不会报错），被调用时 Console 打 [legacy] 函数名 被调用，并记入 window.__legacyHits；在 Console 输入 gmcLegacyHits() 查看。
   只警示、不阻断，功能照旧执行；确认没问题、合并时再删。想搬回去：把函数原样剪回 data.js，并删掉里面的 gmcLegacyHit 一行。
   （simulateDirectorJudge 在代码里已经不存在，所以不在这里。） */
window.__legacyHits = window.__legacyHits || {};
function gmcLegacyHit(name){ window.__legacyHits[name] = (window.__legacyHits[name]||0) + 1; try{ console.warn('[legacy] '+name+' 被调用'); }catch(e){} }
function gmcLegacyHits(){ var h = window.__legacyHits, ks = Object.keys(h); if(!ks.length){ console.log('[legacy] 没有被隔离的函数被调用过'); return {}; } ks.forEach(function(k){ console.log('[legacy] '+k+' 被调用 '+h[k]+' 次'); }); return h; }

function linkSuggestionHtml(c){
  gmcLegacyHit('linkSuggestionHtml');
  var tips = [];
  var lastKr = clientPriorCases(c).filter(function(x){ return x.stage==='closed' && x.krProcedureDone; }).pop();
  if(lastKr) tips.push(lastKr.caseNo+'（最近结案的赴韩案件）');
  clientHoldingsSorted(c.name).forEach(function(h){
    if(h.category!=='术后管理') return;
    var b = h.batches.filter(function(x){ return x.bought-x.used>0; })[0];
    if(b){ var t = caseNoLabel(b.caseId)+'（还有未用完的术后管理项目：'+h.itemName+'）'; if(tips.indexOf(t)<0) tips.push(t); }
  });
  if(!tips.length) return '';
  return '<div style="font-size:12px;color:var(--terracotta);margin-top:6px;">可能与 '+tips.join('、')+' 相关</div>';
}

function setLinkReason(reason){
  gmcLegacyHit('setLinkReason');
  var c = getCurrentCase(); if(!c || !c.linkedCase) return;
  c.linkedCase.reason = reason;
  renderCaseBody(c);
}

function linkRowHtml(c){
  gmcLegacyHit('linkRowHtml');
  var prior = clientPriorCases(c);
  var opts = '<option value="">（不关联）</option>'+prior.map(function(x){
    return '<option value="'+x.id+'"'+(c.linkedCase&&c.linkedCase.caseId===x.id?' selected':'')+'>'+x.caseNo+' · '+caseStageProcText(x)+'</option>';
  }).join('');
  var reasonSel = (c.linkedCase && c.linkedCase.caseId)
    ? '<select onchange="setLinkReason(this.value)" style="margin-left:8px;padding:7px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;"><option value="">选择关联原因 *</option>'+
      LINK_REASONS.map(function(r){ return '<option'+(c.linkedCase.reason===r?' selected':'')+'>'+r+'</option>'; }).join('')+'</select>' : '';
  return '<div class="case-field-row" style="align-items:flex-start;"><span class="fk" style="padding-top:9px;">关联之前案件</span><div style="flex-grow:1;">'+
    '<select onchange="setLinkedCase(this.value)" style="padding:7px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;"'+(prior.length?'':' disabled')+'>'+opts+'</select>'+reasonSel+
    (prior.length?'':'<span style="font-size:12px;color:var(--muted);margin-left:8px;">该客户没有以前的案件</span>')+
    ((c.visitPurpose==='术后管理' || c.visitPurpose==='复诊') && !(c.linkedCase && c.linkedCase.caseId) ? '<div style="font-size:12px;color:var(--terracotta);margin-top:6px;">来访目的是「'+c.visitPurpose+'」，要不要关联之前的案件？</div>' : '')+
    linkSuggestionHtml(c)+'</div></div>';
}

