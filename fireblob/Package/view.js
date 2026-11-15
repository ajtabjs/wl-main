window.addEventListener("touchstart", function(e){
    e.preventDefault();
}, {passive : false});
window.addEventListener("touchmove", function(e){
    e.preventDefault();
}, {passive : false});
window.addEventListener("touchcancel", function(e){
    e.preventDefault();
}, {passive : false});
window.addEventListener("touchend", function(e){
    e.preventDefault();
}, {passive : false});

window.document.addEventListener("touchstart", function(e){
    e.preventDefault();
}, {passive : false});
window.document.addEventListener("touchmove", function(e){
    e.preventDefault();
}, {passive : false});
window.document.addEventListener("touchcancel", function(e){
    e.preventDefault();
}, {passive : false});
window.document.addEventListener("touchend", function(e){
    e.preventDefault();
}, {passive : false});

window.addEventListener('gesturestart', function(e){
    e.preventDefault();
}, {passive : false});
window.addEventListener('gesturechange', function(e){
    e.preventDefault();
}, {passive : false});
window.addEventListener('gestureend', function(e){
    e.preventDefault();
}, {passive : false});

window.document.addEventListener('gesturestart', function(e){
    e.preventDefault();
}, {passive : false});
window.document.addEventListener('gesturechange', function(e){
    e.preventDefault();
}, {passive : false});
window.document.addEventListener('gestureend', function(e){
    e.preventDefault();
}, {passive : false});

function startView(){
    var gameFrame = document.getElementById("gameFrame");
    var win = window;
    gameFrame.style.display = "block";
    gameFrame.style.position = "absolute";
    gameFrame.style.top = "0px";
    gameFrame.style.left = "0px";
    var innerWidth = 0;
    var innerHeight = 0;
    var clientWidth = 0;
    var clientHeight = 0;
    var ua = window.navigator.userAgent;
    var iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
    var webkit = !!ua.match(/WebKit/i);
    var iOSSafari = iOS && webkit && !ua.match(/CriOS/i);
    var needIOSFix = iOSSafari;//screen.orientation == null || screen.orientation == undefined;
    function fixScroll(){
        window.scrollTo(0, -1);
    }
    function fixView(){  
        innerWidth = window.innerWidth;
        innerHeight = window.innerHeight;
        clientWidth = document.documentElement.clientWidth;
        clientHeight = document.documentElement.clientHeight;
        gameFrame.style.width = "100%";
        var height = Math.round((window.innerHeight / document.documentElement.clientHeight) * 100);
        height = height > 100 ? 100 : height;
        gameFrame.style.height = height + "%";
        if(needIOSFix){
            fixScroll();
        }
    }
    function checkFixView(){
        var scroll = window.scrollY || window.scrollTop || document.getElementsByTagName("html")[0].scrollTop;
        if(innerWidth != window.innerWidth || innerHeight != window.innerHeight || clientWidth != document.documentElement.clientWidth || clientHeight != document.documentElement.clientHeight){
            fixView();
        }
        else if(scroll > 0 && needIOSFix){
            fixScroll();
        }
        setTimeout(checkFixView, 500);
    }
    document.body.onresize = function(){
        fixView();
    }
    window.onfocus = function(){
        fixView();
    }
    window.onfocusout = function(){
        fixView();
    }
    window.onblur = function(){
        fixView();
    }
    document.addEventListener("visibilitychange", function(){
        fixView();
    });
    gameFrame.onfocus = function(){
        fixView();
    }
    gameFrame.onfocusout = function(){
        fixView();
    }
    gameFrame.onblur = function(){
        fixView();
    }
    gameFrame.addEventListener("visibilitychange", function(){
        fixView();
    });
    if(win.Game.fixViewHandler == null || win.Game.fixViewHandler == undefined){
        console.error("ERROR: AD FIX VIEW HANDLER");
    }
    else{
        win.Game.fixViewHandler = function(){
            fixView();
        }
    }
    window.onorientationchange = function() { 
        fixView();
        var orientation = screen.orientation;
        if(orientation == "portrait-secondary" || orientation == "portrait-primary"){
            fixScroll();
        }
    };
    //fixView();
    checkFixView();
};
window.addEventListener("load", startView);