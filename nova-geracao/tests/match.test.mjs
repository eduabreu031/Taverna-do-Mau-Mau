import test from 'node:test';
import assert from 'node:assert/strict';
import {freshDeck,createMatch,applyAction,canPlay,viewFor,chooseBotAction,nextRound} from '../src/core/match.js';
const c=(id,rank,suit)=>Object.freeze({id,rank,suit});
function game({hand=[c('p1','9','♣')],bot=[c('b1','3','♠')],top=c('t1','9','♥'),extra={}}={}){
 return {players:[{id:'voce',alive:true,hand:hand.slice()},{id:'bot1',alive:true,hand:bot.slice()}],deck:[c('d1','2','♦'),c('d2','3','♦'),c('d3','4','♣'),c('d4','5','♠'),c('d5','6','♠'),c('d6','7','♣'),c('d7','8','♦'),c('d8','K','♠')],discard:[top],turn:0,direction:1,activeSuit:top.suit,drawn:false,pendingSeven:0,mauAnnouncements:{},phase:'playing',round:1,revision:1,winner:null,...extra};
}
test('baralhos até 10 pessoas: ids exclusivos e cartas congeladas',()=>{
 for(const n of [2,5,10]){
  const deck=freshDeck(n,()=>.41);assert.equal(new Set(deck.map(c=>c.id)).size,deck.length);assert.ok(deck.length>=n*12+1);assert.ok(deck.every(Object.isFrozen));
  const match=createMatch(Array.from({length:n},(_,i)=>`p${i}`),()=>.41);assert.equal(match.players.length,n);assert.ok(match.players.every(p=>p.hand.length===5));
 }
});
test('9 sobre 9, inclusive naipes diferentes',()=>{
 const s=game({hand:[c('p9','9','♠'),c('rest','3','♥')]});assert.equal(canPlay(s.players[0].hand[0],s.discard[0]),true);
 const after=applyAction(s,'voce','play',{cardId:'p9'});assert.equal(after.discard.at(-1).id,'p9');assert.equal(after.discard.at(-1).rank,'9');assert.equal(after.players[0].hand.length,1);
});
test('valor igual em naipes diferentes e posições distintas',()=>{
 const s=game({hand:[c('a','4','♠'),c('b','9','♣'),c('c','9','♦')]});assert.equal(canPlay(s.players[0].hand[2],s.discard[0]),true);
 const a=applyAction(s,'voce','play',{cardId:'c'});assert.deepEqual(a.players[0].hand.map(x=>x.id),['a','b']);assert.equal(a.discard.at(-1).id,'c');
});
test('comprar e jogar carta comprada, sem perder identidade',()=>{
 const s=game({hand:[c('old','5','♥')],top:c('top','K','♠')});s.deck.push(c('drawn','K','♦'));
 const a=applyAction(s,'voce','draw');assert.equal(a.drawn,true);assert.equal(a.players[0].hand.at(-1).id,'drawn');
 const b=applyAction(a,'voce','play',{cardId:'drawn'});assert.equal(b.discard.at(-1).id,'drawn');assert.equal(s.players[0].hand.length,1);
});
test('seleção por id sobrevive à mudança da mão',()=>{
 const s=game({hand:[c('a','2','♥'),c('b','9','♣'),c('c','3','♦')]});const id=s.players[0].hand[1].id;
 const a=applyAction(s,'voce','draw');const b=applyAction(a,'voce','play',{cardId:id});assert.equal(b.discard.at(-1).id,id);
});
test('carta inexistente é rejeitada atomicamente',()=>{
 const s=game({hand:[c('a','9','♣'),c('b','4','♥')]});const original=JSON.stringify(s);
 assert.throws(()=>applyAction(s,'voce','play',{cardId:'fantasma'}),/não pertence/);assert.equal(JSON.stringify(s),original);
});
test('carta que virou descarte mantém seus atributos',()=>{
 const s=game({hand:[c('a','9','♣'),c('b','5','♥')]});const before=s.players[0].hand[0];const after=applyAction(s,'voce','play',{cardId:'a'});
 assert.strictEqual(after.discard.at(-1),before);assert.equal(after.discard.at(-1).suit,'♣');assert.equal(before.rank,'9');
});
test('dama inverte direção e mantém a vez em duelo',()=>{
 const s=game({hand:[c('q','Q','♥'),c('x','2','♠')],top:c('t','2','♥')});const n=applyAction(s,'voce','play',{cardId:'q'});
 assert.equal(n.direction,-1);assert.equal(n.turn,0);
});
test('ás pula o próximo jogador em 3 jogadores',()=>{
 const s=game({hand:[c('ace','A','♥'),c('x','4','♠')],top:c('t','5','♥')});s.players.push({id:'bot2',alive:true,hand:[c('t2','6','♠')]});
 const n=applyAction(s,'voce','play',{cardId:'ace'});assert.equal(n.players[n.turn].id,'bot2');
});
test('9 penaliza jogador anterior, mantendo efeito no duelo',()=>{
 const s=game({hand:[c('nine','9','♠'),c('x','2','♥')]});const n=applyAction(s,'voce','play',{cardId:'nine'});
 assert.equal(n.players[1].hand.length,2);assert.equal(n.turn,0);
});
test('7 gera dívida de cinco e quem recusa compra 5',()=>{
 const s=game({hand:[c('seven','7','♥'),c('x','2','♣')],top:c('t','5','♥')});const a=applyAction(s,'voce','play',{cardId:'seven'});
 assert.equal(a.pendingSeven,5);assert.equal(a.turn,1);
 const b=applyAction(a,'bot1','take_seven');assert.equal(b.pendingSeven,0);assert.equal(b.players[1].hand.length,6);
});
test('estouro do relógio com 7 soma dívida e multa',()=>{
 const s=game({extra:{pendingSeven:5}});const a=applyAction(s,'voce','timeout');assert.equal(a.players[0].hand.length,8);assert.equal(a.pendingSeven,0);assert.equal(a.turn,1);
});
test('valete troca naipe e responde ao 7',()=>{
 const s=game({hand:[c('j','J','♥'),c('x','4','♣')],extra:{pendingSeven:5}});
 const a=applyAction(s,'voce','play',{cardId:'j',suit:'♣'});assert.equal(a.pendingSeven,0);assert.equal(a.activeSuit,'♣');
});
test('anúncio com duas cartas não exige seleção',()=>{
 const s=game({hand:[c('a','5','♠'),c('b','4','♣')]});const a=applyAction(s,'voce','mau');assert.equal(a.mauAnnouncements.voce,true);assert.equal(a.players[0].hand.length,2);
 assert.throws(()=>applyAction(a,'voce','mau'));
});
test('compra apenas uma por vez; passar sem comprar é inválido',()=>{
 const s=game({hand:[c('a','5','♠'),c('b','4','♣')]});assert.throws(()=>applyAction(s,'voce','pass'));
 const a=applyAction(s,'voce','draw');assert.throws(()=>applyAction(a,'voce','draw'));const b=applyAction(a,'voce','pass');assert.equal(b.turn,1);
});
test('visual público não expõe as cartas de outros jogadores',()=>{
 const s=game();const v=viewFor(s,'voce');assert.ok(!('hand' in v.players[1]));assert.equal(v.hand[0].id,'p1');
});
test('bot escolhe ação legal, não contorna validador',()=>{
 const s=game({hand:[c('a','2','♥')],bot:[c('bot-c','9','♠'),c('other','4','♥')],extra:{turn:1}});
 const a=chooseBotAction(s,'bot1');assert.equal(a.kind,'mau');
 const announced=applyAction(s,'bot1','mau');const b=chooseBotAction(announced,'bot1');assert.equal(b.kind,'play');const cstate=applyAction(announced,'bot1','play',{cardId:b.cardId});assert.equal(cstate.discard.at(-1).id,b.cardId);
});
test('todas as jogadas sequenciais mantêm IDs e atributos',()=>{
 const s=game({hand:[c('a','9','♣'),c('b','9','♦'),c('c','3','♣')],bot:[c('bot','9','♠'),c('bx','2','♥')]});
 const orig=new Map([...s.players.flatMap(p=>p.hand),...s.deck,...s.discard].map(c=>[c.id,`${c.rank}${c.suit}`]));
 const a=applyAction(s,'voce','play',{cardId:'b'});const b=applyAction(a,'voce','play',{cardId:'a'});
 for(const card of [...b.players.flatMap(p=>p.hand),...b.deck,...b.discard])assert.equal(`${card.rank}${card.suit}`,orig.get(card.id));
});
test('próxima rodada elimina maior pontuação sem reanimar IDs antigos',()=>{
 const s=game({hand:[],bot:[c('b','K','♠')],extra:{phase:'scoring',winner:'voce',scoring:{scores:[{id:'voce',points:0},{id:'bot1',points:10}],eliminated:['bot1']}}});
 const n=nextRound(s,()=>.4);assert.equal(n.phase,'finished');assert.equal(n.winner,'voce');
});