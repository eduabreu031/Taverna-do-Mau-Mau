#!/usr/bin/env python3
"""Assemble a reproducible Beta site without changing the Alpha production."""
from pathlib import Path
import hashlib
import json
import urllib.request

HERE=Path(__file__).resolve().parent
OUT=HERE
delta=json.loads((HERE/'delta_v91.json').read_text(encoding='utf-8'))
repo='https://raw.githubusercontent.com/eduabreu031/Taverna-do-MAU-MAU-Alpha-publico/'
url=repo+delta['source_commit']+'/site/index.html'
with urllib.request.urlopen(url, timeout=45) as response: original=response.read()
assert hashlib.sha256(original).hexdigest()==delta['source_sha256'], 'Versão de referência divergente'
lines=original.decode('utf-8').splitlines(keepends=True)
for op in reversed(delta['ops']):
    assert 0<=op['start']<=op['end']<=len(lines)
    lines[op['start']:op['end']]=[op['insert']]
html=''.join(lines)
assert len(html)>4_000_000
assert 'Taverna do MAU MAU — BETA v91' in html
assert 'https://taverna-multiplayer-beta.edulopes941.workers.dev' in html
assert 'id="betaSpectatorBanner"' in html or "id='betaSpectatorBanner'" in html or 'betaSpectatorBanner' in html
assert 'id="online-v84-controller"' in html
(OUT/'index.html').write_text(html,encoding='utf-8')
icon=StringIcon='''
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<defs>
<radialGradient id="bg"><stop stop-color="#64152e"/><stop offset=".72" stop-color="#350e21"/><stop offset="1" stop-color="#210914"/></radialGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff2bd"/><stop offset=".28" stop-color="#e9bb67"/><stop offset=".6" stop-color="#9d6232"/><stop offset=".82" stop-color="#efc47b"/><stop offset="1" stop-color="#6a341f"/></linearGradient>
<linearGradient id="center" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8f3451"/><stop offset="1" stop-color="#3b1127"/></linearGradient>
</defs>
<rect width="512" height="512" rx="86" fill="url(#bg)"/>
<rect x="21" y="21" width="470" height="470" rx="71" fill="none" stroke="#b1834b" stroke-width="4" opacity=".78"/>
<rect x="36" y="36" width="440" height="440" rx="61" fill="none" stroke="#ddbe84" stroke-width="1.6" opacity=".26"/>
<path d="M256 146 C231 177 186 198 156 233 C133 258 127 287 149 313 C176 344 215 333 242 305 C237 355 220 381 198 415 L314 415 C291 381 275 355 270 305 C297 333 336 344 363 313 C385 287 379 258 356 233 C326 198 281 177 256 146Z" fill="url(#gold)" stroke="#4a261c" stroke-width="8" stroke-linejoin="round"/>
<path d="M256 173 C235 198 186 224 164 251 C150 269 150 292 162 307 C181 324 221 305 248 283 C247 342 230 374 220 399 L292 399 C281 374 265 342 264 283 C291 305 331 324 350 307 C362 292 362 269 348 251 C326 224 277 198 256 173Z" fill="url(#center)" opacity=".82"/>
<path d="M178 163 L164 105 L213 130 L256 82 L299 130 L348 105 L334 163 Z" fill="url(#gold)" stroke="#5d321f" stroke-width="7" stroke-linejoin="round"/>
<path d="M185 170 L327 170 L324 193 L188 193 Z" fill="url(#gold)" stroke="#5d321f" stroke-width="5"/>
<circle cx="256" cy="168" r="9" fill="#6d1529" stroke="#f4d799" stroke-width="3"/>
</svg>
'''.strip()
(OUT/'icons').mkdir(parents=True,exist_ok=True)
(OUT/'icons'/'icon.svg').write_text(icon,encoding='utf-8')
import cairosvg
for size in (192,512):
    cairosvg.svg2png(bytestring=icon.encode('utf-8'),write_to=str(OUT/'icons'/f'icon-{size}.png'),output_width=size,output_height=size)
manifest={'name':'Taverna do MAU MAU — Beta','short_name':'Taverna Beta','description':'Jogo de cartas medieval, modo offline e multiplayer Beta independente','id':'./','start_url':'./','scope':'./','display':'standalone','background_color':'#190b12','theme_color':'#43202b','lang':'pt-BR','icons':[{'src':f'icons/icon-{n}.png','sizes':f'{n}x{n}','type':'image/png','purpose':'any maskable'} for n in (192,512)]}
(OUT/'manifest.webmanifest').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
sw=r"""
const CACHE='taverna-beta-v91-pwa-01';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(async cache=>{
 await Promise.allSettled(ASSETS.map(asset=>cache.add(asset)));
}).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('taverna-beta-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 event.respondWith(fetch(event.request,event.request.mode==='navigate'?{cache:'no-store'}:undefined).then(response=>{
  if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{}))}
  return response;
 }).catch(async()=>(await caches.match(event.request,{ignoreSearch:true}))||(event.request.mode==='navigate'?await caches.match('./index.html'):undefined)||Response.error()));
});
"""
(OUT/'sw.js').write_text(sw,encoding='utf-8')
print('BETA_ASSEMBLED',len(html.encode('utf-8')), 'bytes',len(delta['ops']),'audited delta operations')
