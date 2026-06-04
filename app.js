let supa=null,isSignup=false;
const IDS=['A','B','C','D','E','F','G'];
let tour=null,tMatches=[],tGoals=[],setupNum=4,setupNames={};
let _players=[],_payments=[],_editId=null;
let _settings={},_settingsBackend='local';
const SETTINGS_LS='nepcali_club_settings_v1';
// Each formation = 11 slots: [roleLabel, x%, y%] on the pitch (GK at bottom).
const FORMATIONS={
  '4-4-2':[['GK',50,90],['DEF',20,72],['DEF',40,72],['DEF',60,72],['DEF',80,72],['MID',20,50],['MID',40,50],['MID',60,50],['MID',80,50],['FWD',35,27],['FWD',65,27]],
  '4-3-3':[['GK',50,90],['DEF',20,72],['DEF',40,72],['DEF',60,72],['DEF',80,72],['MID',28,50],['MID',50,50],['MID',72,50],['FWD',22,27],['FWD',50,23],['FWD',78,27]],
  '3-5-2':[['GK',50,90],['DEF',30,73],['DEF',50,73],['DEF',70,73],['MID',12,52],['MID',31,52],['MID',50,52],['MID',69,52],['MID',88,52],['FWD',38,27],['FWD',62,27]],
  '4-2-3-1':[['GK',50,90],['DEF',20,74],['DEF',40,74],['DEF',60,74],['DEF',80,74],['MID',35,58],['MID',65,58],['AM',25,40],['AM',50,40],['AM',75,40],['FWD',50,22]],
  '5-3-2':[['GK',50,90],['DEF',12,74],['DEF',31,74],['DEF',50,74],['DEF',69,74],['DEF',88,74],['MID',30,52],['MID',50,52],['MID',70,52],['FWD',38,28],['FWD',62,28]]
};
const PITCH_MARKINGS='<div class="mk" style="left:0;right:0;top:50%;height:0;border-width:1px 0 0 0"></div>'+
  '<div class="mk" style="left:50%;top:50%;width:80px;height:80px;border-radius:50%;transform:translate(-50%,-50%)"></div>'+
  '<div class="mk" style="left:25%;right:25%;bottom:-2px;height:13%;border-bottom:none"></div>'+
  '<div class="mk" style="left:25%;right:25%;top:-2px;height:13%;border-top:none"></div>';

function initSupabase(){
  if(typeof SUPABASE_URL==='undefined'||SUPABASE_URL.includes('PASTE')||SUPABASE_URL===''){
    document.getElementById('config-banner').style.display='block';
    document.getElementById('config-banner').textContent='⚠️ Not configured yet. Open config.js and paste your Supabase URL and key.';
    document.getElementById('login-btn').disabled=true;
    document.getElementById('t-match-list').innerHTML='<div class="card"><div class="banner" style="display:block">⚠️ Not configured yet. Open config.js and paste your Supabase URL and key, then redeploy. See SETUP-GUIDE.</div></div>';
    return false;
  }
  supa=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
  return true;
}

function toggleMode(){
  isSignup=!isSignup;
  document.getElementById('login-btn').textContent=isSignup?'Create account':'Sign in';
  document.getElementById('toggle-mode').textContent=isSignup?'Already have an account? Sign in':'New here? Create an account';
  const e=document.getElementById('auth-err');e.style.display='none';e.style.color='#dc2626';
}
let isLoggedIn=false;

function openLogin(){document.getElementById('login-modal').style.display='flex';}
function closeLogin(){document.getElementById('login-modal').style.display='none';}
function authBtnClick(){ if(isLoggedIn) doLogout(); else openLogin(); }

async function doAuth(){
  const email=document.getElementById('email').value.trim();
  const password=document.getElementById('password').value;
  const err=document.getElementById('auth-err');err.style.display='none';
  if(!email||!password){err.textContent='Enter email and password';err.style.display='block';return;}
  const res=isSignup?await supa.auth.signUp({email,password}):await supa.auth.signInWithPassword({email,password});
  if(res.error){err.textContent=res.error.message;err.style.display='block';return;}
  if(isSignup&&!res.data.session){err.style.color='#16a34a';err.textContent='Account created. Check email to confirm, then sign in.';err.style.display='block';toggleMode();return;}
  isLoggedIn=true;
  closeLogin();
  document.getElementById('auth-btn').textContent='Sign out';
  loadPrivate();
}
async function doLogout(){await supa.auth.signOut();location.reload();}
async function checkSession(){
  const {data}=await supa.auth.getSession();
  if(data.session){isLoggedIn=true;document.getElementById('auth-btn').textContent='Sign out';loadPrivate();}
}

// Tabs that need login. If not logged in, open the modal instead of switching.
function gatedShow(id,btn){
  if(!isLoggedIn){openLogin();return;}
  show(id,btn);
}

function showApp(){loadAll();}

async function loadPlayers(){const {data,error}=await supa.from('players').select('*').order('team').order('jersey_no');if(error){console.error(error);return[];}return data;}
async function addPlayer(){
  const name=document.getElementById('p-name').value.trim();
  if(!name){alert('Enter a name');return;}
  const {error}=await supa.from('players').insert({name,team:document.getElementById('p-team').value,position:document.getElementById('p-pos').value,jersey_no:parseInt(document.getElementById('p-jersey').value)||null});
  if(error){alert(error.message);return;}
  document.getElementById('p-name').value='';document.getElementById('p-jersey').value='';
  loadAll();
}
async function deletePlayer(id){if(!confirm('Remove this player?'))return;await supa.from('players').delete().eq('id',id);loadAll();}
async function updatePlayer(id,field,val){
  if(field==='jersey_no'){val=(''+val).trim();val=val===''?null:(parseInt(val)||null);}
  else if(field==='team'||field==='position'){val=val===''?null:val;}
  else if(field==='name'){val=val.trim();if(!val){alert('Name cannot be empty');loadAll();return;}}
  const {error}=await supa.from('players').update({[field]:val}).eq('id',id);
  if(error){alert(error.message);return;}
  const p=_players.find(x=>x.id===id);if(p)p[field]=val;
  if(field==='team')renderRoster(_players);
  renderDashboard(_players,_payments);
}
function escAttr(s){return (s||'').replace(/"/g,'&quot;');}
function teamOpts(sel){return '<option value="">— team —</option>'+IDS.map(id=>`<option value="${id}" ${sel===id?'selected':''}>Team ${id}</option>`).join('');}
function posOpts(sel){return '<option value="">— pos —</option>'+['GK','DEF','MID','FWD'].map(o=>`<option value="${o}" ${sel===o?'selected':''}>${o}</option>`).join('');}

async function loadPayments(){const {data,error}=await supa.from('payments').select('*, players(name, team)').order('created_at',{ascending:false});if(error){console.error(error);return[];}return data;}
async function addPayment(){
  const player_id=document.getElementById('m-player').value;
  const amount=parseFloat(document.getElementById('m-amount').value);
  if(!player_id){alert('Select a player');return;}
  if(isNaN(amount)){alert('Enter an amount');return;}
  const {error}=await supa.from('payments').insert({player_id,amount,paid:document.getElementById('m-paid').value==='true',note:document.getElementById('m-note').value.trim()});
  if(error){alert(error.message);return;}
  document.getElementById('m-amount').value='';document.getElementById('m-note').value='';
  loadAll();
}
async function deletePayment(id){await supa.from('payments').delete().eq('id',id);loadAll();}

async function loadTournament(){
  let {data}=await supa.from('tournaments').select('*').order('created_at',{ascending:false}).limit(1);
  if(!data||!data.length){
    const ins=await supa.from('tournaments').insert({name:'NEP Cali',num_teams:4,team_names:{}}).select().single();
    tour=ins.data;
  }else{tour=data[0];}
  const m=await supa.from('matches').select('*').eq('tournament_id',tour.id).order('match_no');
  tMatches=m.data||[];
  if(!tMatches.length){await buildFixtures(tour.num_teams);}
  const g=await supa.from('goals').select('*');
  tGoals=g.data||[];
  setupNum=tour.num_teams;setupNames=Object.assign({},tour.team_names||{});
}

function teamName(id){return (tour&&tour.team_names&&tour.team_names[id])?tour.team_names[id]:('Team '+id);}

async function buildFixtures(n){
  const arr=IDS.slice(0,n);
  if(arr.length%2===1)arr.push(null);
  const sz=arr.length,rounds=[],a=arr.slice();
  for(let r=0;r<sz-1;r++){
    const round=[];
    for(let i=0;i<sz/2;i++){const h=a[i],aw=a[sz-1-i];if(h!==null&&aw!==null)round.push([h,aw]);}
    rounds.push(round);a.splice(1,0,a.pop());
  }
  await supa.from('matches').delete().eq('tournament_id',tour.id);
  let no=0;const rows=[];
  rounds.forEach(round=>round.forEach(p=>{no++;rows.push({tournament_id:tour.id,match_no:no,stage:'league',home_team:p[0],away_team:p[1]});}));
  await supa.from('matches').insert(rows);
  const m=await supa.from('matches').select('*').eq('tournament_id',tour.id).order('match_no');
  tMatches=m.data||[];
}

async function generateTournament(){
  const names={};
  for(let i=0;i<setupNum;i++){const id=IDS[i];if(setupNames[id]&&setupNames[id].trim())names[id]=setupNames[id].trim();}
  await supa.from('tournaments').update({num_teams:setupNum,team_names:names}).eq('id',tour.id);
  tour.num_teams=setupNum;tour.team_names=names;
  if(tMatches.length)await supa.from('goals').delete().in('match_id',tMatches.map(m=>m.id));
  await buildFixtures(setupNum);
  tGoals=[];
  renderTournament();
  subshow('t-scores',document.querySelectorAll('.subnav-btn')[0]);
}

async function saveScore(matchId,side,val){
  const v=val.trim()===''?null:Math.max(0,parseInt(val)||0);
  const col=side==='h'?'home_goals':'away_goals';
  await supa.from('matches').update({[col]:v}).eq('id',matchId);
  const m=tMatches.find(x=>x.id===matchId);if(m)m[col]=v;
  renderTable();updatePlayedBadge(matchId);
}
async function addGoal(matchId){
  const m=tMatches.find(x=>x.id===matchId);
  const ins=await supa.from('goals').insert({match_id:matchId,team:m.home_team,scorer:''}).select().single();
  if(ins.data){tGoals.push(ins.data);renderMatchGoals(matchId);}
}
async function setGoalField(goalId,field,val){
  const g=tGoals.find(x=>x.id===goalId);if(g){g[field]=val;}
  await supa.from('goals').update({[field]:val}).eq('id',goalId);
  renderScorers();
}
async function removeGoal(goalId){
  await supa.from('goals').delete().eq('id',goalId);
  tGoals=tGoals.filter(g=>g.id!==goalId);
  renderScorers();
}

function teamBadge(t){return `<span class="badge">${t||'?'}</span>`}

async function loadAll(){
  await loadTournament();
  renderTournament();
  await loadSettings();
  renderDashboardExtras();
  updateWelcomeStats();
  loadPrivate();
}
// Roster + Dashboard are public to read; Money tab is gated in the UI.
// Writes (add/delete player, payments) are still restricted by Supabase rules.
async function loadPrivate(){
  applyAuthUI();
  const players=await loadPlayers();
  const payments=await loadPayments();
  _players=players;_payments=payments;
  renderRoster(players);renderMoney(players,payments);renderDashboard(players,payments);
  renderLineup();
}

// ---- Club settings (dashboard extras + starting XI) ----
// Tries the public club_settings table; falls back to localStorage so
// the features work even before schema-dashboard.sql is run.
async function loadSettings(){
  if(supa){
    const {data,error}=await supa.from('club_settings').select('data').eq('id',1).maybeSingle();
    if(!error){
      _settingsBackend='supabase';
      if(data){_settings=data.data||{};}
      else{_settings={};try{await supa.from('club_settings').insert({id:1,data:{}});}catch(e){}}
      return;
    }
  }
  _settingsBackend='local';
  try{_settings=JSON.parse(localStorage.getItem(SETTINGS_LS)||'{}');}catch(e){_settings={};}
}
async function saveSettings(){
  if(_settingsBackend==='supabase'&&supa){
    const {error}=await supa.from('club_settings').update({data:_settings,updated_at:new Date().toISOString()}).eq('id',1);
    if(error){try{localStorage.setItem(SETTINGS_LS,JSON.stringify(_settings));}catch(e){}}
  }else{
    try{localStorage.setItem(SETTINGS_LS,JSON.stringify(_settings));}catch(e){}
  }
}

function fmtDate(d){if(!d)return'';try{return new Date(d+'T00:00:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'});}catch(e){return d;}}
function firstName(n){return (n||'').trim().split(/\s+/)[0]||'';}

function renderDashboardExtras(){
  const t=_settings.next_tournament||{};
  const nEl=document.getElementById('ut-name'),dEl=document.getElementById('ut-date');
  if(nEl)nEl.value=t.name||'';
  if(dEl)dEl.value=t.date||'';
  renderCountdown();
  renderEvents();
}
function saveTournamentInfo(){
  _settings.next_tournament={name:document.getElementById('ut-name').value.trim(),date:document.getElementById('ut-date').value};
  saveSettings();renderCountdown();
}
function renderCountdown(){
  const el=document.getElementById('ut-countdown');if(!el)return;
  const t=_settings.next_tournament||{};
  if(!t.date){el.textContent='Set a date for the next tournament.';return;}
  const days=Math.ceil((new Date(t.date+'T00:00:00')-new Date(new Date().toDateString()))/86400000);
  const nm=t.name||'Tournament';
  el.textContent = days>0?`${nm} kicks off in ${days} day${days>1?'s':''} · ${fmtDate(t.date)}`
    : days===0?`${nm} is today! ⚽`
    : `${nm} was on ${fmtDate(t.date)}.`;
}
function addEvent(){
  const name=document.getElementById('ev-name').value.trim();
  const date=document.getElementById('ev-date').value;
  if(!name){alert('Enter an event name');return;}
  if(!_settings.events)_settings.events=[];
  _settings.events.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),name,date});
  document.getElementById('ev-name').value='';document.getElementById('ev-date').value='';
  saveSettings();renderEvents();
}
function deleteEvent(id){_settings.events=(_settings.events||[]).filter(e=>e.id!==id);saveSettings();renderEvents();}
function renderEvents(){
  const el=document.getElementById('ev-list');if(!el)return;
  const evs=(_settings.events||[]).slice().sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
  el.innerHTML=evs.length?evs.map(e=>`<div class="list-row"><span class="badge">📌</span>
    <div class="player-info"><div class="player-name">${escAttr(e.name)}</div><div class="player-meta">${e.date?fmtDate(e.date):'No date set'}</div></div>
    <button class="del" onclick="deleteEvent('${e.id}')">🗑</button></div>`).join(''):'<div class="empty">No events yet</div>';
}

// ---- Starting XI ----
function getXI(){if(!_settings.starting_xi)_settings.starting_xi={formation:'4-3-3',picks:[]};return _settings.starting_xi;}
function setFormation(f){const xi=getXI();xi.formation=f;saveSettings();renderLineup();}
function setPick(i,name){const xi=getXI();if(!xi.picks)xi.picks=[];xi.picks[i]=name;saveSettings();renderLineup();}
function renderLineup(){
  const xi=getXI();
  if(!FORMATIONS[xi.formation])xi.formation='4-3-3';
  const fSel=document.getElementById('xi-formation');
  if(fSel)fSel.innerHTML=Object.keys(FORMATIONS).map(f=>`<option value="${f}" ${f===xi.formation?'selected':''}>${f}</option>`).join('');
  const slots=FORMATIONS[xi.formation];
  const pitch=document.getElementById('xi-pitch');
  if(pitch){
    pitch.innerHTML=PITCH_MARKINGS+slots.map((s,i)=>{
      const nm=(xi.picks&&xi.picks[i])||'';
      const p=_players.find(pl=>pl.name===nm);
      const num=p&&p.jersey_no?p.jersey_no:(i+1);
      return `<div class="xi-tok" style="left:${s[1]}%;top:${s[2]}%">
        <div class="xi-shirt ${nm?'':'empty'}">${nm?num:s[0]}</div>
        <div class="xi-nm">${nm?escAttr(firstName(nm)):''}</div></div>`;
    }).join('');
  }
  const ed=document.getElementById('xi-editor');
  if(ed){
    if(!_players.length){ed.innerHTML='<div class="empty">Add players in the Roster first</div>';return;}
    const optsFor=name=>'<option value="">— pick —</option>'+_players.map(p=>`<option value="${escAttr(p.name)}" ${p.name===name?'selected':''}>${escAttr(p.name)}${p.jersey_no?' #'+p.jersey_no:''}</option>`).join('');
    ed.innerHTML=slots.map((s,i)=>{
      const nm=(xi.picks&&xi.picks[i])||'';
      return `<div class="list-row"><span class="role-badge">${s[0]}</span>
        <div class="player-info"><select class="name-inp" style="margin:0;width:100%" onchange="setPick(${i},this.value)">${optsFor(nm)}</select></div></div>`;
    }).join('');
  }
}
// Show/hide login-only edit controls based on auth state.
function applyAuthUI(){
  const addCard=document.getElementById('roster-add-card');
  if(addCard)addCard.style.display=isLoggedIn?'block':'none';
}

function renderRoster(players){
  document.getElementById('roster-count').textContent=players.length;
  const el=document.getElementById('roster-list');
  if(!players.length){
    el.innerHTML='<div class="empty">No players yet</div>';
  }else{
    el.innerHTML=players.map((p,i)=>{
      // Inline editor — only for the row the user chose to edit (logged in).
      if(isLoggedIn&&_editId===p.id){
        return `<div class="list-row" style="align-items:flex-start">${teamBadge(p.team)}
          <div class="player-info" style="display:flex;flex-direction:column;gap:6px">
            <input class="name-inp" style="margin:0;width:100%" value="${escAttr(p.name)}" onchange="updatePlayer('${p.id}','name',this.value)">
            <div style="display:flex;gap:6px">
              <select class="team-sel" style="max-width:none;width:32%;margin:0" onchange="updatePlayer('${p.id}','team',this.value)">${teamOpts(p.team)}</select>
              <select class="team-sel" style="max-width:none;width:36%;margin:0" onchange="updatePlayer('${p.id}','position',this.value)">${posOpts(p.position)}</select>
              <input class="name-inp" type="number" min="1" max="99" placeholder="#" style="margin:0;width:32%" value="${p.jersey_no??''}" onchange="updatePlayer('${p.id}','jersey_no',this.value)">
            </div>
          </div>
          <button class="del" onclick="doneEdit()" style="margin-top:6px;color:var(--green)">✓</button></div>`;
      }
      // Simple list row: "1. Krisham (1)"
      const meta=(p.team||p.position)?`<div class="player-meta">${p.team?'Team '+p.team:''}${p.team&&p.position?' · ':''}${p.position||''}</div>`:'';
      const num=p.jersey_no!=null?` (${p.jersey_no})`:'';
      const edit=isLoggedIn?`<button class="del" style="color:var(--gold-l)" onclick="editPlayer('${p.id}')">✏️</button><button class="del" onclick="deletePlayer('${p.id}')">🗑</button>`:'';
      return `<div class="list-row">
        <div class="player-info"><div class="player-name">${i+1}. ${p.name}${num}</div>${meta}</div>
        ${edit}</div>`;
    }).join('');
  }
  const sel=document.getElementById('m-player');
  sel.innerHTML='<option value="">Select player…</option>'+players.map(p=>`<option value="${p.id}">${p.name} (Team ${p.team||'?'})</option>`).join('');
}
function editPlayer(id){_editId=id;renderRoster(_players);}
function doneEdit(){_editId=null;renderRoster(_players);}

function renderMoney(players,payments){
  const el=document.getElementById('money-list');
  if(!payments.length){el.innerHTML='<div class="empty">No transactions yet</div>';return;}
  el.innerHTML=payments.map(p=>{
    const isExpense=!p.players&&Number(p.amount)<0;
    const nm=p.players?p.players.name:(isExpense?(p.note||'Club expense'):'(deleted)');
    const meta=p.players?(p.note||'—'):(isExpense?'Club expense':(p.note||'—'));
    const pill=isExpense?'<span class="pill pill-due">Expense</span>':`<span class="pill ${p.paid?'pill-paid':'pill-due'}">${p.paid?'Paid':'Owed'}</span>`;
    return `<div class="list-row"><div class="player-info"><div class="player-name">${nm}</div><div class="player-meta">${meta}</div></div>
      <div style="text-align:right"><div class="pay-amt ${p.amount>=0?'pos':'neg'}">${p.amount<0?'-':''}$${Math.abs(p.amount).toFixed(2)}</div>
      ${pill}</div>
      <button class="del" onclick="deletePayment('${p.id}')">🗑</button></div>`;
  }).join('');
}

function renderDashboard(players,payments){
  let collected=0,spent=0,owed=0;
  payments.forEach(p=>{
    const a=Number(p.amount)||0;
    if(!p.paid){owed+=a;return;}
    if(a>=0)collected+=a;else spent+=Math.abs(a);
  });
  const balance=collected-spent;
  document.getElementById('d-collected').textContent='$'+collected.toFixed(2);
  document.getElementById('d-spent').textContent='-$'+spent.toFixed(2);
  const bEl=document.getElementById('d-balance');
  bEl.textContent='$'+balance.toFixed(2);
  bEl.className='stat-val '+(balance>=0?'pos':'neg');
  const sum=document.getElementById('d-money-summary');
  if(sum)sum.textContent=`${players.length} players · Balance = Collected − Spent`+(owed?` · Outstanding $${owed.toFixed(2)}`:'');
  const byTeam={};players.forEach(p=>{const t=p.team||'?';byTeam[t]=(byTeam[t]||0)+1;});
  const teams=Object.keys(byTeam).sort();
  document.getElementById('d-teams').innerHTML=teams.length?teams.map(t=>`<div class="list-row">${teamBadge(t)}<div class="player-info"><div class="player-name">Team ${t}</div></div><div class="player-meta">${byTeam[t]} player${byTeam[t]>1?'s':''}</div></div>`).join(''):'<div class="empty">No players yet</div>';
}

function isPlayed(m){return m.home_goals!==null&&m.away_goals!==null&&m.home_goals!==undefined&&m.away_goals!==undefined;}

function renderTournament(){renderSetup();renderMatches();renderTable();}

function renderSetup(){
  const cg=document.getElementById('t-count-grid');
  cg.innerHTML=[3,4,5,6,7].map(n=>`<button class="count-btn ${n===setupNum?'on':''}" onclick="setSetupCount(${n})">${n}</button>`).join('');
  let html='';
  for(let i=0;i<setupNum;i++){const id=IDS[i];const val=setupNames[id]!==undefined?setupNames[id]:('Team '+id);html+=`<div class="tname-row">${teamBadge(id)}<input type="text" style="margin:0" value="${(val||'').replace(/"/g,'&quot;')}" oninput="setupNames['${id}']=this.value"></div>`;}
  document.getElementById('t-team-names').innerHTML=html;
}
function setSetupCount(n){setupNum=n;renderSetup();}

function renderMatches(){
  const el=document.getElementById('t-match-list');
  if(!tMatches.length){el.innerHTML='<div class="empty">No fixtures — generate in Setup</div>';return;}
  let html='';
  tMatches.forEach(m=>{
    const played=isPlayed(m);
    const hv=played?m.home_goals:'';
    const av=played?m.away_goals:'';
    html+=`<div class="match-card" id="mc-${m.id}">
      <div class="match-hd"><span>Match ${m.match_no}</span>
        <span class="pill ${played?'pill-played':'pill-not'}" id="badge-${m.id}">${played?'✓ Played':'Not played'}</span></div>
      <div class="match-row">
        <div class="tn">${teamBadge(m.home_team)} ${teamName(m.home_team)}</div>
        <input class="sc-inp" type="number" inputmode="numeric" min="0" max="99" placeholder="–" value="${hv}" onchange="saveScore('${m.id}','h',this.value)">
        <div class="vs-dot">vs</div>
        <input class="sc-inp" type="number" inputmode="numeric" min="0" max="99" placeholder="–" value="${av}" onchange="saveScore('${m.id}','a',this.value)">
        <div class="tn r">${teamName(m.away_team)} ${teamBadge(m.away_team)}</div>
      </div>
      <div class="scorers-section">
        <div class="scorers-hd">⚽ Goal scorers</div>
        <div id="goals-${m.id}"></div>
        <button class="add-scorer-btn" onclick="addGoal('${m.id}')">+ add scorer</button>
      </div></div>`;
  });
  el.innerHTML=html;
  tMatches.forEach(m=>renderMatchGoals(m.id));
}

function renderMatchGoals(matchId){
  const m=tMatches.find(x=>x.id===matchId);
  const cont=document.getElementById('goals-'+matchId);
  if(!cont)return;
  const list=tGoals.filter(g=>g.match_id===matchId);
  cont.innerHTML=list.map(g=>`<div class="scorer-entry">
    <select class="team-sel" onchange="setGoalField('${g.id}','team',this.value)">
      <option value="${m.home_team}" ${g.team===m.home_team?'selected':''}>${teamName(m.home_team)}</option>
      <option value="${m.away_team}" ${g.team===m.away_team?'selected':''}>${teamName(m.away_team)}</option>
    </select>
    <input class="name-inp" type="text" placeholder="scorer name" value="${(g.scorer||'').replace(/"/g,'&quot;')}" onchange="setGoalField('${g.id}','scorer',this.value)">
    <button class="rm-btn" onclick="removeGoal('${g.id}')">×</button></div>`).join('');
}

function updatePlayedBadge(matchId){
  const m=tMatches.find(x=>x.id===matchId);
  const b=document.getElementById('badge-'+matchId);
  if(!b)return;
  const played=isPlayed(m);
  b.className='pill '+(played?'pill-played':'pill-not');
  b.textContent=played?'✓ Played':'Not played';
}

function renderTable(){
  const played=tMatches.filter(isPlayed);
  const wrap=document.getElementById('t-table-wrap');
  if(!played.length){wrap.innerHTML='<div class="empty">No matches played yet</div>';renderScorers();return;}
  const teamIds=IDS.slice(0,tour.num_teams);
  const T={};teamIds.forEach(t=>{T[t]={p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0};});
  played.forEach(m=>{
    const h=m.home_goals,a=m.away_goals,ht=T[m.home_team],at=T[m.away_team];
    if(!ht||!at)return;
    ht.p++;at.p++;ht.gf+=h;ht.ga+=a;at.gf+=a;at.ga+=h;
    if(h>a){ht.w++;ht.pts+=3;at.l++;}else if(h<a){at.w++;at.pts+=3;ht.l++;}else{ht.d++;ht.pts++;at.d++;at.pts++;}
  });
  const rows=teamIds.map(t=>({id:t,...T[t],gd:T[t].gf-T[t].ga})).sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);
  const dash='<span class="dash">–</span>';
  const tbody=rows.map((r,i)=>`<tr class="${i===0&&r.p>0?'gold':''}">
    <td title="${teamName(r.id)}">${i===0&&r.p>0?'🥇 ':''}${teamBadge(r.id)} ${teamName(r.id)}</td>
    <td>${r.p||dash}</td><td>${r.p?r.w:dash}</td><td>${r.p?r.d:dash}</td><td>${r.p?r.l:dash}</td>
    <td>${r.p?r.gf:dash}</td><td>${r.p?r.ga:dash}</td>
    <td class="${r.gd>0?'gd-pos':r.gd<0?'gd-neg':''}">${r.p?(r.gd>0?'+':'')+r.gd:dash}</td>
    <td style="font-weight:700">${r.p?r.pts:dash}</td></tr>`).join('');
  let html=`<div class="tbl-wrap"><table><thead><tr><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead><tbody>${tbody}</tbody></table></div>`;
  if(rows.length>=2&&rows[0].p>0){
    html+='<div class="card"><div class="card-hd">🏆 Knockout (from standings)</div>';
    if(rows.length>=4)html+=`<div class="list-row"><div class="player-info"><div class="player-name">3rd place play-off</div><div class="player-meta">${teamName(rows[2].id)} vs ${teamName(rows[3].id)}</div></div></div>`;
    html+=`<div class="list-row"><div class="player-info"><div class="player-name">Final</div><div class="player-meta">${teamName(rows[0].id)} vs ${teamName(rows[1].id)}</div></div></div>`;
    html+='<div class="muted">Seeded from the table above. Play these off to decide placings.</div></div>';
  }
  wrap.innerHTML=html;
  renderScorers();
}

function renderScorers(){
  const tally={};
  tGoals.forEach(g=>{
    if(!g.scorer||!g.scorer.trim())return;
    const key=g.scorer.trim().toLowerCase()+'|'+g.team;
    if(tally[key])tally[key].goals++;else tally[key]={name:g.scorer.trim(),team:g.team,goals:1};
  });
  const all=Object.values(tally).sort((a,b)=>b.goals-a.goals);
  const el=document.getElementById('t-scorers');
  el.innerHTML=all.length?all.map((s,i)=>`<div class="top-row"><div class="rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</div>${teamBadge(s.team)}
    <div class="player-info"><div class="player-name cap">${s.name}</div><div class="player-meta">${teamName(s.team)}</div></div>
    <div class="top-goals">${s.goals}</div></div>`).join(''):'<div class="empty">No goals logged yet</div>';
}

function show(id,btn){
  document.querySelectorAll('.sec').forEach(s=>s.classList.remove('on'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('on'));
  document.getElementById(id).classList.add('on');btn.classList.add('on');
}

// ---- Site usage (unique visitors by salted IP hash) ----
const VISIT_SALT='nepcali-fc::v1';
async function sha256Hex(str){
  if(!(window.crypto&&crypto.subtle))return null;
  const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function fetchIP(){
  try{const r=await fetch('https://api.ipify.org?format=json');const j=await r.json();return j.ip||null;}
  catch(e){return null;}
}
async function trackVisit(){
  if(!supa){renderUsage();return;}
  try{
    if(!sessionStorage.getItem('nc_visit_logged')){
      const ip=await fetchIP();
      const h=ip?await sha256Hex(VISIT_SALT+'::'+ip):null;
      if(h){
        const {data,error}=await supa.rpc('log_visit',{p_hash:h});
        if(!error){
          sessionStorage.setItem('nc_visit_logged','1');
          if(data!=null)localStorage.setItem('nc_my_visits',data);
        }
      }
    }
  }catch(e){/* ignore — usage is best-effort */}
  renderUsage();
}
async function renderUsage(){
  const uEl=document.getElementById('u-unique'),tEl=document.getElementById('u-total'),yEl=document.getElementById('u-you');
  if(yEl)yEl.textContent=localStorage.getItem('nc_my_visits')||'–';
  if(!supa)return;
  try{
    const {data,error}=await supa.rpc('visit_stats');
    if(!error&&data&&data.length){
      if(uEl)uEl.textContent=data[0].unique_visitors;
      if(tEl)tEl.textContent=data[0].total_visits;
    }
  }catch(e){/* table/functions not set up yet — leave as – */}
}

function goHome(){
  document.getElementById('app').style.display='none';
  document.getElementById('welcome').style.display='flex';
  window.scrollTo(0,0);
}
function enterApp(tabId){
  document.getElementById('welcome').style.display='none';
  document.getElementById('app').style.display='block';
  window.scrollTo(0,0);
  if(tabId){
    const map={tournament:0,dashboard:1,lineup:2,roster:3,money:4};
    const btn=document.querySelectorAll('.nav-btn')[map[tabId]];
    if(btn)btn.click();
  }
}

function updateWelcomeStats(){}
function subshow(id,btn){
  document.querySelectorAll('.subsec').forEach(s=>s.classList.remove('on'));
  document.querySelectorAll('.subnav-btn').forEach(b=>b.classList.remove('on'));
  document.getElementById(id).classList.add('on');btn.classList.add('on');
}

if(initSupabase()){
  applyAuthUI();
  loadAll();
  checkSession();
  trackVisit();
}
