window._unlockingAllLevels=false;
window._allLevelsUnlocked=false;
function unlockAllLevels(){window._unlockingAllLevels=true;}
window.addEventListener("load",function(){
    var Engine=window.Engine;
    var Game=window.Game;
    var testMode=false;
    var adTime=3.0*1000*60;
    var adTimeB=3.0*1000*60;
    var canTriggerOnWin=true;
    var canTriggerOnReset=true;
    var canTriggerOnLose=true;
    var canTriggerOnEvent=true;
    var canTriggerOnSpeedrun=false;
    var adTimerStarted=false;
    var adDateOld=null;
    Game.TEXT_MORE_GAMES="+GAMES";
    var checkAdTrigger=function(canTrigger){
        if(!adTimerStarted){
            adDateOld=Date.now();
            window._adPauseGame=function(){Game.mute();}
            window._adResumeGame=function(){
                adTime=adTimeB;
                Game.LevelAdLoader.hide(canTriggerOnSpeedrun);
                Game.unmute();
                adDateOld=Date.now();
                window.focus();
            };
            adTimerStarted=true;
            return;
        }
        if(testMode){
            requestMidAd();
            return;
        }
        if(!canTrigger||((Date.now()-adDateOld<=adTime)))return;
        requestMidAd(); 
    }
    var requestMidAd=function(){
        if(typeof sdk!=='undefined'&&sdk.showBanner!=='undefined'){
            Game.LevelAdLoader.show();
            sdk.showBanner();
        }
    }
    Game.addAction("presstocontinue",function(){
        window._adPauseGame=function(){
            Engine.System.pause();
            Game.mute();
        };
        window._adResumeGame=function(){
            Engine.System.resume();
            Game.unmute();
            adDateOld=Date.now();
            window.focus();
        };
        sdk.showBanner();
    });
    Game.addAction("winlevel",function(){checkAdTrigger(canTriggerOnWin&&(!Game.Level.speedrun||canTriggerOnSpeedrun));});
    Game.addAction("winlastlevel",function(){checkAdTrigger(canTriggerOnEvent);});
    Game.addAction("loselevel",function(){checkAdTrigger(canTriggerOnLose&&(!Game.Level.speedrun||canTriggerOnSpeedrun));});
    Game.addAction("resetlevel",function(){checkAdTrigger(canTriggerOnReset&&(!Game.Level.speedrun||canTriggerOnSpeedrun));});
    Game.addAction("exitlevel",function(){checkAdTrigger(canTriggerOnEvent);});
    Game.addAction("exitlastlevel",function(){checkAdTrigger(canTriggerOnEvent);});
    function startGame(){
        if(!window._runGame){
            setTimeout(startGame,1.0/60.0);
            return;
        }
        Engine.System.run();
    }
    startGame();
});