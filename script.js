// Ob-Havo.UZ — Open-Meteo (kalitsiz, bepul API)
const $ = id => document.getElementById(id);
let isCelsius = true, currentData = null, fxMode = 'auto';

const CITIES = [
  {n:"Toshkent", lat:41.3111, lon:69.2797},
  {n:"Samarqand", lat:39.6542, lon:66.9597},
  {n:"Buxoro", lat:39.7681, lon:64.4556},
  {n:"Andijon", lat:40.7821, lon:72.3442},
  {n:"Namangan", lat:41.0011, lon:71.6698},
  {n:"Farg'ona", lat:40.3864, lon:71.7843},
  {n:"Urganch", lat:41.55, lon:60.6317},
  {n:"Nukus", lat:42.4619, lon:59.6095},
  {n:"Qarshi", lat:38.8612, lon:65.7896},
  {n:"Termiz", lat:37.2211, lon:67.2783},
  {n:"Jizzax", lat:40.1158, lon:67.8422},
  {n:"Navoiy", lat:40.1039, lon:65.3792},
];

function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2500); }

// WMO kod -> o'zbekcha
function wmoInfo(code, isDay=true){
  const map = {
    0:[isDay?'☀️':'🌙', isDay?'Ochiq osmon':'Ochiq tun'],
    1:[isDay?'🌤️':'🌙','Asosan ochiq'], 2:['⛅','Oʻzgaruvchan bulutli'], 3:['☁️','Qalin bulutli'],
    45:['🌫️','Tumanli'], 48:['🌫️','Qirovli tuman'],
    51:['🌦️','Mayda yomgʻir'], 53:['🌦️','Yomgʻir'], 55:['🌧️','Jala yomgʻir'],
    61:['🌧️','Yomgʻir'], 63:['🌧️','Kuchli yomgʻir'], 65:['⛈️','Juda kuchli yomgʻir'],
    71:['🌨️','Yengil qor'], 73:['❄️','Qor'], 75:['❄️','Kuchli qor'], 77:['🧊','Donador qor'],
    80:['🌦️','Jala'], 81:['🌧️','Kuchli jala'], 82:['⛈️','Shiddatli jala'],
    95:['⛈️','Momaqaldiroq'], 96:['⛈️','Doʻlli momaqaldiroq'], 99:['⛈️','Kuchli doʻl'],
  };
  return map[code] || ['🌈','Nomaʼlum'];
}
const t = c => isCelsius ? Math.round(c) : Math.round(c*9/5+32);
const tUnit = () => isCelsius ? '°C' : '°F';

function adviceGen(d){
  const temp=d.current.temperature_2m, wind=d.current.wind_speed_10m, code=d.current.weather_code, hum=d.current.relative_humidity_2m;
  if(code>=95) return "⛈️ Momaqaldiroq! Tashqariga chiqmaslik, elektr jihozlarni o'chirish tavsiya etiladi.";
  if(code>=71&&code<=77||code===73||code===75) return "❄️ Qor yog'moqda! Issiq kiyining, yo'llarda ehtiyot bo'ling. Issiq choy ichish esdan chiqmasin ☕";
  if(code>=51&&code<=82) return "🌧️ Yomg'ir kutilmoqda! Soyabon oling ☂️ va mashinada sekin yuring.";
  if(code===45||code===48) return "🌫️ Tuman tushgan! Ko'rish masofasi past — chiroqlarni yoqing.";
  if(temp>=35) return "🥵 Juda issiq! Ko'p suv iching 💧, soyada yuring, bosh kiyim kiying.";
  if(temp>=28) return "😎 Iliq va yoqimli havo! Sayr qilish uchun ajoyib payt 🌳";
  if(temp<0) return "🥶 Sovuq! Qalin kiyining, qo'lqop va sharf unutmang 🧣";
  if(wind>30) return "💨 Kuchli shamol! Yengil narsalarni mustahkamlang.";
  if(hum>80) return "💧 Namlik yuqori — kiyimlar sekin quriydi, sochlar jingalak bo'lishi mumkin 😄";
  return "🌤️ Havo ajoyib! Bugun tabassum bilan boshlang va ochiq havoda vaqt o'tkazing!";
}

async function loadWeather(city){
  $('loader').classList.remove('hide');
  try{
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,wind_speed_10m_max&timezone=auto&forecast_days=7`;
    const r=await fetch(url); const d=await r.json();
    currentData={city,d};
    render(d, city.n);
    setTheme(d.current.weather_code, d.current.is_day);
    startFx(d.current.weather_code, d.current.is_day);
  }catch(e){ toast("❌ Internet yoki API xatosi! Qayta urining."); }
  $('loader').classList.add('hide');
}

function render(d, cityName){
  const c=d.current, [icon,desc]=wmoInfo(c.weather_code, c.is_day);
  $('cityName').textContent=cityName+" 📍";
  $('temp').textContent=t(c.temperature_2m);
  $('wIcon').textContent=icon; $('orbitIcon').textContent=icon;
  $('wDesc').textContent=desc;
  $('feels').textContent=t(c.apparent_temperature)+tUnit();
  $('tMax').textContent=t(d.daily.temperature_2m_max[0])+tUnit();
  $('tMin').textContent=t(d.daily.temperature_2m_min[0])+tUnit();
  $('dateStr').textContent=new Date(c.time).toLocaleDateString('uz-UZ',{weekday:'long',day:'numeric',month:'long'});
  $('sWind').textContent=Math.round(c.wind_speed_10m)+" km/soat";
  $('sWindDir').textContent=windDir(c.wind_direction_10m);
  $('sHum').textContent=c.relative_humidity_2m+"%";
  $('sPress').textContent=Math.round(c.pressure_msl);
  $('sCloud').textContent=c.cloud_cover+"%";
  $('sPrec').textContent=c.precipitation+" mm";
  const sr=d.daily.sunrise[0].slice(11,16), ss=d.daily.sunset[0].slice(11,16);
  $('sSun').textContent=sr+" / "+ss;
  $('oSunrise').textContent="🌅 "+sr; $('oSunset').textContent="🌇 "+ss;
  $('oWind').textContent="💨 "+Math.round(c.wind_speed_10m)+" km/s";
  $('oHum').textContent="💧 "+c.relative_humidity_2m+"%";
  $('adviceText').textContent=adviceGen(d);
  $('footTemp').textContent=`${cityName}: ${t(c.temperature_2m)}${tUnit()} ${icon}`;

  // hourly — keyingi 24 soat
  const nowH=parseInt(c.time.slice(0,13));
  let html='', count=0;
  for(let i=0;i<d.hourly.time.length && count<24;i++){
    const ht=d.hourly.time[i];
    if(parseInt(ht.slice(0,13))<nowH) continue;
    const [hi]=wmoInfo(d.hourly.weather_code[i], d.hourly.is_day[i]);
    const hour=ht.slice(11,16);
    html+=`<div class="h-card ${count===0?'now':''}"><small>${count===0?'Hozir':hour}</small><div style="font-size:30px">${hi}</div><b>${t(d.hourly.temperature_2m[i])}°</b></div>`;
    count++;
  }
  $('hourly').innerHTML=html;

  // daily
  const days=['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
  let dh='';
  const allMax=[...d.daily.temperature_2m_max], allMin=[...d.daily.temperature_2m_min];
  const gMax=Math.max(...allMax), gMin=Math.min(...allMin);
  d.daily.time.forEach((dt,i)=>{
    const [di,dd]=wmoInfo(d.daily.weather_code[i],true);
    const date=new Date(dt);
    const label=i===0?'Bugun':days[date.getDay()]+", "+date.getDate()+"-"+(date.getMonth()+1);
    const left=((allMin[i]-gMin)/(gMax-gMin||1))*100, width=((allMax[i]-allMin[i])/(gMax-gMin||1))*100;
    dh+=`<div class="d-row"><span style="font-size:30px">${di}</span><span class="day">${label}<br><small style="opacity:.7">${dd} • 🌧️ ${d.daily.precipitation_probability_max[i]??0}%</small></span><b>${t(allMin[i])}°</b><div class="tbar"><i style="left:${left}%;width:${Math.max(width,8)}%"></i></div><b>${t(allMax[i])}°</b></div>`;
  });
  $('daily').innerHTML=dh;

  document.querySelectorAll('#quickCities button').forEach(b=>b.classList.toggle('active', b.textContent===cityName));
}
function windDir(deg){ const d=['Shimol ⬆️','Shimoli-sharq ↗️','Sharq ➡️','Janubi-sharq ↘️','Janub ⬇️','Janubi-gʻarb ↙️','Gʻarb ⬅️','Shimoli-gʻarb ↖️']; return d[Math.round(deg/45)%8]; }

function setTheme(code,isDay){
  document.body.classList.remove('night','rain','snow');
  const sm=$('sunMoon');
  if(!isDay){document.body.classList.add('night');sm.className='moon';}
  else sm.className='sun';
  if(code>=51&&code<=82||code>=80) document.body.classList.add('rain');
  if(code>=71&&code<=77||code===73||code===75) document.body.classList.add('snow');
  if(code>=95) document.body.classList.add('rain');
}

// --- Canvas effektlar: yomg'ir / qor / konfetti / yulduz ---
const cv=$('fx'), ctx=cv.getContext('2d'); let parts=[], fxRun=true;
function resize(){cv.width=innerWidth;cv.height=innerHeight;} addEventListener('resize',resize); resize();
function startFx(code,isDay){
  parts=[];
  let mode='none';
  if(fxMode!=='auto') mode=fxMode;
  else if(code>=95) mode='storm';
  else if(code>=51) mode='rain';
  else if((code>=71&&code<=77)||code===73||code===75) mode='snow';
  else if(!isDay) mode='stars2';
  else mode='petals';
  const N = mode==='storm'?220 : mode==='rain'?160 : mode==='snow'?160 : 90;
  for(let i=0;i<N;i++) parts.push(newP(mode,true));
  fxRun=true;
}
function newP(mode,init){
  const colors=['#ff5ea8','#ffde59','#38e1ff','#7bff9e','#fff','#ff9966'];
  return {mode,x:Math.random()*cv.width,y:init?Math.random()*cv.height:-20,
    vy:mode==='rain'?12+Math.random()*10:mode==='storm'?16+Math.random()*12:mode==='snow'?1+Math.random()*2:1+Math.random()*2.5,
    vx:(Math.random()-.5)*(mode==='storm'?6:2), r:2+Math.random()*4,
    c:colors[Math.floor(Math.random()*colors.length)], a:Math.random()*Math.PI*2, s:.02+Math.random()*.05};
}
function loop(){
  ctx.clearRect(0,0,cv.width,cv.height);
  if(fxRun) for(const p of parts){
    p.y+=p.vy; p.x+=p.vx+Math.sin(p.a+=p.s)*.6;
    if(p.y>cv.height+20){Object.assign(p,newP(p.mode,false));}
    if(p.mode==='rain'||p.mode==='storm'){ctx.strokeStyle='rgba(150,220,255,.7)';ctx.lineWidth=p.mode==='storm'?2.4:1.6;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx,p.y-p.vy*1.6);ctx.stroke();
      if(p.mode==='storm'&&Math.random()<.008){ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillRect(0,0,cv.width,cv.height);}}
    else if(p.mode==='snow'){ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill();}
    else{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.fillStyle=p.c;ctx.globalAlpha=.85;ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);ctx.restore();ctx.globalAlpha=1;}
  }
  requestAnimationFrame(loop);
}
loop();
function confettiBurst(){ fxMode='petals'; parts=[]; for(let i=0;i<200;i++)parts.push(newP('petals',true)); fxRun=true; toast("🎉 Konfetti! Kayfiyatingiz a'lo bo'lsin!"); }

// yulduzlar
(function(){const s=$('stars');for(let i=0;i<90;i++){const d=document.createElement('div');d.className='star';const sz=Math.random()*3+1;d.style.cssText=`left:${Math.random()*100}%;top:${Math.random()*60}%;width:${sz}px;height:${sz}px;animation-delay:${Math.random()*2}s`;s.appendChild(d);}})();

// soat
setInterval(()=>{ $('clock').textContent=new Date().toLocaleString('uz-UZ',{weekday:'long',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit',second:'2-digit'})+" • jonli"; },1000);

// qidiruv
let deb;
$('searchInput').addEventListener('input',e=>{
  clearTimeout(deb);
  deb=setTimeout(async()=>{
    const q=e.target.value.trim(); if(q.length<2){$('suggest').classList.add('hidden');return;}
    try{
      const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=uz&format=json`);
      const j=await r.json();
      if(!j.results){$('suggest').classList.add('hidden');return;}
      $('suggest').innerHTML=j.results.map((x,i)=>`<div data-i="${i}">${x.name} ${x.country?('• '+x.country):''} ${x.admin1?('• '+x.admin1):''}</div>`).join('');
      $('suggest').classList.remove('hidden');
      $('suggest').querySelectorAll('div').forEach(el=>el.onclick=()=>{
        const s=j.results[+el.dataset.i];
        $('suggest').classList.add('hidden'); $('searchInput').value='';
        loadWeather({n:s.name,lat:s.latitude,lon:s.longitude});
        toast(`📍 ${s.name} tanlandi!`);
      });
    }catch{}
  },400);
});
$('searchBtn').onclick=()=>{const q=$('searchInput').value.trim(); if(!q)return toast("✍️ Shahar nomini yozing!"); const f=CITIES.find(c=>c.n.toLowerCase().includes(q.toLowerCase())); if(f)loadWeather(f); else $('searchInput').dispatchEvent(new Event('input'));};

// tugmalar
$('unitBtn').onclick=()=>{isCelsius=!isCelsius; $('unitBtn').textContent=isCelsius?'°C / °F':'°F / °C'; if(currentData)render(currentData.d,currentData.city.n); toast(isCelsius?"🌡️ Selsiy (°C)":"🌡️ Farengeyt (°F)");};
$('locBtn').onclick=()=>{ if(!navigator.geolocation)return toast("📵 Brauzer geolokatsiyani qo'llamaydi"); toast("📡 Joylashuv aniqlanmoqda..."); navigator.geolocation.getCurrentPosition(p=>loadWeather({n:"Mening joyim",lat:p.coords.latitude,lon:p.coords.longitude}),()=>toast("❌ Ruxsat berilmadi — Toshkent ko'rsatiladi")); };
$('rainBtn').onclick=()=>{fxMode='rain';startFx(61,1);toast("🌧️ Yomg'ir yog'moqda...");};
$('snowBtn').onclick=()=>{fxMode='snow';startFx(73,1);toast("❄️ Qor yog'moqda...");};
$('clearFxBtn').onclick=()=>{fxMode='none';parts=[];toast("🧹 Effektlar tozalandi");};

// tez shaharlar
$('quickCities').innerHTML=CITIES.map(c=>`<button>${c.n}</button>`).join('');
$('quickCities').querySelectorAll('button').forEach((b,i)=>b.onclick=()=>loadWeather(CITIES[i]));

// kursor nuri + 3D tilt
addEventListener('mousemove',e=>{const g=$('cursorGlow');g.style.left=e.clientX+'px';g.style.top=e.clientY+'px';});
document.querySelectorAll('.tilt').forEach(card=>{
  card.addEventListener('mousemove',e=>{const r=card.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5; card.style.transform=`perspective(900px) rotateY(${x*10}deg) rotateX(${-y*10}deg)`;});
  card.addEventListener('mouseleave',()=>card.style.transform='perspective(900px)');
});

loadWeather(CITIES[0]);
