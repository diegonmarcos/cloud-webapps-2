"use strict";(()=>{var I=Object.defineProperty,F=Object.defineProperties;var N=Object.getOwnPropertyDescriptors;var K=Object.getOwnPropertySymbols;var P=Object.prototype.hasOwnProperty,L=Object.prototype.propertyIsEnumerable;var $=(t,a,e)=>a in t?I(t,a,{enumerable:!0,configurable:!0,writable:!0,value:e}):t[a]=e,T=(t,a)=>{for(var e in a||(a={}))P.call(a,e)&&$(t,e,a[e]);if(K)for(var e of K(a))L.call(a,e)&&$(t,e,a[e]);return t},V=(t,a)=>F(t,N(a));var v=[{id:"p1",name:"Firm Tofu",type:"Vegan",sub:"vegan",grams:200,unitG:400,unitName:"pack",shopCat:"Fridge (Vegan)",prot:16,carb:4,fat:9,kcal:160,priceKg:8,img:"https://images.pexels.com/photos/4518657/pexels-photo-4518657.jpeg?auto=compress&cs=tinysrgb&w=400"},{id:"p2",name:"Tempeh",type:"Vegan",sub:"vegan",grams:150,unitG:200,unitName:"pack",shopCat:"Fridge (Vegan)",prot:28,carb:13,fat:15,kcal:300,priceKg:14,img:"https://images.pexels.com/photos/6544381/pexels-photo-6544381.jpeg?auto=compress&cs=tinysrgb&w=400"},{id:"p3",name:"Edamame",type:"Vegan",sub:"vegan",grams:200,unitG:500,unitName:"bag",shopCat:"Freezer",prot:22,carb:16,fat:10,kcal:240,priceKg:5,img:"https://images.pexels.com/photos/7020679/pexels-photo-7020679.jpeg?auto=compress&cs=tinysrgb&w=400"},{id:"p4",name:"Lentils",type:"Vegan",sub:"vegan",grams:200,unitG:400,unitName:"jar",shopCat:"Pantry",prot:18,carb:40,fat:1,kcal:230,priceKg:2.5,img:"https://images.pexels.com/photos/8108166/pexels-photo-8108166.jpeg?auto=compress&cs=tinysrgb&w=400"},{id:"p5",name:"Chickpeas",type:"Vegan",sub:"vegan",grams:200,unitG:400,unitName:"jar",shopCat:"Pantry",prot:14,carb:50,fat:4,kcal:280,priceKg:2,img:"https://images.pexels.com/photos/6316515/pexels-photo-6316515.jpeg?auto=compress&cs=tinysrgb&w=400"},{id:"p6",name:"Seitan",type:"Vegan",sub:"vegan",grams:150,unitG:250,unitName:"pack",shopCat:"Fridge (Vegan)",prot:38,carb:6,fat:3,kcal:180,priceKg:12,img:"https://images.pexels.com/photos/5966431/pexels-photo-5966431.jpeg?auto=compress&cs=tinysrgb&w=400"},{id:"p7",name:"Greek Yogurt",type:"Veg",sub:"veg",grams:250,unitG:500,unitName:"tub",shopCat:"Dairy",prot:25,carb:10,fat:0,kcal:145,priceKg:4.5,img:"https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400"},{id:"p8",name:"Cottage Cheese",type:"Veg",sub:"veg",grams:200,unitG:250,unitName:"tub",shopCat:"Dairy",prot:22,carb:6,fat:8,kcal:180,priceKg:5,img:"https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400"},{id:"p9",name:"Eggs (3)",type:"Veg",sub:"veg",grams:150,unitG:50,unitName:"egg",shopCat:"Dairy",prot:19,carb:2,fat:15,kcal:215,priceKg:3.5,img:"https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400"},{id:"p10",name:"Skyr",type:"Veg",sub:"veg",grams:200,unitG:450,unitName:"tub",shopCat:"Dairy",prot:22,carb:8,fat:0,kcal:130,priceKg:5.5,img:"https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=400"},{id:"p11",name:"Chicken Breast",type:"Meat",sub:"meat",grams:150,unitG:300,unitName:"piece",shopCat:"Meat",prot:35,carb:0,fat:4,kcal:175,priceKg:10.5,img:"https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400"},{id:"p12",name:"Turkey",type:"Meat",sub:"meat",grams:150,unitG:300,unitName:"piece",shopCat:"Meat",prot:33,carb:0,fat:2,kcal:150,priceKg:9,img:"https://images.unsplash.com/photo-1606728035253-49e8a23146de?w=400"},{id:"p13",name:"Salmon",type:"Meat",sub:"meat",grams:150,unitG:150,unitName:"fillet",shopCat:"Fish",prot:30,carb:0,fat:20,kcal:310,priceKg:18,img:"https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400"},{id:"p14",name:"White Fish",type:"Meat",sub:"meat",grams:200,unitG:200,unitName:"fillet",shopCat:"Fish",prot:34,carb:0,fat:2,kcal:160,priceKg:14,img:"https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=400"},{id:"p15",name:"Tuna (canned)",type:"Meat",sub:"meat",grams:120,unitG:120,unitName:"can",shopCat:"Pantry",prot:30,carb:0,fat:1,kcal:130,priceKg:15,img:"https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400"},{id:"p16",name:"Shrimp",type:"Meat",sub:"meat",grams:150,unitG:300,unitName:"bag",shopCat:"Freezer",prot:27,carb:0,fat:2,kcal:130,priceKg:12,img:"https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400"}],k=[{id:"s1",name:"Basmati Rice",type:"Vegan",sub:"vegan",grams:150,unitG:1e3,unitName:"bag",shopCat:"Pantry",prot:4,carb:45,fat:0,kcal:195,priceKg:2.5,img:"https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg?auto=compress&cs=tinysrgb&w=400"},{id:"s2",name:"Sweet Potato",type:"Vegan",sub:"vegan",grams:200,unitG:200,unitName:"piece",shopCat:"Veggies",prot:3,carb:40,fat:0,kcal:170,priceKg:2.5,img:"https://images.pexels.com/photos/89247/pexels-photo-89247.png?auto=compress&cs=tinysrgb&w=400"},{id:"s3",name:"Quinoa",type:"Vegan",sub:"vegan",grams:150,unitG:500,unitName:"bag",shopCat:"Pantry",prot:6,carb:32,fat:3,kcal:180,priceKg:8,img:"https://images.pexels.com/photos/6740535/pexels-photo-6740535.jpeg?auto=compress&cs=tinysrgb&w=400"},{id:"s4",name:"Potato",type:"Vegan",sub:"vegan",grams:200,unitG:200,unitName:"piece",shopCat:"Veggies",prot:4,carb:34,fat:0,kcal:150,priceKg:1.2,img:"https://images.pexels.com/photos/144248/potatoes-vegetables-erdfrucht-bio-144248.jpeg?auto=compress&cs=tinysrgb&w=400"},{id:"s5",name:"Whole Wheat Bread",type:"Vegan",sub:"vegan",grams:80,unitG:500,unitName:"loaf",shopCat:"Pantry",prot:7,carb:36,fat:2,kcal:190,priceKg:3,img:"https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400"},{id:"s6",name:"Broccoli",type:"Vegan",sub:"vegan",grams:150,unitG:400,unitName:"head",shopCat:"Veggies",prot:4,carb:10,fat:0,kcal:50,priceKg:3.5,img:"https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Broccoli_and_cross_section_edit.jpg/440px-Broccoli_and_cross_section_edit.jpg"},{id:"s7",name:"Spinach",type:"Vegan",sub:"vegan",grams:100,unitG:300,unitName:"bag",shopCat:"Veggies",prot:3,carb:4,fat:0,kcal:25,priceKg:4,img:"https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400"},{id:"s8",name:"Avocado",type:"Vegan",sub:"vegan",grams:100,unitG:150,unitName:"piece",shopCat:"Veggies",prot:2,carb:9,fat:15,kcal:160,priceKg:6,img:"https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400"},{id:"s9",name:"Mushrooms",type:"Vegan",sub:"vegan",grams:150,unitG:400,unitName:"box",shopCat:"Veggies",prot:5,carb:5,fat:0,kcal:35,priceKg:4.5,img:"https://images.unsplash.com/photo-1552825897-bb5efa93f2f7?w=400"},{id:"s10",name:"Zucchini",type:"Vegan",sub:"vegan",grams:200,unitG:200,unitName:"piece",shopCat:"Veggies",prot:2,carb:6,fat:0,kcal:35,priceKg:2,img:"https://images.unsplash.com/photo-1563252722-6434563a985d?w=400"},{id:"s11",name:"Green Beans",type:"Vegan",sub:"vegan",grams:150,unitG:400,unitName:"bag",shopCat:"Veggies",prot:3,carb:10,fat:0,kcal:50,priceKg:4,img:"https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=400"},{id:"s12",name:"Cauliflower",type:"Vegan",sub:"vegan",grams:150,unitG:600,unitName:"head",shopCat:"Veggies",prot:3,carb:8,fat:0,kcal:40,priceKg:2.5,img:"https://images.unsplash.com/photo-1568702846914-96b305d2aca9?w=400"},{id:"s13",name:"Bell Peppers",type:"Vegan",sub:"vegan",grams:150,unitG:500,unitName:"pack",shopCat:"Veggies",prot:2,carb:9,fat:0,kcal:40,priceKg:3,img:"https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400"},{id:"s14",name:"Whole Wheat Pasta",type:"Veg",sub:"veg",grams:100,unitG:500,unitName:"box",shopCat:"Pantry",prot:5,carb:30,fat:1,kcal:150,priceKg:2.5,img:"https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400"},{id:"s15",name:"Couscous",type:"Veg",sub:"veg",grams:100,unitG:500,unitName:"bag",shopCat:"Pantry",prot:4,carb:35,fat:0,kcal:160,priceKg:3.5,img:"https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400"},{id:"s16",name:"Mixed Salad",type:"Veg",sub:"veg",grams:100,unitG:150,unitName:"bag",shopCat:"Veggies",prot:1,carb:4,fat:0,kcal:20,priceKg:3,img:"https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400"}],w=[...v,...k],x=["Veggies","Fruits","Fridge (Vegan)","Dairy","Meat","Fish","Freezer","Pantry","Others"];var f={};function d(t){return document.getElementById(t)}function l(t,a){let e=d(t);e&&(e.innerText=String(a))}function E(){y(v,"vegan","row-vegan"),y(v,"veg","row-veg"),y(v,"meat","row-meat"),y(k,"vegan","row-side-vegan"),y(k,"veg","row-side-veg"),H(),j(),S()}function j(){["inBase","inActive","inDeficit","inProtein","inCarbMode","inCost"].forEach(a=>{let e=d(a);e&&e.addEventListener("change",S)})}function H(){let t={root:null,rootMargin:"-40% 0px -40% 0px",threshold:0},a=new IntersectionObserver(e=>{e.forEach(o=>{o.isIntersecting&&(document.querySelectorAll(".glass-panel").forEach(i=>i.classList.remove("highlighted")),o.target.classList.add("highlighted"))})},t);document.querySelectorAll(".glass-panel").forEach(e=>{a.observe(e)})}function y(t,a,e){let o=d(e);o&&(o.innerHTML=t.filter(i=>i.sub===a).map(i=>`
        <div class="food-card" id="card-${i.id}" data-id="${i.id}">
            <div class="meal-indicator" id="badge-${i.id}"></div>
            <img src="${i.img}" class="card-img" loading="lazy" alt="${i.name}">
            <div class="card-content">
                <div class="card-title">${i.name}</div>
                <div class="card-details">
                    <span>${i.kcal} kc</span>
                    <span>${i.prot}p</span>
                </div>
            </div>
        </div>
    `).join(""),o.querySelectorAll(".food-card").forEach(i=>{i.addEventListener("click",()=>{let g=i.getAttribute("data-id");g&&B(g)})}))}function B(t){f[t]||(f[t]=0),f[t]=(f[t]+1)%4,D(t),G()}function D(t){let a=d(`card-${t}`),e=d(`badge-${t}`),o=f[t];!a||!e||(a.classList.remove("active"),e.className="meal-indicator",e.innerText="",o>0&&(a.classList.add("active"),o===1&&(e.classList.add("status-b"),e.innerText="B"),o===2&&(e.classList.add("status-l"),e.innerText="L"),o===3&&(e.classList.add("status-d"),e.innerText="D")))}function G(){let t={1:{k:0,p:0,c:0,f:0,i:[]},2:{k:0,p:0,c:0,f:0,i:[]},3:{k:0,p:0,c:0,f:0,i:[]}};["list-b","list-l","list-d"].forEach(p=>{let s=d(p);s&&(s.innerHTML="")});let a={1:"list-b",2:"list-l",3:"list-d"},e={1:"sel-b",2:"sel-l",3:"sel-d"};Object.keys(f).forEach(p=>{let s=f[p];if(s>0){let r=w.find(m=>m.id===p);if(!r)return;t[s].k+=r.kcal||0,t[s].p+=r.prot||0,t[s].c+=r.carb||0,t[s].f+=r.fat||0,t[s].i.push(r.name);let h=d(a[s]);if(h){let m=document.createElement("div");m.className=`selected-card ${e[s]}`,m.innerHTML=`
          <img src="${r.img}" alt="${r.name}">
          <div class="info">${r.name}</div>
        `,h.appendChild(m)}}}),M(1,t[1]),M(2,t[2]),M(3,t[3]);let o=t[1].k+t[2].k+t[3].k,i=t[1].p+t[2].p+t[3].p,g=t[1].c+t[2].c+t[3].c,c=t[1].f+t[2].f+t[3].f,n=d("grand-total");if(n){n.innerText=String(o);let p=d("outTotalKcal"),s=p&&parseInt(p.innerText)||9999;n.style.color=o>s?"var(--danger)":"var(--accent)"}l("grand-prot",i),l("grand-carb",g),l("grand-fat",c);let u=i>0?(o/i).toFixed(1):"-";l("grand-ratio",u),A()}function M(t,a){l(`m${t}-kcal`,a.k),l(`m${t}-prot`,a.p),l(`m${t}-carb`,a.c),l(`m${t}-fat`,a.f);let e=a.p>0?(a.k/a.p).toFixed(1):"-";l(`m${t}-ratio`,e)}function A(){let t=d("shopping-list-container");if(!t)return;let a={};Object.keys(f).forEach(g=>{let c=f[g];if(c>0){let n=w.find(s=>s.id===g);if(!n)return;let u=n.shopCat||"Others";a[u]||(a[u]=[]);let p=a[u].find(s=>s.name===n.name);p?p.g+=n.grams*c:a[u].push({name:n.name,g:n.grams*c,unitSize:n.unitG||100,priceKg:n.priceKg,isProtein:n.id.startsWith("p")})}});let e="",o=!1,i=[];x.forEach(g=>{a[g]&&a[g].length>0&&(o=!0,e+=`<div class="shop-category">${g}</div>`,a[g].forEach(c=>{let n=(c.g/c.unitSize).toFixed(1),u=n.endsWith(".0")?n.slice(0,-2):n,p=c.g/1e3*c.priceKg;i.push(V(T({},c),{cat:g,total:p})),e+=`
          <div class="shop-item">
              <span>${c.name}</span>
              <span class="shop-amt">${c.g}g</span>
              <span class="shop-unit">${u} u</span>
              <span class="shop-amt">$${c.priceKg.toFixed(2)}</span>
              <span class="shop-unit" style="color:var(--success)">$${p.toFixed(2)}</span>
          </div>
        `}))}),o||(e='<div style="text-align:center; color:#666; padding:20px; font-size:0.8rem;">Add items to menu to generate list</div>'),t.innerHTML=e,W(i,o)}function W(t,a){let e=d("price-analysis-container");if(!e)return;if(!a){e.innerHTML='<div class="placeholder-box">Add items to menu to calculate costs</div>';return}let o=`
    <div class="category-header" style="margin-top:0;">Breakdown by Category</div>
    <table class="price-table">
        <thead>
            <tr>
                <th>Category</th>
                <th>Total Amt (g)</th>
                <th>Total $</th>
            </tr>
        </thead>
        <tbody>
  `,i=0;x.forEach(s=>{let r=t.filter(h=>h.cat===s);if(r.length>0){let h=r.reduce((b,C)=>b+C.total,0),m=r.reduce((b,C)=>b+C.g,0);i+=h,o+=`
        <tr>
            <td style="color:var(--accent); font-weight:500;">${s}</td>
            <td>${m}g</td>
            <td>$${h.toFixed(2)}</td>
        </tr>
      `}}),o+=`
        <tr style="border-top: 1px solid white;">
            <td colspan="2" style="font-weight:bold; color:white;">Total</td>
            <td style="font-weight:bold; color:var(--success);">$${i.toFixed(2)}</td>
        </tr>
        </tbody></table>`;let g=0,c=0,n=t.filter(s=>s.isProtein),u=t.filter(s=>!s.isProtein),p=`
    <div class="category-header">Breakdown by Types</div>
    <table class="price-table">
        <thead>
            <tr>
                <th>Type</th>
                <th>Amt (g)</th>
                <th>Avg $/kg</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
  `;if(n.length>0){let s=n.reduce((m,b)=>m+b.g,0),r=n.reduce((m,b)=>m+b.total,0),h=r/(s/1e3);g=r,p+=`
      <tr>
          <td style="color:var(--accent)">Protein Items</td>
          <td>${s}</td>
          <td>${h.toFixed(2)}</td>
          <td>$${r.toFixed(2)}</td>
      </tr>
    `}if(u.length>0){let s=u.reduce((m,b)=>m+b.g,0),r=u.reduce((m,b)=>m+b.total,0),h=r/(s/1e3);c=r,p+=`
      <tr>
          <td style="color:var(--warning)">Sides Items</td>
          <td>${s}</td>
          <td>${h.toFixed(2)}</td>
          <td>$${r.toFixed(2)}</td>
      </tr>
    `}p+=`
        <tr style="border-top: 1px solid white;">
            <td colspan="3" style="font-weight:bold; color:white;">Total</td>
            <td style="font-weight:bold; color:var(--success);">$${(g+c).toFixed(2)}</td>
        </tr>
        </tbody></table>`,e.innerHTML=o+p}function S(){var p,s,r,h,m,b;let t=parseInt(((p=d("inBase"))==null?void 0:p.value)||"0"),a=parseInt(((s=d("inActive"))==null?void 0:s.value)||"0"),e=parseInt(((r=d("inDeficit"))==null?void 0:r.value)||"0"),o=parseInt(((h=d("inProtein"))==null?void 0:h.value)||"0"),i=parseInt(((m=d("inCost"))==null?void 0:m.value)||"10"),g=parseInt(((b=d("inCarbMode"))==null?void 0:b.value)||"250"),c=t+a-e,n=o*i,u=c-n;l("outTotalKcal",c),l("outProtKcal",n),l("outSidesKcal",u),l("outProtG",o+"g"),l("outCarbsLimit",g+"g"),l("outTotalKcalMeal",Math.round(c/3)),l("outProtKcalMeal",Math.round(n/3)),l("outSidesKcalMeal",Math.round(u/3)),l("outProtGMeal",Math.round(o/3)+"g"),l("outCarbsLimitMeal",Math.round(g/3)+"g"),G()}window.onload=E;})();
