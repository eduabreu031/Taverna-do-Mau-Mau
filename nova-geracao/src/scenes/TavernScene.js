import Phaser from 'phaser';
const W=1280,H=780;
const INK=0xe5cda2, GOLD=0xb88748, ROSE=0xd47192;
const SUIT_COLORS={'♠':'#d9ddeb','♥':'#c9425c','♦':'#c9425c','♣':'#263a38'};
function text(scene,x,y,str,size=20,color='#f9e8d5',opts={}){
 return scene.add.text(x,y,str,{fontFamily:'Georgia,serif',fontSize:`${size}px`,color,fontStyle:opts.bold?'bold':'normal',align:opts.align||'center',...opts.style}).setOrigin(.5);
}
export class TavernScene extends Phaser.Scene{
 constructor(){super({key:'TavernScene'});this.view=null;this.selectedId=null;this.nodes=[];this.onCard=null;this.lastNotice='';}
 create(){this.cameras.main.setBackgroundColor('#130810');this.createAtmosphere();this.add.rectangle(W/2,H/2,W-50,H-45,0x060309,.5).setStrokeStyle(4,0x654158).setDepth(0);
  this.add.rectangle(W/2,H/2,W-87,H-86,0x381225,1).setStrokeStyle(3,GOLD,.6).setDepth(1);
  this.add.image(W/2,H/2,'feltgrain').setDisplaySize(W-106,H-103).setDepth(2);
  this.add.rectangle(W/2,H/2,W-106,H-103,0x200916,.09).setStrokeStyle(2,0x66364d,.6).setDepth(3);
  text(this,640,105,'T A V E R N A   D O   M A U   M A U',23,'#ad6a79',{bold:true}).setAlpha(.44).setDepth(4);
  this.renderView();
 }
 createAtmosphere(){
  const c=document.createElement('canvas');c.width=512;c.height=320;
  const ctx=c.getContext('2d');const g=ctx.createLinearGradient(0,0,512,320);g.addColorStop(0,'#5e1d35');g.addColorStop(.43,'#4d162b');g.addColorStop(1,'#310e1e');ctx.fillStyle=g;ctx.fillRect(0,0,512,320);
  const light=ctx.createRadialGradient(260,115,10,260,115,390);light.addColorStop(0,'rgba(225,116,119,.19)');light.addColorStop(.6,'rgba(163,55,75,.05)');light.addColorStop(1,'rgba(0,0,0,.35)');ctx.fillStyle=light;ctx.fillRect(0,0,512,320);
  for(let i=0;i<5000;i++){let x=Math.random()*512,y=Math.random()*320;ctx.fillStyle=Math.random()>.5?'rgba(255,214,215,.027)':'rgba(0,0,0,.042)';ctx.fillRect(x,y,Math.random()*1.1+.25,.5);}
  this.textures.addCanvas('feltgrain',c);
 }
 setView(view,selectedId,onCard){this.view=view;this.selectedId=selectedId;this.onCard=onCard;if(this.sys.isActive())this.renderView();}
 track(node){node.setDepth(10);this.nodes.push(node);return node;}
 clear(){for(const n of this.nodes)n.destroy();this.nodes=[];}
 renderView(){this.clear();const view=this.view;if(!view){this.track(text(this,640,397,'A mesa aguarda os jogadores',22,'#dabca4').setAlpha(.75));return;}
  this.drawPiles(view);this.drawPlayers(view);this.drawHand(view);this.track(text(this,640,204,view.direction===1?'SENTIDO HORÁRIO':'SENTIDO ANTI-HORÁRIO',14,'#b69a99',{bold:true}).setAlpha(.9));
  if(view.notice&&view.notice!==this.lastNotice){this.lastNotice=view.notice;const notice=text(this,640,263,view.notice,21,'#ffe3b5',{bold:true});notice.setDepth(50);this.nodes.push(notice);this.tweens.add({targets:notice,alpha:0,y:249,delay:850,duration:900});}
 }
 makeCard(x,y,w,h,card,options={}){
  const back=options.back, selected=options.selected;const holder=this.track(this.add.container(x,y));
  const scale=selected?1.08:1;holder.setScale(scale);holder.setY(y-(selected?26:0));
  const shadow=this.add.rectangle(4,7,w,h,0x13070d,.58).setOrigin(.5).setStrokeStyle(0);shadow.setRadius?.(10);holder.add(shadow);
  const base=this.add.rectangle(0,0,w,h,back?0x3a1124:0xf4eadb).setStrokeStyle(back?2:1,back?0xd0a36a:0x725c57,.9);holder.add(base);
  if(back){
   holder.add(this.add.rectangle(0,0,w-9,h-9,0x551e35).setStrokeStyle(1,0xe8b273,.8));
   holder.add(this.add.rectangle(0,0,w-17,h-17,0x411427).setStrokeStyle(1,0xad7e69,.7));
   holder.add(text(this,0,0,'✦',Math.round(w*.34),'#d9ac71',{bold:true}));
  }else if(card){
   const suitColor=SUIT_COLORS[card.suit]||'#223';
   holder.add(text(this,-w*.28,-h*.34,card.rank,Math.max(15,w*.23),suitColor,{bold:true}));
   holder.add(text(this,0,1,card.suit,Math.max(20,w*.44),suitColor));
   holder.add(text(this,w*.27,h*.34,card.rank,Math.max(13,w*.18),suitColor,{bold:true}));
  }
  if(options.interactive){
   base.setInteractive({useHandCursor:true});base.on('pointerdown',()=>this.onCard?.(card.id));
   base.on('pointerover',()=>{if(this.selectedId!==card.id)holder.setY(y-11)});
   base.on('pointerout',()=>{if(this.selectedId!==card.id)holder.setY(y)});
  }
  return holder;
 }
 drawPiles(v){
  this.track(text(this,542,262,'COMPRA',15,'#c5aab0',{bold:true}));
  this.track(text(this,736,262,'DESCARTE',15,'#c5aab0',{bold:true}));
  for(let n=0;n<Math.min(3,Math.ceil(v.deckCount/24));n++)this.makeCard(544+n*2,359-n*3,98,141,null,{back:true});
  if(v.deckCount===0)this.track(text(this,543,351,'VAZIO',17,'#cbaab0'));
  this.makeCard(737,352,101,145,v.top);
  const pill=this.track(this.add.rectangle(640,470,260,42,0x220e1a,.93).setStrokeStyle(1,0xa46b76,.8));
  this.track(text(this,640,470,`NAIPE ATIVO    ${v.activeSuit}`,17,'#f5d7cd',{bold:true}));
  if(v.pendingSeven)this.track(text(this,640,507,`PENALIDADE DO 7 · +${v.pendingSeven}`,17,'#ffb8ac',{bold:true}));
 }
 seats(n){const standard=[[150,517],[150,383],[150,246],[402,166],[640,151],[878,166],[1130,246],[1130,383],[1130,517]];
  const picks={1:[4],2:[3,5],3:[2,4,6],4:[1,3,5,7],5:[1,3,4,5,7],6:[0,2,3,5,6,8],7:[0,2,3,4,5,6,8],8:[0,1,2,3,5,6,7,8],9:[0,1,2,3,4,5,6,7,8]};return (picks[n]||picks[9]).map(i=>standard[i]);}
 drawPlayers(v){
  const opponents=v.players.filter(p=>p.id!=='voce'&&p.alive);const pts=this.seats(opponents.length);
  opponents.forEach((p,i)=>{
   const [x,y]=pts[i];const active=p.id===v.turnPlayerId;
   if(active){this.track(this.add.rectangle(x,y,170,93,0x842d4b,.39).setStrokeStyle(3,ROSE,.95));}
   else this.track(this.add.rectangle(x,y,170,93,0x1e101a,.7).setStrokeStyle(1,0x72515c,.6));
   this.track(text(this,x,y-30,p.id.replace('bot','Jogador '),16,active?'#ffccd7':'#e4ced0',{bold:active}));
   const backs=Math.min(4,p.count);
   for(let n=0;n<backs;n++){this.makeCard(x+(n-(backs-1)/2)*24,y+13,36,48,null,{back:true});}
   this.track(text(this,x+68,y+33,`${p.count}`,13,'#ffe0bb',{bold:true}));
  });
 }
 drawHand(v){
  const hand=v.hand||[],active=v.turnPlayerId==='voce';
  if(active)this.track(this.add.rectangle(640,671,960,161,0x642840,.22).setStrokeStyle(3,ROSE,.9));
  this.track(text(this,640,562,`SUA MÃO · ${hand.length} CARTAS${active?' · SUA VEZ':''}`,17,active?'#ffe3d1':'#c39ca5',{bold:active}));
  const spacing=Math.min(77,850/Math.max(1,hand.length-1));
  hand.forEach((card,i)=>{
   const x=640+(i-(hand.length-1)/2)*spacing,y=683;
   this.makeCard(x,y,81,116,card,{selected:this.selectedId===card.id,interactive:active});
  });
 }
}

// Efeitos transitórios independentes de renderView: a animação jamais altera
// cartas ou estado. O ID real permanece sempre no motor de regras.
TavernScene.prototype.animateAction = function({kind,card,playerId,suit,skippedHuman=false}={}){
 if(!this.sys.isActive())return;
 const actorIsHuman=playerId==='voce';
 const from=kind==='draw'?[544,352]:actorIsHuman?[640,672]:[640,150];
 const to=kind==='draw'?[640,672]:[737,352];
 const overlay=this.add.container(0,0).setDepth(145);
 const play=kind==='play',draw=kind==='draw';
 if(play||draw){
  const tile=this.add.rectangle(from[0],from[1],91,130,draw?0x49203b:0xf3e4d1,1)
   .setStrokeStyle(3,draw?0xe1b277:0xb88966);
  const title=text(this,from[0],from[1],draw?'✦':`${card?.rank||''}${card?.suit||''}`,31,draw?'#e7b97e':'#5d2436',{bold:true});
  overlay.add([tile,title]);
  this.tweens.add({targets:[tile,title],x:to[0],y:to[1],scaleX:.88,scaleY:.88,ease:'Cubic.easeInOut',duration:420,onComplete:()=>overlay.destroy()});
 }else if(kind==='mau'){
  const stamp=text(this,640,360,'MAU MAU!',55,'#ffd5a8',{bold:true});overlay.add(stamp);
  this.tweens.add({targets:stamp,alpha:0,scale:1.4,y:305,duration:1100,ease:'Cubic.easeOut',onComplete:()=>overlay.destroy()});
 }else if(kind==='take_seven'||kind==='timeout'){
  const stamp=text(this,640,350,kind==='timeout'?'TEMPO ESGOTADO!':'+5 CARTAS',34,'#ffb5ab',{bold:true});overlay.add(stamp);
  this.tweens.add({targets:stamp,alpha:0,y:280,duration:1000,onComplete:()=>overlay.destroy()});
 }else{overlay.destroy();}
 if(play&&card){
  const message=card.rank==='Q'?'SENTIDO INVERTIDO!':card.rank==='A'?'PULOU!':card.rank==='J'?`NAIPE ${suit||card.suit}`:card.rank==='7'?'PENALIDADE +5':card.rank==='9'?'VOLTA A JOGAR':'';
  if(message){const label=text(this,640,290,message,31,'#ffd59b',{bold:true}).setDepth(150);
   this.tweens.add({targets:label,alpha:0,y:240,delay:450,duration:850,onComplete:()=>label.destroy()});}
 }
 if(skippedHuman){const label=text(this,640,610,'PULADO!',57,'#ffb8cf',{bold:true}).setDepth(151);
  this.tweens.add({targets:label,alpha:0,scale:1.36,y:560,delay:350,duration:1000,onComplete:()=>label.destroy()});}
};
