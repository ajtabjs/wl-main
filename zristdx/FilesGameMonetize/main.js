window._unlockingAllLevels=false;
window._allLevelsUnlocked=false;
function unlockAllLevels(){window._unlockingAllLevels=true;}
window.addEventListener("load",function(){
    var Engine=window.Engine;
    var Game=window.Game;
    var adTest=false;
    var adTime=3.0*1000*60;
    var adTimeB=3.0*1000*60;
    var adDateOld=null;
    Game.TEXT_MORE_GAMES="+GAMES";
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
    Game.addAction("play",function(){
        adDateOld=Date.now();
    });
    function hasintads(){
        return adTest||((Date.now()-adDateOld>=adTime));
    }
    Game.triovecon=function(){
        if(!hasintads()){
            Game.endovecon();
            return;
        }
        Game.LevelAdLoader.show();
        window._adPauseGame=function(){
            Engine.System.pause();
            Game.mute();
        }
        window._adResumeGame=function(){
            Engine.System.resume();
            Game.endintads();
        }
        sdk.showBanner();
    }
    Game.endintads=function(){
        adTime=adTimeB;
        adDateOld=Date.now();
        Game.unmute();
        Game.LevelAdLoader.hide();
        window.focus();
        Game.endovecon();
    }
    var adsscr="";
    Game.hasrew=function(scr){
        adsscr=scr;
        scr=="nexrul"?Game.disnexrulads():Game.disgamoveads();
        scr=="nexrul"?Game.enanexrulads():Game.enagamoveads();
        return false;
    }
    Game.trioveads=function(){
        Game.LevelAdLoader.show();
        window._adPauseGame=function(){
            Engine.System.pause();
            Game.mute();
        }
        window._adResumeGame=function(){
            Engine.System.resume();
            endrewads();
        }
        sdk.showBanner();
    };
    Game.trinexads=function(){
        Game.LevelAdLoader.show();
        window._adPauseGame=function(){
            Engine.System.pause();
            Game.mute();
        }
        window._adResumeGame=function(){
            Engine.System.resume();
            endrewads();
        }
        sdk.showBanner();
    };
    function endrewads(){
        adTime=adTimeB;
        adDateOld=Date.now();
        Game.unmute();
        Game.LevelAdLoader.hide();
        window.focus();
        adsscr=="nexrul"?Game.endnexads():Game.endoveads();
    };
    function startGame(){
        if(!window._runGame){
            setTimeout(startGame,1.0/60.0);
            return;
        }
        Engine.System.run();
    }
    startGame();
});