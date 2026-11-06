// Hold the first game tick until the board has visually rendered once.
// Four hooks: render() stamps lastFrameTime; reset() stamps resetTime and
// drains a delayed key; the key handler queues early inputs until then.

window.RenderDelayFix = {};

window.RenderDelayFix.make = function () {
  window.lastFrameTime = 0;
  window.resetTime = 0;
  window.oldResetTime = 0;
  window.delayedKeyStorage = false;
  window.keyObject = false;
  window.stuffKeys = ()=>{};
}

window.RenderDelayFix.alterCode = function (code) {
  code = assertReplace(
    code,
    /render\s*\(\s*a\s*,\s*b\s*\)\s*\{\s*this\.([a-zA-Z0-9_$]{1,8})\.([a-zA-Z0-9_$]{1,8})\s*&&/,
    "render(a,b){window.lastFrameTime=Date.now();if(window.resetTime!=window.oldResetTime){window.oldResetTime=window.resetTime;}this.$1.$2&&"
  );
  // Capture all three props — v11 uses Bb.oa.oa, v12 uses wb.ka.ka
  code = assertReplace(
    code,
    /reset\s*\(\s*\)\s*\{\s*this\.([a-zA-Z0-9_$]{1,8})\.([a-zA-Z0-9_$]{1,8})\.([a-zA-Z0-9_$]{1,8})\s*=\s*0\s*;/,
    "reset(){window.resetTime=Date.now();setTimeout(()=>{if(delayedKeyStorage){stuffKeys.call(keyObject,delayedKeyStorage);delayedKeyStorage=false;keyObject=false}},20);this.$1.$2.$3=0;"
  );
  code = assertReplace(
    code,
    /([a-zA-Z0-9_$]{1,8})\s*\(\s*a\s*\)\s*\{\s*if\s*\(\s*!this\.closed\s*\)\s*\{/,
    "$1=window.stuffKeys=function(a){var _ae=document.activeElement;if(_ae&&(_ae.tagName==='INPUT'||_ae.tagName==='TEXTAREA'||_ae.tagName==='SELECT'||_ae.isContentEditable))return;if(!this.closed){if(window.resetTime<window.lastFrameTime){"
  );
  code = assertReplace(
    code,
    /a\.preventDefault\s*\(\s*\)\s*\}\s*\}\}/,
    "a.preventDefault()}}else{delayedKeyStorage=a;keyObject=this}}};"
  );
  return code;
}
