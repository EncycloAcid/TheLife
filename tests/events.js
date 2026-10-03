/* Event sweep: builds every event and runs every choice in many random lives
 * (modern, Rome, medieval England, the Viking Age, royal or not), both as-is
 * and right after quitting the current job, to catch events that outlive
 * the career or person they were about. Run: node tests/events.js [lives] */
var fs=require('fs'),vm=require('vm'),path=require('path');var ctx={console,Math,Date,JSON};ctx.globalThis=ctx;vm.createContext(ctx);
['util','data','realdata','logofiles','logos','engine','events','actions','features','extras','world','hoops','nba','hoopsocial','phone','military','sports','creator','acting','music','prosports','politics','work','business','health','market','history','ancient','medieval','viking','eras','mapdata','maps','recap'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(__dirname,'../game/js/'+f+'.js'),'utf8'),ctx,{filename:f+'.js'}));
var TL=ctx.TL,E=TL.engine,dialogs=[];TL.ui={menu(){},back(){},closeAll(){},refresh(){},toast(){},alert(t,x,c,cb){},choose(){},confirm(){},prompt(){},runPending(){},timeMachine(){}};
var ids=Object.keys(TL.events.defs),fails={},built={},runs=0;
var countries=['United States','United Kingdom','Japan','Roman Empire','Kingdom of England','Viking Norway'];
// Events the game always queues with their subject (a person, a crime): skipped without one.
var NEEDS_DATA=['funeral','spouse_leaves','pregnancy','crime_caught'];
var LIVES=+process.argv[2]||120;
for(var life=0;life<LIVES;life++){
  var c=countries[life%countries.length];E.newLife({country:c,royal:Math.random()<0.3,year:c==='Roman Empire'?60:c==='Kingdom of England'?1300:c==='Viking Norway'?950:undefined});
  var target=10+Math.floor(Math.random()*60),s=TL.S;
  // play forward with random menu taps via the normal engine so careers/relationships exist
  while(s.me.age<target&&!s.dead){s.pending=[];E.ageUp();s=TL.S;}
  if(s.dead)continue;
  var snap=JSON.stringify(s);
  ids.forEach(function(id){
    if(NEEDS_DATA.indexOf(id)>=0)return;
    for(var mode=0;mode<2;mode++){
      var ch=-1;
      do{ ch++;
        TL.S=JSON.parse(snap);
        if(mode===1&&TL.S.job){try{E.quitJob(true);}catch(e){}}
        var ev;try{ev=TL.events.build({id:id,data:{}});}catch(e){fails[id+' build']=e.message;break;}
        if(!ev)break;built[id]=1;
        if(ch>=ev.choices.length)break;
        TL.S.pending=[{id:id,data:{}}];
        try{TL.events.resolve(ch);runs++;}catch(e){fails[id+' choice '+ch+(mode?' (after quitting)':'')]=e.message+' @ '+(e.stack.split('\n')[1]||'').trim();}
      }while(ch<6);
    }
  });
}
console.log('events',ids.length,'ever built',Object.keys(built).length,'choices run',runs);
var n=Object.keys(fails).length;console.log(n?'FAILURES '+n:'OK every event and choice ran cleanly');Object.keys(fails).slice(0,40).forEach(k=>console.log(' ',k,'→',fails[k]));process.exit(n?1:0);
