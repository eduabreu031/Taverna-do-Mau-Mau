/** Motor offline do laboratório. Compatível com um SUBCONJUNTO documentado das regras atuais.
 * Não é a autoridade do multiplayer e NÃO deve substituir o Worker de produção.
 * Toda ação é calculada com IDs imutáveis; coordenadas/animações não participam da validação.
 */
export const SUITS = Object.freeze(['♠','♥','♦','♣']);
export const RANKS = Object.freeze(['A','2','3','4','5','6','7','8','9','10','J','Q','K']);
export const isSameCard = (a,b) => !!a && !!b && a.id === b.id;
export const canPlay = (card,top,activeSuit=top?.suit) => !!card && !!top && (card.rank==='J' || card.rank===top.rank || card.suit===activeSuit);
const clone=s=>({...s,players:s.players.map(p=>({...p,hand:p.hand.slice()})),deck:s.deck.slice(),discard:s.discard.slice(),mauAnnouncements:{...s.mauAnnouncements}});
const living=s=>s.players.filter(p=>p.alive).length;
function shuffle(items,rng){for(let i=items.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[items[j],items[i]]=[items[i],items[j]]}return items;}
export function freshDeck(playerCount=2,rng=Math.random){
 const cards=[];let id=0;const count=Math.ceil((12*playerCount+1)/52);
 for(let d=1;d<=count;d++)for(const suit of SUITS)for(const rank of RANKS)cards.push(Object.freeze({id:`c${++id}`,suit,rank}));
 return shuffle(cards,rng);
}
export function createMatch(playerIds,rng=Math.random){
 if(!Array.isArray(playerIds)||playerIds.length<2||playerIds.length>10||new Set(playerIds).size!==playerIds.length)throw Error('Necessários 2 a 10 jogadores únicos');
 const deck=freshDeck(playerIds.length,rng),players=playerIds.map(id=>({id,alive:true,hand:deck.splice(0,5)}));
 const index=deck.findIndex(c=>!['A','7','J','Q'].includes(c.rank));if(index<0)throw Error('Sem descarte inicial');
 const [first]=deck.splice(index,1);
 return {players,deck,discard:[first],turn:0,direction:1,activeSuit:first.suit,drawn:false,pendingSeven:0,mauAnnouncements:{},phase:'playing',winner:null,round:1,starterIndex:0,revision:1,notice:'Mesa aberta'};
}
function advance(s,skip=0){
 let pos=s.turn;
 for(let i=0;i<=skip;i++){
  let guard=0;do{pos=(pos+s.direction+s.players.length)%s.players.length;if(++guard>s.players.length)throw Error('Sem jogador elegível')}while(!s.players[pos].alive);
 }
 s.turn=pos;s.drawn=false;
}
function take(s,p,count,rng){
 const received=[];
 for(let n=0;n<count;n++){
  if(!s.deck.length&&s.discard.length>1){const top=s.discard.pop();s.deck=shuffle(s.discard.splice(0),rng);s.discard.push(top);}
  if(!s.deck.length)break;
  const card=s.deck.pop();p.hand.push(card);received.push(card);
 }
 return received;
}
function scoreRound(s,winnerId){
 const alive=s.players.filter(p=>p.alive);
 if(alive.length<=2){s.phase='finished';s.winner=winnerId;return;}
 s.phase='scoring';s.winner=winnerId;
 const points=c=>c.rank==='A'?1:['J','Q','K'].includes(c.rank)?10:Number(c.rank);
 const scores=alive.map(p=>({id:p.id,points:p.id===winnerId?0:p.hand.reduce((v,c)=>v+points(c),0)}));
 const max=Math.max(...scores.filter(x=>x.id!==winnerId).map(x=>x.points));
 s.scoring={scores,eliminated:scores.filter(x=>x.id!==winnerId&&x.points===max).map(x=>x.id)};
}
export function applyAction(before,playerId,action,{cardId,suit,rng=Math.random}={}){
 if(before.phase!=='playing')throw Error('Rodada não está ativa');
 const current=before.players[before.turn];if(!current||current.id!==playerId||!current.alive)throw Error('Fora de vez');
 const s=clone(before),p=s.players[s.turn];
 if(action==='mau'){
  if(p.hand.length!==2||s.mauAnnouncements[playerId])throw Error('MAU MAU exige duas cartas, sem anúncio prévio');
  s.mauAnnouncements[playerId]=true;s.notice=`${playerId} anunciou MAU MAU!`;
 }else if(action==='play'){
  const index=p.hand.findIndex(c=>c.id===cardId);if(index===-1)throw Error('Carta não pertence à mão');
  const card=p.hand[index],top=s.discard.at(-1),debt=s.pendingSeven;
  if(debt&&!['7','J'].includes(card.rank))throw Error('Responda ao 7');
  if(!debt&&!canPlay(card,top,s.activeSuit))throw Error('Blefe/OPA pendente da fase de compatibilidade');
  if(card.rank==='J'&&!SUITS.includes(suit)&&p.hand.length>1)throw Error('Escolha um naipe');
  p.hand.splice(index,1);s.discard.push(card);
  delete s.mauAnnouncements[playerId];s.activeSuit=card.rank==='J'&&SUITS.includes(suit)?suit:card.suit;
  if(card.rank==='7')s.pendingSeven=5;
  if(card.rank==='J'&&debt)s.pendingSeven=0;
  if(!p.hand.length){scoreRound(s,playerId);s.notice=`${playerId} venceu a rodada!`;}
  else{
   if(card.rank==='Q')s.direction*=-1;
   if(card.rank==='9'){
    let prev=s.turn;do{prev=(prev-s.direction+s.players.length)%s.players.length}while(!s.players[prev].alive);
    take(s,s.players[prev],1,rng);
   }
   if((card.rank==='Q'||card.rank==='9')&&living(s)===2){s.drawn=false;}
   else advance(s,card.rank==='A'?1:0);
   s.notice=`${playerId} jogou ${card.rank}${card.suit}${card.rank==='Q'?' · sentido invertido':''}${card.rank==='A'?' · próximo pulado':''}`;
  }
 }else if(action==='draw'){
  if(s.pendingSeven)throw Error('Aceite a dívida do 7');if(s.drawn)throw Error('Compra já realizada');
  if(!take(s,p,1,rng).length)throw Error('Sem cartas');s.drawn=true;delete s.mauAnnouncements[playerId];s.notice=`${playerId} comprou uma carta`;
 }else if(action==='pass'){
  if(s.pendingSeven||!s.drawn)throw Error('Compre antes de passar');
  advance(s);delete s.mauAnnouncements[playerId];s.notice=`${playerId} passou a vez`;
 }else if(action==='take_seven'){
  if(!s.pendingSeven)throw Error('Sem dívida do 7');take(s,p,s.pendingSeven,rng);s.pendingSeven=0;delete s.mauAnnouncements[playerId];advance(s);s.notice=`${playerId} aceitou a penalidade do 7`;
 }else if(action==='timeout'){
  const n=s.pendingSeven+2;s.pendingSeven=0;take(s,p,n,rng);delete s.mauAnnouncements[playerId];advance(s);s.notice=`${playerId} perdeu o prazo`;
 }else throw Error('Ação ainda não portada');
 s.revision=before.revision+1;
 return s;
}
export function nextRound(before,rng=Math.random){
 if(before.phase!=='scoring'||!before.scoring)throw Error('Aguardando apuração');
 const s=clone(before),out=new Set(s.scoring.eliminated);
 s.players.forEach(p=>{if(out.has(p.id)){p.alive=false;p.hand=[];}});
 if(living(s)===1){s.phase='finished';s.winner=s.players.find(p=>p.alive).id;s.scoring=null;return s;}
 const deck=freshDeck(s.players.length,rng);s.players.forEach(p=>{p.hand=p.alive?deck.splice(0,5):[]});
 const ix=deck.findIndex(c=>!['A','7','J','Q'].includes(c.rank));const [first]=deck.splice(ix,1);
 s.deck=deck;s.discard=[first];s.activeSuit=first.suit;s.direction=1;s.pendingSeven=0;s.drawn=false;s.mauAnnouncements={};s.round++;
 let starter=Number.isInteger(s.starterIndex)?s.starterIndex:0;
 do{starter=(starter+1)%s.players.length;}while(!s.players[starter].alive);
 s.starterIndex=starter;s.turn=starter;s.phase='playing';s.scoring=null;s.winner=null;s.revision++;s.notice=`Rodada ${s.round}`;return s;
}
export function viewFor(s,viewerId){
 return {phase:s.phase,revision:s.revision,round:s.round,winner:s.winner,scoring:s.scoring||null,turnPlayerId:s.players[s.turn].id,direction:s.direction,activeSuit:s.activeSuit,top:s.discard.at(-1),deckCount:s.deck.length,players:s.players.map(p=>({id:p.id,alive:p.alive,count:p.hand.length})),hand:s.players.find(p=>p.id===viewerId)?.hand.slice()||[],drawn:s.drawn,pendingSeven:s.pendingSeven,mauAnnouncements:{...s.mauAnnouncements},notice:s.notice};
}
export function chooseBotAction(s,id){
 const p=s.players.find(p=>p.id===id);if(!p)throw Error('Bot não encontrado');
 if(s.pendingSeven){const answer=p.hand.find(c=>c.rank==='7'||c.rank==='J');return answer?{kind:'play',cardId:answer.id,suit:answer.rank==='J'?SUITS[0]:undefined}:{kind:'take_seven'};}
 const playable=p.hand.filter(c=>canPlay(c,s.discard.at(-1),s.activeSuit));
 if(playable.length){
  const card=playable.find(c=>c.rank!=='J')||playable[0];
  if(p.hand.length===2&&!s.mauAnnouncements[id])return {kind:'mau'};
  const remaining=p.hand.filter(c=>c.id!==card.id);const suit=card.rank==='J'?SUITS.reduce((best,x)=>remaining.filter(c=>c.suit===x).length>remaining.filter(c=>c.suit===best).length?x:best,SUITS[0]):undefined;
  return {kind:'play',cardId:card.id,suit};
 }
 return {kind:s.drawn?'pass':'draw'};
}