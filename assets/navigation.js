"use strict";
document.addEventListener("DOMContentLoaded",()=>{
 const toggle=document.querySelector("[data-action=toggle-menu]");
 const nav=document.getElementById("site-navigation");
 if(!toggle||!nav)return;
 const close=()=>{nav.classList.remove("is-open");toggle.setAttribute("aria-expanded","false");toggle.setAttribute("aria-label","Otvoriť menu");};
 toggle.addEventListener("click",()=>{const open=!nav.classList.contains("is-open");nav.classList.toggle("is-open",open);toggle.setAttribute("aria-expanded",String(open));toggle.setAttribute("aria-label",open?"Zavrieť menu":"Otvoriť menu");});
 nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",close));
 document.addEventListener("keydown",e=>{if(e.key==="Escape")close();});
 document.addEventListener("click",e=>{if(!nav.contains(e.target)&&!toggle.contains(e.target))close();});
});
