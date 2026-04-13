/**
 * Generates the bookmarklet JavaScript code with the given session ID and API base URL.
 * The returned string is ready to be used as an `href` on an `<a>` element.
 */
export function generateBookmarkletHref(
  sessionId: string,
  apiBaseUrl: string
): string {
  const code = buildBookmarkletCode(sessionId, apiBaseUrl);
  return "javascript:" + encodeURIComponent(code);
}

function buildBookmarkletCode(sessionId: string, apiBaseUrl: string): string {
  // The bookmarklet JS — runs on bandcamp.com
  // Keep it compact but readable here; it gets URL-encoded anyway
  return `(function(){
if(document.getElementById('cratesync-overlay')){return}
var S='${sessionId}',U='${apiBaseUrl}/api/session?id='+S;
var o=document.createElement('div');o.id='cratesync-overlay';
o.innerHTML='<div style="position:fixed;top:20px;right:20px;z-index:999999;background:#0a0a0a;color:#e5e5e5;padding:20px;border-radius:12px;font-family:system-ui;max-width:350px;box-shadow:0 8px 32px rgba(0,0,0,0.5);border:1px solid #333"><h3 style="margin:0 0 10px;color:#10b981;font-size:16px">CrateSync</h3><div id=cs-status>Loading tracks...</div><div style="margin-top:10px;background:#333;border-radius:4px;height:6px;overflow:hidden"><div id=cs-bar style="background:#10b981;height:100%;width:0%;transition:width 0.3s"></div></div><div id=cs-log style="margin-top:10px;max-height:200px;overflow-y:auto;font-size:12px;color:#999"></div><button id=cs-close style="margin-top:10px;background:#333;border:none;color:#fff;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px">Close</button></div>';
document.body.appendChild(o);
document.getElementById('cs-close').onclick=function(){o.remove()};
var st=document.getElementById('cs-status'),br=document.getElementById('cs-bar'),lg=document.getElementById('cs-log');
function log(m,c){var p=document.createElement('p');p.style.cssText='margin:2px 0;color:'+(c||'#999');p.textContent=m;lg.appendChild(p);lg.scrollTop=lg.scrollHeight}
fetch(U).then(function(r){return r.json()}).then(function(d){
if(!d.tracks||!d.tracks.length){st.textContent='No tracks to wishlist';return}
var tracks=d.tracks,total=tracks.length,done=0,ok=0;
st.textContent='Wishlisting '+total+' tracks...';
function next(i){
if(i>=tracks.length){st.textContent=ok+' of '+total+' tracks wishlisted!';st.style.color='#10b981';return}
var t=tracks[i];log('Processing: '+t.title+' - '+t.artist);
fetch(t.url).then(function(r){return r.text()}).then(function(h){
var m=h.match(/data-tralbum="([^"]+)"/);
if(!m)throw new Error('No track data found');
var dec=m[1].replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"');
var ta=JSON.parse(dec),iid=ta.id,it=ta.item_type==='track'?'t':'a',bid=ta.current&&ta.current.band_id;
if(!bid)throw new Error('Missing band_id');
var fid;try{fid=CurrentFan&&CurrentFan.fan_id}catch(e){}
if(!fid){log('Not logged in to Bandcamp!','#ef4444');st.textContent='Please log in to Bandcamp first';st.style.color='#ef4444';return}
return fetch('/collect_item_cb',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'fan_id='+fid+'&item_id='+iid+'&item_type='+it+'&band_id='+bid})
}).then(function(r){if(r&&r.ok){ok++;log('Added: '+t.title,'#10b981')}else{log('Failed: '+t.title,'#ef4444')}
}).catch(function(e){log('Error: '+t.title+' ('+e.message+')','#ef4444')
}).finally(function(){done++;br.style.width=(done/total*100)+'%';setTimeout(function(){next(i+1)},2000)})
}
next(0)
}).catch(function(e){st.textContent='Error: '+e.message;st.style.color='#ef4444'});
})();`;
}
