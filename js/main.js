// Hello there!
//
// If you want to add my games to your site, please reach out at my email: echo-the-coder@tuta.io, or discord: 3kh0_#6969
console.warn(
  "%cNote!",
  "color: purple; font-weight: 600; background: yellow; padding: 0 5px; border-radius: 5px",
  "If you want to add my games to your site, please reach out at my email: echo-the-coder@tuta.io\nPlease do not just add them without asking me first! Thank you!"
);
function script(text) {
  console.log("%cScript Injection", "color: cyan; font-weight: 600; background: black; padding: 0 5px; border-radius: 5px", text);
}
// ====================================
// SCRIPT INJECTION
// ====================================
const counter = document.createElement("script");
counter.setAttribute("src", "https://cdn.counter.dev/script.js");
counter.setAttribute("data-id", "3a53e261-dd9c-4c39-9e87-9d97f844ae7c");
counter.setAttribute("data-utcoffset", "-8");
document.head.append(counter);
script("Injected script 1/1 (Counter.dev)");
