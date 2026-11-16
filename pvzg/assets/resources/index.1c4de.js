System.register("chunks:///_virtual/MultiLanguage.ts",["./rollupPluginModLoBabelHelpers.js","cc"],(function(n){var t,e,r,i,u;return{setters:[function(n){t=n.inheritsLoose,e=n.createClass},function(n){r=n.cclegacy,i=n._decorator,u=n.Component}],execute:function(){var a,o;r._RF.push({},"9a848kkozpCxLQ/C3LpYcys","MultiLanguage",void 0);var l=i.ccclass,s=(i.property,n("LanguageEnum",function(n){return n[n.EN=0]="EN",n[n.ZH=1]="ZH",n[n.amount=2]="amount",n}({})));n("MultiLanguage",l("MultiLanguage")(((o=function(n){function r(){for(var t,e=arguments.length,r=new Array(e),i=0;i<e;i++)r[i]=arguments[i];return(t=n.call.apply(n,[this].concat(r))||this).en="",t.zh="",t}return t(r,n),r.getTipString=function(){var n,t=null==(n=this.lyrics)?void 0:n.LoadingTips;return null!=t&&t.length?this.getString(t[Math.floor(t.length*Math.random())]):""},r.getNumberWithThousandComma=function(n){for(var t=Math.round(n),e=[];t>0;)e.push(t%1e3),t=Math.floor(t/1e3);var r="";return 0==Math.round(n)?r="0":e.reverse().forEach((function(n,t){for(var i=n.toString();0!=t&&i.length<3;)i="0"+i;r+=i,t!=e.length-1&&(r+=",")})),r},r.getStringAndGraghicalLength=function(n){var t=this.getString(n),e=1;return this.currentLanguage==s.ZH&&(e=3.1),{str:t,length:t.length*e}},r.getString=function(n,t){var e,i;if(!n)return"";switch(r.currentLanguage){case s.EN:return null==n||null==(e=n.en)?void 0:e.concat();case s.ZH:return null==n||null==(i=n.zh)?void 0:i.concat()}return n.en},r.getDirectQuote=function(n){return n?r.getStringByPropsWithoutTricks("DirectQuote",n):""},r.getStringByProps=function(){for(var n=this.lyrics,t=arguments.length,e=new Array(t),r=0;r<t;r++)e[r]=arguments[r];return e.forEach((function(t){n[t]&&(n=n[t])})),this.getString(n)},r.getStringByPropsWithoutTricks=function(){for(var n=this.lyrics,t=arguments.length,e=new Array(t),r=0;r<t;r++)e[r]=arguments[r];return e.forEach((function(t){n[t]&&(n=n[t])})),n?this.getString(n,!1):""},r.getWorldMapLyrics=function(n){var t=this.lyrics.WorldMapScene.World.Default,e=this.lyrics.WorldMapScene.World[n];return null!=e&&e.Name&&(t.Name=e.Name),null!=e&&e.EndlessZoneName&&(t.EndlessZoneName=e.EndlessZoneName),null!=e&&e.EndlessZoneMiniGameName&&(t.EndlessZoneMiniGameName=e.EndlessZoneMiniGameName),null!=e&&e.Description&&(t.Description=e.Description),t},e(r,null,[{key:"isWhiteList",get:function(){return true||this.camelGamingTime>=10800||-1!=this.bilibiliNumberWhiteList.indexOf(this.bilibiliNumber)}}]),r}(u)).currentLanguage=1,o.lyrics=void 0,o.camelGamingTime=0,o.bilibiliNumber=null,o.bilibiliNumberWhiteList=["31415926535897932384626","3.1415926535897932384626","DWJwe","Sharkfin085","442366357","350607092","21143967","47465141","2718222","miling2024","1583106389","244157289","3537122373929163","1588559528","66425694","86191635","3494363426457846","482398217","3493079061367345","200622073","51202546","323339071","347433548","123602899","Locutus0310"],a=o))||a);r._RF.pop()}}}));

System.register("chunks:///_virtual/resources",["./MultiLanguage.ts"],(function(){return{setters:[null],execute:function(){}}}));

(function(r) {
  r('virtual:///prerequisite-imports/resources', 'chunks:///_virtual/resources'); 
})(function(mid, cid) {
    System.register(mid, [cid], function (_export, _context) {
    return {
        setters: [function(_m) {
            var _exportObj = {};

            for (var _key in _m) {
              if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _m[_key];
            }
      
            _export(_exportObj);
        }],
        execute: function () { }
    };
    });
});