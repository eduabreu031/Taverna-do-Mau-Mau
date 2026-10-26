import Phaser from 'phaser';
import {createMatch,applyAction,viewFor,chooseBotAction,canPlay,SUITS,nextRound} from './core/match.js';
import {TavernScene} from './scenes/TavernScene.js';
import './styles.css';
const el=id=>document.getElementById(id);
const game=new Phaser.Game({type:Phaser.WEBGL,parent:'game',width:1280,height:780,backgroundColor:'#160a14',
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true,roundPixels:false},scene:[TavernScene]});
let state=null,selectedId=null,token=0,clockTimer=null,botTimer=null,deadline=0,busy=false;
const viewer='voce';
const scene=()=>game.scene.getScene('TavernScene');
function cleanupTimers(){clearInterval(clockTimer);clearTimeout(botTimer);clockTimer=null;botTimer=null;token++;deadline=0;}
function notify(message){el('status-text').textContent=message;}
function update(){
 if(!state)return;
 const v=viewFor(state,viewer),me=state.players.find(p=>p.id===viewer),myTurn=v.phase==='playing'&&v.turnPlayerId===viewer;
 const selected=me.hand.find(c=>c.id===selectedId);if(!selected)selectedId=null;
 scene().setView(v,selectedId,id=>{if(!myTurn||busy)return;selectedId=selectedId===id?null:id;update();});
 el('turn-label').textContent=v.phase==='playing'?(myTurn?'Sua vez de jogar':`Vez de ${v.turnPlayerId.replace('bot','Jogador ')}`):v.phase==='finished'?`Vencedor: ${v.winner}`:'Fim de rodada';
 el('play').disabled=!myTurn||!selectedId||busy;el('draw').disabled=!myTurn||v.drawn||!!v.pendingSeven||busy;
 el('pass').disabled=!myTurn||(!v.drawn&&!v.pendingSeven)||busy;
 el('pass').textContent=v.pendingSeven?'Aceitar +5':'Passar';
 el('mau').disabled=!myTurn||me.hand.length!==2||!!v.mauAnnouncements[viewer]||busy;
 if(v.phase==='scoring')notify(`Rodada concluída! ${v.winner} venceu. O próximo round pode ser iniciado pela opção Nova mesa nesta prévia.`);
 else if(v.phase==='finished')notify(`${v.winner==='voce'?'Você venceu!':v.winner.replace('bot','Jogador ')+' venceu!'} A partida terminou.`);
 else notify(v.notice||'');
}
function startTurnClock(){
 clearInterval(clockTimer);clockTimer=null;if(!state||state.phase!=='playing'||state.players[state.turn].id!==viewer)return;
 deadline=performance.now()+15000;clockTimer=setInterval(()=>{
  const left=Math.max(0,deadline-performance.now());el('clock').textContent=`${Math.ceil(left/1000)}s`;
  if(left<=0){clearInterval(clockTimer);clockTimer=null;if(state.phase==='playing'&&state.players[state.turn].id===viewer)dispatch('timeout');}
 },100);
}
function scheduleCurrent(){
 if(!state||state.phase!=='playing'){el('clock').textContent='';return;}
 if(state.players[state.turn].id===viewer){startTurnClock();return;}
 el('clock').textContent='';const currentToken=token,botId=state.players[state.turn].id;
 botTimer=setTimeout(()=>{if(currentToken!==token||state.phase!=='playing'||state.players[state.turn].id!==botId)return;
  const a=chooseBotAction(state,botId);dispatch(a.kind,{cardId:a.cardId,suit:a.suit});
 },3000+Math.floor(Math.random()*2001));
}
function dispatch(kind,options={}){
 if(!state||busy)return;
 const playerId=state.players[state.turn].id;
 try{
  const old=state;const next=applyAction(state,playerId,kind,options);const isHuman=playerId===viewer;
  if(kind==='mau'&&isHuman){state=next;update();return;}
  cleanupTimers();state=next;selectedId=null;busy=kind==='draw'&&isHuman;
  update();
  if(busy){const currentToken=token;notify('Carta comprada · animação da compra não consome seu tempo de decisão');setTimeout(()=>{if(currentToken!==token||!state)return;busy=false;update();scheduleCurrent()},450);}
  else if(kind==='mau'&&isHuman){scheduleCurrent();}
  else scheduleCurrent();
  if(old.turn!==next.turn&&next.players[next.turn].id===viewer&&kind==='play'&&old.players[old.turn].id!==viewer)el('clock').textContent='15s';
 }catch(err){notify(err.message);}
}
el('start').addEventListener('click',()=>{
 cleanupTimers();const n=Number(el('bot-count').value);state=createMatch([viewer,...Array.from({length:n},(_,i)=>`bot${i+1}`)]);
 selectedId=null;busy=false;el('welcome').hidden=true;update();scheduleCurrent();
});
el('new-game').addEventListener('click',()=>{cleanupTimers();state=null;busy=false;selectedId=null;el('welcome').hidden=false;el('clock').textContent='';scene().setView(null,null,null);el('turn-label').textContent='Mesa ainda não iniciada';notify('Inicie uma mesa para explorar a nova base.');});
el('draw').addEventListener('click',()=>dispatch('draw'));
el('mau').addEventListener('click',()=>dispatch('mau'));
el('pass').addEventListener('click',()=>dispatch(state?.pendingSeven?'take_seven':'pass'));
el('play').addEventListener('click',()=>{
 if(!state||!selectedId)return;const card=state.players[state.turn].hand.find(c=>c.id===selectedId);if(!card)return;
 if(card.rank==='J'&&state.players[state.turn].hand.length>1){el('suit-dialog').hidden=false;return;}
 dispatch('play',{cardId:selectedId});
});
el('cancel-suit').addEventListener('click',()=>{el('suit-dialog').hidden=true});
for(const btn of el('suit-options').querySelectorAll('button'))btn.addEventListener('click',()=>{
 const suit=btn.dataset.suit;if(!SUITS.includes(suit))return;el('suit-dialog').hidden=true;dispatch('play',{cardId:selectedId,suit});
});