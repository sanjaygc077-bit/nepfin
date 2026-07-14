let supa=null,isSignup=false;
const IDS=['A','B','C','D','E','F','G'];
let tour=null,tMatches=[],tGoals=[],setupNum=4,setupNames={},tHistory=[];
let _players=[],_payments=[],_editId=null;
let _settings={},_settingsBackend='local';
const SETTINGS_LS='nepcali_club_settings_v1';
// Each formation = a list of slots: [roleLabel, x%, y%] on the pitch (GK at bottom).
// 11-a-side formations have 11 slots; 8-a-side formations have 8 slots.
const FORMATIONS={
  '4-4-2':[['GK',50,90],['DEF',20,72],['DEF',40,72],['DEF',60,72],['DEF',80,72],['MID',20,50],['MID',40,50],['MID',60,50],['MID',80,50],['FWD',35,27],['FWD',65,27]],
  '4-3-3':[['GK',50,90],['DEF',20,72],['DEF',40,72],['DEF',60,72],['DEF',80,72],['MID',28,50],['MID',50,50],['MID',72,50],['FWD',22,27],['FWD',50,23],['FWD',78,27]],
  '3-5-2':[['GK',50,90],['DEF',30,73],['DEF',50,73],['DEF',70,73],['MID',12,52],['MID',31,52],['MID',50,52],['MID',69,52],['MID',88,52],['FWD',38,27],['FWD',62,27]],
  '4-2-3-1':[['GK',50,90],['DEF',20,74],['DEF',40,74],['DEF',60,74],['DEF',80,74],['MID',35,58],['MID',65,58],['AM',25,40],['AM',50,40],['AM',75,40],['FWD',50,22]],
  '5-3-2':[['GK',50,90],['DEF',12,74],['DEF',31,74],['DEF',50,74],['DEF',69,74],['DEF',88,74],['MID',30,52],['MID',50,52],['MID',70,52],['FWD',38,28],['FWD',62,28]],
  // ---- 8-a-side (8v8): 1 GK + 7 outfield ----
  '3-3-1':[['GK',50,90],['DEF',25,72],['DEF',50,72],['DEF',75,72],['MID',25,50],['MID',50,50],['MID',75,50],['FWD',50,27]],
  '2-3-2':[['GK',50,90],['DEF',33,73],['DEF',67,73],['MID',25,50],['MID',50,50],['MID',75,50],['FWD',35,27],['FWD',65,27]],
  '3-2-2':[['GK',50,90],['DEF',25,73],['DEF',50,73],['DEF',75,73],['MID',35,50],['MID',65,50],['FWD',35,27],['FWD',65,27]],
  '2-4-1':[['GK',50,90],['DEF',33,73],['DEF',67,73],['MID',15,50],['MID',38,50],['MID',62,50],['MID',85,50],['FWD',50,27]]
};
// Which formations belong to each team size (drives the grouped dropdown).
const FORMATION_GROUPS=[
  {label:'11-a-side',keys:['4-4-2','4-3-3','3-5-2','4-2-3-1','5-3-2']},
  {label:'8-a-side',keys:['3-3-1','2-3-2','3-2-2','2-4-1']}
];
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
  // When a user returns via the password-reset email link, Supabase fires this.
  supa.auth.onAuthStateChange((event)=>{ if(event==='PASSWORD_RECOVERY') enterRecovery(); });
  return true;
}

function toggleMode(){
  isSignup=!isSignup;
  document.getElementById('login-btn').textContent=isSignup?'Create account':'Sign in';
  document.getElementById('toggle-mode').textContent=isSignup?'Already have an account? Sign in':'New here? Create an account';
  const e=document.getElementById('auth-err');e.style.display='none';e.style.color='#dc2626';
}
let isLoggedIn=false;

// Emails allowed to view/edit the Money section. Add more members here.
const MONEY_EDITORS=['sanjay.gc09@gmail.com'];
let userEmail=null;
function canEditMoney(){return !!userEmail && MONEY_EDITORS.includes(userEmail.trim().toLowerCase());}

function openLogin(){document.getElementById('login-modal').style.display='flex';}
function closeLogin(){document.getElementById('login-modal').style.display='none';}
function authBtnClick(){ if(isLoggedIn) doLogout(); else openLogin(); }

let recoveryMode=false;
function setRecoveryUI(on){
  recoveryMode=on;
  const er=document.getElementById('email-row');if(er)er.style.display=on?'none':'block';
  const pl=document.getElementById('pass-label');if(pl)pl.textContent=on?'New password':'Password';
  document.getElementById('login-btn').textContent=on?'Update password':(isSignup?'Create account':'Sign in');
  const tm=document.getElementById('toggle-mode');if(tm)tm.style.display=on?'none':'block';
  const fl=document.getElementById('forgot-link');if(fl)fl.style.display=on?'none':'block';
  const h=document.querySelector('#login-modal h1');if(h)h.textContent=on?'🔑 Set a new password':'🔒 Sign in to edit';
}
function enterRecovery(){
  openLogin();
  document.getElementById('password').value='';
  const err=document.getElementById('auth-err');err.style.display='none';
  setRecoveryUI(true);
}
async function forgotPassword(){
  const email=document.getElementById('email').value.trim();
  const err=document.getElementById('auth-err');err.style.display='none';err.style.color='#dc2626';
  if(!supa){err.textContent='Not connected yet — try again in a moment.';err.style.display='block';return;}
  if(!email){err.textContent='Type your email above first, then tap “Forgot password”.';err.style.display='block';return;}
  const {error}=await supa.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
  if(error){err.textContent=error.message;err.style.display='block';return;}
  err.style.color='#16a34a';err.textContent='Reset link sent. Check '+email+', open the link on this device, then set a new password.';err.style.display='block';
}
async function updatePassword(){
  const password=document.getElementById('password').value;
  const err=document.getElementById('auth-err');err.style.display='none';err.style.color='#dc2626';
  if(!password||password.length<6){err.textContent='Enter a new password (at least 6 characters)';err.style.display='block';return;}
  const {error}=await supa.auth.updateUser({password});
  if(error){err.textContent=error.message;err.style.display='block';return;}
  const {data}=await supa.auth.getSession();
  isLoggedIn=!!(data&&data.session);
  userEmail=(data&&data.session&&data.session.user&&data.session.user.email)||userEmail;
  document.getElementById('auth-btn').textContent='Sign out';
  err.style.color='#16a34a';err.textContent='Password updated — you’re signed in.';err.style.display='block';
  setTimeout(()=>{setRecoveryUI(false);closeLogin();loadPrivate();},1300);
}
async function doAuth(){
  if(recoveryMode){return updatePassword();}
  const email=document.getElementById('email').value.trim();
  const password=document.getElementById('password').value;
  const err=document.getElementById('auth-err');err.style.display='none';
  if(!email||!password){err.textContent='Enter email and password';err.style.display='block';return;}
  const res=isSignup?await supa.auth.signUp({email,password}):await supa.auth.signInWithPassword({email,password});
  if(res.error){err.textContent=res.error.message;err.style.display='block';return;}
  if(isSignup&&!res.data.session){err.style.color='#16a34a';err.textContent='Account created. Check email to confirm, then sign in.';err.style.display='block';toggleMode();return;}
  isLoggedIn=true;
  userEmail=(res.data.user&&res.data.user.email)||email;
  closeLogin();
  document.getElementById('auth-btn').textContent='Sign out';
  loadPrivate();
}
async function doLogout(){await supa.auth.signOut();location.reload();}
async function checkSession(){
  const {data}=await supa.auth.getSession();
  if(data.session){isLoggedIn=true;userEmail=data.session.user&&data.session.user.email;document.getElementById('auth-btn').textContent='Sign out';loadPrivate();}
}

// Tabs that need login. If not logged in, open the modal instead of switching.
// The Money tab additionally requires an allowlisted member email.
function gatedShow(id,btn){
  if(!isLoggedIn){openLogin();return;}
  if(id==='money'&&!canEditMoney()){
    alert('This account isn’t authorized for the Money section.\n\nSigned in as: '+(userEmail||'unknown'));
    return;
  }
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
  renderDashboard();
}
function escAttr(s){return (s||'').replace(/"/g,'&quot;');}
function teamOpts(sel){return '<option value="">— team —</option>'+IDS.map(id=>`<option value="${id}" ${sel===id?'selected':''}>Team ${id}</option>`).join('');}
function posOpts(sel){return '<option value="">— pos —</option>'+['GK','DEF','MID','FWD'].map(o=>`<option value="${o}" ${sel===o?'selected':''}>${o}</option>`).join('');}

async function loadPayments(){const {data,error}=await supa.from('payments').select('*, players(name, team)').order('created_at',{ascending:false});if(error){console.error(error);return[];}return data;}
async function addPayment(){
  if(!canEditMoney()){alert('You are not authorized to edit the Money section.');return;}
  const player_id=document.getElementById('m-player').value;
  const amount=parseFloat(document.getElementById('m-amount').value);
  if(!player_id){alert('Select a player');return;}
  if(isNaN(amount)){alert('Enter an amount');return;}
  const {error}=await supa.from('payments').insert({player_id,amount,paid:document.getElementById('m-paid').value==='true',note:document.getElementById('m-note').value.trim()});
  if(error){alert(error.message);return;}
  document.getElementById('m-amount').value='';document.getElementById('m-note').value='';
  loadAll();
}
async function addExpense(){
  if(!canEditMoney()){alert('You are not authorized to edit the Money section.');return;}
  const amount=parseFloat(document.getElementById('e-amount').value);
  if(isNaN(amount)||amount<=0){alert('Enter the amount spent');return;}
  const note=document.getElementById('e-note').value.trim();
  const date=document.getElementById('e-date').value||null;
  const row={player_id:null,amount:-Math.abs(amount),paid:true,note:note||'Club expense',txn_date:date};
  let {error}=await supa.from('payments').insert(row);
  // If the txn_date column hasn't been added yet, save without it.
  if(error&&/txn_date/i.test(error.message||'')){delete row.txn_date;({error}=await supa.from('payments').insert(row));}
  if(error){alert(error.message);return;}
  document.getElementById('e-amount').value='';document.getElementById('e-note').value='';
  loadAll();
}
async function deletePayment(id){if(!canEditMoney()){alert('You are not authorized to edit the Money section.');return;}await supa.from('payments').delete().eq('id',id);loadAll();}

async function loadTournament(){
  let {data}=await supa.from('tournaments').select('*').order('created_at',{ascending:false});
  if(!data||!data.length){
    const ins=await supa.from('tournaments').insert({name:'NEP Cali',num_teams:4,team_names:{}}).select().single();
    tour=ins.data;data=[tour];
  }
  // Pick the newest tournament, but if it has no fixtures fall back to one that
  // does. Duplicate/empty tournament rows can exist (e.g. a race on first load),
  // and loading the empty one leaves the Scores tab with no match/scorer controls.
  tour=data[0];
  let m=await supa.from('matches').select('*').eq('tournament_id',tour.id).order('match_no');
  tMatches=m.data||[];
  if(!tMatches.length){
    for(const t of data){
      if(t.id===tour.id)continue;
      const r=await supa.from('matches').select('*').eq('tournament_id',t.id).order('match_no');
      if(r.data&&r.data.length){tour=t;tMatches=r.data;break;}
    }
  }
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
  const changed=await ensureKnockouts();
  if(changed){renderTournament();}else{renderTable();updatePlayedBadge(matchId);}
}
async function addGoal(matchId){
  const m=tMatches.find(x=>x.id===matchId);
  const ins=await supa.from('goals').insert({match_id:matchId,team:m.home_team,scorer:''}).select().single();
  if(ins.data){tGoals.push(ins.data);renderMatchGoals(matchId);}
}

// Once every league match is played, create the knockout fixtures (3rd-place
// play-off + Final) seeded from the final table, so they can be scored like
// any other match. While unplayed, knockout teams are kept in sync with the
// standings; once a knockout match has a score its teams are left alone.
let _koBusy=false;
async function ensureKnockouts(){
  if(!tour||_koBusy)return false;
  const league=tMatches.filter(isLeague);
  if(!league.length||!league.every(isPlayed))return false;
  const rows=computeStandings();
  if(!(rows.length>=2&&rows[0].p>0))return false;
  const want=[];
  if(tour.num_teams>=4&&rows.length>=4)want.push({stage:'third',home:rows[2].id,away:rows[3].id});
  want.push({stage:'final',home:rows[0].id,away:rows[1].id});
  _koBusy=true;
  let changed=false;
  try{
    let maxNo=Math.max(0,...tMatches.map(m=>m.match_no||0));
    for(const w of want){
      const ex=tMatches.find(m=>m.stage===w.stage);
      if(ex){
        if(!isPlayed(ex)&&(ex.home_team!==w.home||ex.away_team!==w.away)){
          await supa.from('matches').update({home_team:w.home,away_team:w.away}).eq('id',ex.id);
          ex.home_team=w.home;ex.away_team=w.away;changed=true;
        }
      }else{
        maxNo++;
        const ins=await supa.from('matches').insert({tournament_id:tour.id,match_no:maxNo,stage:w.stage,home_team:w.home,away_team:w.away}).select().single();
        if(ins.data){tMatches.push(ins.data);changed=true;}
      }
    }
  }finally{_koBusy=false;}
  return changed;
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
  await ensureKnockouts();
  renderTournament();
  loadHistory();
  await loadSettings();
  renderDashboardExtras();
  updateWelcomeStats();
  loadPolls();
  loadResults();
  loadSnaps();
  loadPrivate();
}
// Roster + Dashboard are public to read; Money tab is gated in the UI.
// Writes (add/delete player, payments) are still restricted by Supabase rules.
async function loadPrivate(){
  applyAuthUI();
  const players=await loadPlayers();
  const payments=await loadPayments();
  _players=players;_payments=payments;
  renderRoster(players);renderMoney(players,payments);renderDashboard();
  renderLineup();
}

// ---- Club settings (dashboard extras + starting XI) ----
// Tries the public club_settings table; falls back to localStorage so
// the features work even before migrations/schema-dashboard.sql is run.
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
  renderSocials();
  renderSocialInputs();
  renderDashboard();
}
function kpiCount(id,to){
  const el=document.getElementById(id);if(!el)return;
  to=to||0;const from=parseInt(el.textContent,10)||0;
  if(from===to){el.textContent=to;return;}
  const steps=Math.min(18,Math.abs(to-from));let i=0;clearInterval(el._t);
  el._t=setInterval(()=>{i++;el.textContent=Math.round(from+(to-from)*(i/steps));if(i>=steps){clearInterval(el._t);el.textContent=to;}},26);
}
function renderDashboard(){
  const players=_players||[];
  const teams=new Set(players.map(p=>p.team).filter(Boolean));
  kpiCount('k-players',players.length);
  kpiCount('k-teams',teams.size);
  const today=new Date(new Date().toDateString());
  const cands=[];
  (_settings.events||[]).forEach(e=>{if(e.date)cands.push({name:e.name,date:e.date});});
  const t=_settings.next_tournament||{};
  if(t.date)cands.push({name:t.name||'Tournament',date:t.date});
  const future=cands.filter(c=>new Date(c.date+'T00:00:00')>=today).sort((a,b)=>a.date.localeCompare(b.date));
  kpiCount('k-events',future.length);
  const setT=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  const nx=document.getElementById('d-nextup');const box=document.getElementById('d-countbox');
  if(future.length){
    const c=future[0];const days=Math.ceil((new Date(c.date+'T00:00:00')-today)/86400000);
    if(nx)nx.innerHTML='Next up: <b style="color:#fff">'+escAttr(c.name)+'</b> · '+fmtDate(c.date);
    if(box){box.style.display='';setT('d-count-num',days===0?'0':days);setT('d-count-lbl',days===0?'today ⚽':(days===1?'day to go':'days to go'));}
  }else{
    if(nx)nx.textContent='No upcoming events yet — add one below.';
    if(box)box.style.display='none';
  }
  renderMoneyStats(_players,_payments);
  renderDashLatest();
  renderDashRSVP();
}
function renderDashRSVP(){
  const el=document.getElementById('d-rsvp');if(!el)return;
  if(typeof polls==='undefined'||!polls.length){el.innerHTML='<div class="empty">No polls yet</div>';return;}
  const p=polls[0];const t=pollTally(p.id);
  el.innerHTML=`<div class="dash-rsvp-q">${escAttr(p.question)}</div>`+
    (p.when_text?`<div class="dash-rsvp-when">${escAttr(p.when_text)}</div>`:'')+
    `<div class="dash-rsvp-nums">
      <div class="drn"><b>${t.members}</b><span>Going</span></div>
      <div class="drn"><b>+${t.guests}</b><span>Guests</span></div>
      <div class="drn drn-hi"><b>${t.total}</b><span>Total</span></div>
    </div>
    <button class="btn" style="margin-top:10px" onclick="show('rsvp',document.querySelector('.nav-btn[data-tab=&quot;rsvp&quot;]'))">Open RSVP →</button>`;
}
function renderDashLatest(){
  const lr=document.getElementById('d-lastresult');
  if(lr)lr.innerHTML=(typeof extResults!=='undefined'&&extResults.length)?matchRow(extResults[0],'d-'):'<div class="empty">No matches yet</div>';
  const ls=document.getElementById('d-lastsnap');
  if(ls){
    if(typeof snaps!=='undefined'&&snaps.length){
      const s=snaps[0];
      const media=s.type==='video'?`<video src="${escAttr(s.url)}" muted playsinline preload="metadata"></video>`:`<img src="${escAttr(s.url)}" alt="">`;
      ls.innerHTML=`<div class="dash-snap-thumb" onclick="show('snaps',document.querySelector('.nav-btn[data-tab=&quot;snaps&quot;]'))">${media}</div>${s.caption?`<div class="dash-snap-cap">${escAttr(s.caption)}</div>`:''}`;
    }else ls.innerHTML='<div class="empty">No snaps yet</div>';
  }
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
  if(fSel)fSel.innerHTML=FORMATION_GROUPS.map(g=>
    `<optgroup label="${g.label}">`+g.keys.filter(f=>FORMATIONS[f]).map(f=>
      `<option value="${f}" ${f===xi.formation?'selected':''}>${f}</option>`).join('')+`</optgroup>`
  ).join('');
  const slots=FORMATIONS[xi.formation];
  const pitch=document.getElementById('xi-pitch');
  if(pitch){
    pitch.innerHTML=PITCH_MARKINGS+slots.map((s,i)=>{
      const nm=(xi.picks&&xi.picks[i])||'';
      const p=_players.find(pl=>pl.name===nm);
      const num=p&&p.jersey_no?p.jersey_no:(i+1);
      const shirt=(p&&p.photo_url)
        ? `<div class="xi-shirt photo" style="background-image:url('${escAttr(p.photo_url)}')"><span class="xi-badge">${num}</span></div>`
        : `<div class="xi-shirt ${nm?'':'empty'}">${nm?num:s[0]}</div>`;
      return `<div class="xi-tok" style="left:${s[1]}%;top:${s[2]}%">
        ${shirt}
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
// Roster editing is open to everyone, so the add form is always shown.
function applyAuthUI(){
  const addCard=document.getElementById('roster-add-card');
  if(addCard)addCard.style.display='block';
  // Social links: everyone sees the icons, but only the Money admin can edit.
  const canAdmin=canEditMoney();
  const socialCard=document.getElementById('social-card');
  if(socialCard)socialCard.style.display=canAdmin?'block':'none';
  const socialEdit=document.getElementById('social-edit-wrap');
  if(socialEdit)socialEdit.style.display=canAdmin?'block':'none';
}

function renderRoster(players){
  document.getElementById('roster-count').textContent=players.length;
  // Order the roster by jersey number (players with no number go last).
  players=players.slice().sort((a,b)=>{
    const ja=a.jersey_no==null?Infinity:a.jersey_no;
    const jb=b.jersey_no==null?Infinity:b.jersey_no;
    if(ja!==jb)return ja-jb;
    return (a.name||'').localeCompare(b.name||'');
  });
  const el=document.getElementById('roster-list');
  if(!players.length){
    el.innerHTML='<div class="empty">No players yet</div>';
  }else{
    el.innerHTML=players.map((p,i)=>{
      // Inline editor — for the row the user chose to edit (open to everyone).
      if(_editId===p.id){
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
      // Simple list row: "10. Krisham" — leading number is the jersey number.
      // Tapping the name expands a detail panel with the player's photo.
      const meta=(p.team||p.position)?`<div class="player-meta">${p.team?'Team '+p.team:''}${p.team&&p.position?' · ':''}${p.position||''}</div>`:'';
      const lead=p.jersey_no!=null?`${p.jersey_no}. `:'';
      const cam=p.photo_url?'📷':'';
      const edit=`<button class="del" style="color:var(--gold-l)" onclick="editPlayer('${p.id}')">✏️</button><button class="del" onclick="deletePlayer('${p.id}')">🗑</button>`;
      const open=_openPlayers.has(p.id);
      return `<div class="list-row">
        <div class="player-info pl-clickable" onclick="togglePlayer('${p.id}')"><div class="player-name">${lead}${p.name} <span class="pl-cam">${cam}</span> <span class="pl-arrow">${open?'▴':'▾'}</span></div>${meta}</div>
        ${edit}</div>
        <div class="pd" id="pd-${p.id}" style="display:${open?'block':'none'}">${playerDetailHTML(p)}</div>`;
    }).join('');
  }
  const sel=document.getElementById('m-player');
  sel.innerHTML='<option value="">Select player…</option>'+players.map(p=>`<option value="${p.id}">${p.name} (Team ${p.team||'?'})</option>`).join('');
}
function editPlayer(id){_editId=id;renderRoster(_players);}
function doneEdit(){_editId=null;renderRoster(_players);}

// ---- Player photos (roster detail panel; reuses the public "snaps" bucket) ----
const _openPlayers=new Set();
function togglePlayer(id){
  const el=document.getElementById('pd-'+id);if(!el)return;
  if(_openPlayers.has(id)){_openPlayers.delete(id);}else{_openPlayers.add(id);}
  renderRoster(_players);
}
function playerDetailHTML(p){
  const avatar=p.photo_url
    ? `<div class="pd-avatar" style="background-image:url('${escAttr(p.photo_url)}')"></div>`
    : `<div class="pd-avatar empty">${escAttr((p.name||'?').trim().charAt(0).toUpperCase())}</div>`;
  const info=[p.jersey_no!=null?('#'+p.jersey_no):'',p.team?('Team '+p.team):'',p.position||''].filter(Boolean).join(' · ');
  const changeLbl=p.photo_url?'Change photo':'Add photo';
  return `<div class="pd-inner">
    ${avatar}
    <div class="pd-body">
      <div class="pd-name">${escAttr(p.name)}</div>
      ${info?`<div class="pd-meta">${escAttr(info)}</div>`:''}
      <div class="pd-actions">
        <label class="pd-btn">${changeLbl}<input type="file" accept="image/*" style="display:none" onchange="uploadPlayerPhoto('${p.id}',this)"></label>
        ${p.photo_url?`<button class="pd-btn pd-btn-rm" onclick="removePlayerPhoto('${p.id}')">Remove</button>`:''}
      </div>
      <div class="pd-prog" id="pp-${p.id}"></div>
    </div>
  </div>`+ratingCardHTML(p);
}
// FIFA-style rating card. Admins (Money editors) get editable inputs;
// everyone else sees the values read-only.
function ratingCardHTML(p){
  const r=p.ratings||{};
  const admin=canEditMoney();
  const stats=[['PAC','pac'],['SHO','sho'],['PAS','pas'],['DRI','dri'],['DEF','def'],['PHY','phy']];
  const nums=stats.map(s=>r[s[1]]).filter(v=>typeof v==='number');
  const computed=nums.length?Math.round(nums.reduce((a,b)=>a+b,0)/nums.length):null;
  const ovr=(typeof r.ovr==='number')?r.ovr:computed;
  const hasAny=(typeof r.ovr==='number')||nums.length>0;
  if(!admin&&!hasAny)return '';   // nothing to show guests for an unrated player
  const ovrTop=admin
    ? `<input type="number" min="0" max="99" class="rc-ovr-inp" value="${typeof r.ovr==='number'?r.ovr:''}" placeholder="${computed!=null?computed:'--'}" onchange="setPlayerRating('${p.id}','ovr',this.value)">`
    : `<div class="rc-ovr">${ovr!=null?ovr:'--'}</div>`;
  const rows=stats.map(s=>{
    const v=r[s[1]];
    const cell=admin
      ? `<input type="number" min="0" max="99" value="${typeof v==='number'?v:''}" onchange="setPlayerRating('${p.id}','${s[1]}',this.value)">`
      : `<span class="v">${typeof v==='number'?v:'--'}</span>`;
    return `<div class="rc-stat"><span class="k">${s[0]}</span>${cell}</div>`;
  }).join('');
  return `<div class="rating-card">
    <div class="rc-top">
      <div><div class="rc-ovr-lbl">Overall</div>${ovrTop}</div>
      ${p.position?`<div class="rc-pos">${escAttr(p.position)}</div>`:''}
    </div>
    <div class="rc-grid">${rows}</div>
    ${admin?'<div class="rc-note">Editable by admins · visible to everyone. Leave blank to hide a stat.</div>':''}
  </div>`;
}
async function setPlayerRating(id,key,val){
  if(!supa)return;
  const p=_players.find(x=>x.id===id);if(!p)return;
  const r=Object.assign({},p.ratings||{});
  let n=parseInt(val,10);
  if(isNaN(n)){delete r[key];}else{r[key]=Math.max(0,Math.min(99,n));}
  p.ratings=r;                                   // optimistic local update
  const {error}=await supa.from('players').update({ratings:r}).eq('id',id);
  if(error){alert(error.message+'\n\nIf it mentions a missing column, run migrations/schema-player-photos.sql in Supabase.');return;}
  renderRoster(_players);
}
async function uploadPlayerPhoto(id,input){
  if(!supa){alert('Not connected to the database.');return;}
  const file=input&&input.files&&input.files[0];
  if(!file)return;
  if(file.size>10*1024*1024){alert('That image is over 10 MB. Please pick a smaller one.');return;}
  const prog=document.getElementById('pp-'+id);if(prog)prog.textContent='Uploading…';
  const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');
  const path='players/'+id+'-'+Date.now()+'.'+ext;
  const up=await supa.storage.from(SNAP_BUCKET).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type||undefined});
  if(up.error){if(prog)prog.textContent='';
    alert('Upload failed: '+up.error.message+'\n\nMake sure you ran migrations/schema-snaps.sql (creates the “snaps” storage bucket).');return;}
  const url=supa.storage.from(SNAP_BUCKET).getPublicUrl(path).data.publicUrl;
  const old=(_players.find(x=>x.id===id)||{}).photo_path;
  const {error}=await supa.from('players').update({photo_url:url,photo_path:path}).eq('id',id);
  if(error){if(prog)prog.textContent='';
    alert('Uploaded the file but could not save it: '+error.message+'\n\nIf it mentions a missing column, run migrations/schema-player-photos.sql in Supabase.');return;}
  if(old&&old!==path)await supa.storage.from(SNAP_BUCKET).remove([old]);
  await loadAll();
}
async function removePlayerPhoto(id){
  if(!supa)return;
  if(!confirm('Remove this player’s photo?'))return;
  const old=(_players.find(x=>x.id===id)||{}).photo_path;
  const {error}=await supa.from('players').update({photo_url:null,photo_path:null}).eq('id',id);
  if(error){alert(error.message);return;}
  if(old)await supa.storage.from(SNAP_BUCKET).remove([old]);
  await loadAll();
}

function txnDateStr(p){
  const raw=p.txn_date||p.created_at;if(!raw)return '';
  const d=new Date(p.txn_date?p.txn_date+'T00:00:00':raw);
  if(isNaN(d))return '';
  return d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
}
function renderMoney(players,payments){
  const ed=document.getElementById('e-date');if(ed&&!ed.value)ed.value=new Date().toISOString().slice(0,10);
  const el=document.getElementById('money-list');
  if(!payments.length){el.innerHTML='<div class="empty">No transactions yet</div>';return;}
  el.innerHTML=payments.map(p=>{
    const isExpense=!p.players&&Number(p.amount)<0;
    const nm=p.players?p.players.name:(isExpense?(p.note||'Club expense'):'(deleted)');
    const dstr=txnDateStr(p);
    const baseMeta=p.players?(p.note||'—'):(isExpense?'Club expense':(p.note||'—'));
    const meta=dstr?`${dstr} · ${baseMeta}`:baseMeta;
    const pill=isExpense?'<span class="pill pill-due">Expense</span>':`<span class="pill ${p.paid?'pill-paid':'pill-due'}">${p.paid?'Paid':'Owed'}</span>`;
    return `<div class="list-row"><div class="player-info"><div class="player-name">${nm}</div><div class="player-meta">${meta}</div></div>
      <div style="text-align:right"><div class="pay-amt ${p.amount>=0?'pos':'neg'}">${p.amount<0?'-':''}$${Math.abs(p.amount).toFixed(2)}</div>
      ${pill}</div>
      <button class="del" onclick="deletePayment('${p.id}')">🗑</button></div>`;
  }).join('');
}

function renderMoneyStats(players,payments){
  players=players||[];payments=payments||[];
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
  bEl.className='kpi-val '+(balance>=0?'pos':'neg');
  const sum=document.getElementById('d-money-summary');
  if(sum)sum.textContent=`${players.length} players · Balance = Collected − Spent`+(owed?` · Outstanding $${owed.toFixed(2)}`:'');
  const byTeam={};players.forEach(p=>{const t=p.team||'?';byTeam[t]=(byTeam[t]||0)+1;});
  const teams=Object.keys(byTeam).sort();
  document.getElementById('d-teams').innerHTML=teams.length?teams.map(t=>`<div class="list-row">${teamBadge(t)}<div class="player-info"><div class="player-name">Team ${t}</div></div><div class="player-meta">${byTeam[t]} player${byTeam[t]>1?'s':''}</div></div>`).join(''):'<div class="empty">No players yet</div>';
}

function isPlayed(m){return m.home_goals!==null&&m.away_goals!==null&&m.home_goals!==undefined&&m.away_goals!==undefined;}

function renderTournament(){renderSetup();renderMatches();renderTable();renderMatchday();renderResults();}

function renderSetup(){
  const cg=document.getElementById('t-count-grid');
  cg.innerHTML=[3,4,5,6,7].map(n=>`<button class="count-btn ${n===setupNum?'on':''}" onclick="setSetupCount(${n})">${n}</button>`).join('');
  let html='';
  for(let i=0;i<setupNum;i++){const id=IDS[i];const val=setupNames[id]!==undefined?setupNames[id]:('Team '+id);html+=`<div class="tname-row">${teamBadge(id)}<input type="text" style="margin:0" value="${(val||'').replace(/"/g,'&quot;')}" oninput="setupNames['${id}']=this.value"></div>`;}
  document.getElementById('t-team-names').innerHTML=html;
}
function setSetupCount(n){setupNum=n;renderSetup();}

function isLeague(m){return !m.stage||m.stage==='league';}
function isKnockout(m){return m.stage==='third'||m.stage==='final';}

// One match card with editable score boxes + goal scorers — shared by the
// league fixtures (Scores tab) and the knockout fixtures (Table tab).
function matchCardHTML(m,title){
  const played=isPlayed(m);
  const hv=played?m.home_goals:'';
  const av=played?m.away_goals:'';
  return `<div class="match-card" id="mc-${m.id}">
      <div class="match-hd"><span>${title}</span>
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
}

function renderMatches(){
  const el=document.getElementById('t-match-list');
  const league=tMatches.filter(isLeague);
  if(!league.length){el.innerHTML='<div class="empty">No fixtures — generate in Setup</div>';return;}
  el.innerHTML=league.map(m=>matchCardHTML(m,'Match '+m.match_no)).join('');
  league.forEach(m=>renderMatchGoals(m.id));
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

function computeStandings(){
  const teamIds=IDS.slice(0,tour.num_teams);
  const T={};teamIds.forEach(t=>{T[t]={p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0};});
  tMatches.filter(m=>isLeague(m)&&isPlayed(m)).forEach(m=>{
    const h=m.home_goals,a=m.away_goals,ht=T[m.home_team],at=T[m.away_team];
    if(!ht||!at)return;
    ht.p++;at.p++;ht.gf+=h;ht.ga+=a;at.gf+=a;at.ga+=h;
    if(h>a){ht.w++;ht.pts+=3;at.l++;}else if(h<a){at.w++;at.pts+=3;ht.l++;}else{ht.d++;ht.pts++;at.d++;at.pts++;}
  });
  return teamIds.map(t=>({id:t,...T[t],gd:T[t].gf-T[t].ga})).sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);
}

function computeScorers(){
  const ids=new Set(tMatches.map(m=>m.id));
  const tally={};
  tGoals.forEach(g=>{
    if(!ids.has(g.match_id))return;
    if(!g.scorer||!g.scorer.trim())return;
    const key=g.scorer.trim().toLowerCase()+'|'+g.team;
    if(tally[key])tally[key].goals++;else tally[key]={name:g.scorer.trim(),team:g.team,goals:1};
  });
  return Object.values(tally).sort((a,b)=>b.goals-a.goals);
}

function renderTable(){
  const played=tMatches.filter(isPlayed);
  const wrap=document.getElementById('t-table-wrap');
  if(!played.length){wrap.innerHTML='<div class="empty">No matches played yet</div>';renderScorers();return;}
  const rows=computeStandings();
  const dash='<span class="dash">–</span>';
  const tbody=rows.map((r,i)=>`<tr class="${i===0&&r.p>0?'gold':''}">
    <td title="${teamName(r.id)}">${i===0&&r.p>0?'🥇 ':''}${teamBadge(r.id)} ${teamName(r.id)}</td>
    <td>${r.p||dash}</td><td>${r.p?r.w:dash}</td><td>${r.p?r.d:dash}</td><td>${r.p?r.l:dash}</td>
    <td>${r.p?r.gf:dash}</td><td>${r.p?r.ga:dash}</td>
    <td class="${r.gd>0?'gd-pos':r.gd<0?'gd-neg':''}">${r.p?(r.gd>0?'+':'')+r.gd:dash}</td>
    <td style="font-weight:700">${r.p?r.pts:dash}</td></tr>`).join('');
  let html=`<div class="tbl-wrap"><table><thead><tr><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead><tbody>${tbody}</tbody></table></div>`;
  const league=tMatches.filter(isLeague);
  const leagueComplete=league.length>0&&league.every(isPlayed);
  if(rows.length>=2&&rows[0].p>0){
    html+='<div class="card"><div class="card-hd">🏆 Knockout</div>';
    if(leagueComplete){
      const third=tMatches.find(m=>m.stage==='third');
      const fin=tMatches.find(m=>m.stage==='final');
      if(third)html+='<div class="scorers-hd" style="margin-bottom:8px">3rd place play-off</div>'+matchCardHTML(third,'3rd place play-off');
      if(fin)html+='<div class="scorers-hd" style="margin-bottom:8px">Final</div>'+matchCardHTML(fin,'Final');
      if(!fin)html+='<div class="muted">Setting up knockout fixtures…</div>';
      if(fin&&isPlayed(fin)){
        const w=fin.home_goals>fin.away_goals?fin.home_team:(fin.away_goals>fin.home_goals?fin.away_team:null);
        html+=w?`<div class="card-hd" style="margin-top:11px">🏆 Champion: ${teamName(w)}</div>`
              :'<div class="muted" style="margin-top:8px">Final ended level — settle it your own way (pens/replay).</div>';
      }
    }else{
      if(rows.length>=4)html+=`<div class="list-row"><div class="player-info"><div class="player-name">3rd place play-off</div><div class="player-meta">${teamName(rows[2].id)} vs ${teamName(rows[3].id)}</div></div></div>`;
      html+=`<div class="list-row"><div class="player-info"><div class="player-name">Final</div><div class="player-meta">${teamName(rows[0].id)} vs ${teamName(rows[1].id)}</div></div></div>`;
      html+='<div class="muted">Seeded from the table above. Finish all league matches to unlock score and scorer entry here.</div>';
    }
    html+='</div>';
  }
  wrap.innerHTML=html;
  tMatches.filter(isKnockout).forEach(m=>renderMatchGoals(m.id));
  renderScorers();
}

function renderScorers(){
  const all=computeScorers();
  const el=document.getElementById('t-scorers');
  el.innerHTML=all.length?all.map((s,i)=>`<div class="top-row"><div class="rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</div>${teamBadge(s.team)}
    <div class="player-info"><div class="player-name cap">${s.name}</div><div class="player-meta">${teamName(s.team)}</div></div>
    <div class="top-goals">${s.goals}</div></div>`).join(''):'<div class="empty">No goals logged yet</div>';
}

// ---- Matchday live graphics (shareable broadcast card) ----
let mdMatchId=null,mdPollTimer=null;

function mdStatusOf(m){
  const map=_settings.match_status||{};
  if(map[m.id])return map[m.id];
  return isPlayed(m)?'ft':'up';
}
function mdSetStatus(v){
  if(!mdMatchId)return;
  if(!_settings.match_status)_settings.match_status={};
  _settings.match_status[mdMatchId]=v;
  saveSettings();
  mdRenderPreview();
}
function mdScore(m){
  if(isPlayed(m))return [m.home_goals,m.away_goals];
  const gs=tGoals.filter(g=>g.match_id===m.id);
  return [gs.filter(g=>g.team===m.home_team).length, gs.filter(g=>g.team===m.away_team).length];
}
function mdGoalsFor(m){
  return tGoals.filter(g=>g.match_id===m.id).slice()
    .sort((a,b)=>new Date(a.created_at||0)-new Date(b.created_at||0));
}
function mdStageLabel(m){
  return m.stage==='final'?'Final':m.stage==='third'?'3rd place play-off':('League · Match '+m.match_no);
}
function mdMatchLabel(m){
  const stage=m.stage==='final'?'Final':m.stage==='third'?'3rd place':('Match '+m.match_no);
  const [h,a]=mdScore(m);
  const sc=(isPlayed(m)||mdStatusOf(m)==='live')?` (${h}-${a})`:'';
  return `${stage}: ${teamName(m.home_team)} v ${teamName(m.away_team)}${sc}`;
}

function renderMatchday(){
  const sel=document.getElementById('md-match');
  const wrap=document.getElementById('md-preview');
  if(!sel||!wrap)return;
  const list=tMatches.slice().sort((a,b)=>(a.match_no||99)-(b.match_no||99));
  if(!list.length){
    sel.innerHTML='<option value="">No fixtures yet</option>';
    wrap.innerHTML='<div class="empty">Generate fixtures in Setup first</div>';
    return;
  }
  if(!mdMatchId||!list.find(m=>m.id===mdMatchId)){
    const live=list.find(m=>mdStatusOf(m)==='live');
    const upcoming=list.find(m=>!isPlayed(m));
    mdMatchId=(live||upcoming||list[0]).id;
  }
  sel.innerHTML=list.map(m=>`<option value="${m.id}" ${m.id===mdMatchId?'selected':''}>${escAttr(mdMatchLabel(m))}</option>`).join('');
  const stSel=document.getElementById('md-status');
  const cur=list.find(m=>m.id===mdMatchId);
  if(stSel&&cur)stSel.value=mdStatusOf(cur);
  mdRenderPreview();
}
function mdSelectMatch(id){mdMatchId=id;renderMatchday();}

// ---- Shared, data-driven graphic (used by tournament + custom matchday) ----
// A normalized card = {comp,stage,home,away,homeBadge,awayBadge,hs,as,status,events,evHead}
// events = [{side:'home'|'away'|'none', type:'goal'|'yellow'|'red'|'sub'|'note', text}]
function mdEventIcon(t){return ({goal:'⚽',yellow:'🟨',red:'🟥',sub:'🔁',note:'💬'})[t]||'⚽';}
function mdInitial(n){const s=(n||'').trim();return s?s[0].toUpperCase():'?';}

function mdNormFromTournament(m){
  const st=mdStatusOf(m);const sc=mdScore(m);
  const events=mdGoalsFor(m).map(g=>({side:g.team===m.away_team?'away':'home',type:'goal',text:(g.scorer&&g.scorer.trim())?g.scorer.trim():'Goal'}));
  return {comp:(tour&&tour.name)?tour.name:'NEP Cali',stage:mdStageLabel(m),home:teamName(m.home_team),away:teamName(m.away_team),
    homeBadge:(m.home_team||'?'),awayBadge:(m.away_team||'?'),hs:sc[0],as:sc[1],status:st,events:events,evHead:'⚽ Goals'};
}
function mdNormCustom(){
  const c=_settings.custom_match||{};
  const hs=(c.hs===''||c.hs==null)?0:(Number(c.hs)||0);
  const as=(c.as===''||c.as==null)?0:(Number(c.as)||0);
  return {comp:c.comp||'Nepcali FC',stage:c.stage||'',home:c.home||'Home',away:c.away||'Away',
    homeBadge:mdInitial(c.home||'H'),awayBadge:mdInitial(c.away||'A'),hs:hs,as:as,status:c.status||'up',
    events:(c.events||[]).map(e=>({side:e.side||'none',type:e.type||'note',text:e.text||''})),evHead:'📋 Events'};
}

function mdPreviewHTML(d){
  const stCls=d.status==='live'?'live':d.status==='ft'?'ft':'up';
  const stTxt=d.status==='live'?'● Live':d.status==='ft'?'Full-time':'Upcoming';
  const nums=(d.status==='up')?`<span class="dash" style="font-size:26px">vs</span>`:`${d.hs}<span class="dash">-</span>${d.as}`;
  const evs=(d.events||[]).filter(e=>(e.text&&e.text.trim())||e.type==='goal');
  const ev=evs.length?evs.map(e=>{
    if(e.side==='none'||e.type==='note')
      return `<div class="md-ev note"><span class="md-ev-ball">${mdEventIcon(e.type)}</span><span class="md-ev-nm" style="text-align:center;font-style:italic;color:var(--muted)">${escAttr(e.text||'')}</span></div>`;
    const away=e.side==='away';
    return `<div class="md-ev ${away?'away':''}"><span class="md-ev-ball">${mdEventIcon(e.type)}</span><span class="md-ev-nm">${escAttr(e.text||'Goal')}</span></div>`;
  }).join(''):'<div class="md-empty-ev">No events yet</div>';
  return `<div class="md-card">
    <div class="md-top"><span class="md-comp">${escAttr(d.comp||'')}</span>
      <span class="md-status ${stCls}">${stTxt}</span></div>
    <div class="md-stage">${escAttr(d.stage||'')}</div>
    <div class="md-score">
      <div class="md-team home"><div class="md-badge">${escAttr(d.homeBadge||'?')}</div><div class="md-tn">${escAttr(d.home||'Home')}</div></div>
      <div class="md-nums">${nums}</div>
      <div class="md-team away"><div class="md-badge">${escAttr(d.awayBadge||'?')}</div><div class="md-tn">${escAttr(d.away||'Away')}</div></div>
    </div>
    <div class="md-events"><div class="md-ev-hd">${escAttr(d.evHead||'Events')}</div>${ev}</div>
    <div class="md-foot">Nepcali FC</div>
  </div>`;
}

function mdRenderPreview(){
  const wrap=document.getElementById('md-preview');
  if(!wrap)return;
  const m=tMatches.find(x=>x.id===mdMatchId);
  if(!m){wrap.innerHTML='<div class="empty">Pick a match</div>';return;}
  wrap.innerHTML=mdPreviewHTML(mdNormFromTournament(m));
}

async function mdRefresh(){
  if(!supa){mdRenderPreview();return;}
  await loadTournament();
  renderMatchday();
}
function mdStartPolling(){
  mdStopPolling();
  mdPollTimer=setInterval(async()=>{
    if(!supa)return;
    const live=document.getElementById('t-live');
    if(!live||!live.classList.contains('on')){mdStopPolling();return;}
    await loadTournament();
    renderMatchday();
  },15000);
}
function mdStopPolling(){if(mdPollTimer){clearInterval(mdPollTimer);mdPollTimer=null;}}

function mdRoundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  if(ctx.roundRect){ctx.roundRect(x,y,w,h,r);return;}
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}
function mdBadgeCircle(ctx,cx,cy,r,letter,away){
  const g=ctx.createLinearGradient(cx-r,cy-r,cx+r,cy+r);
  if(away){g.addColorStop(0,'#e0492f');g.addColorStop(1,'#c0392b');}
  else{g.addColorStop(0,'#e8c766');g.addColorStop(1,'#b8902b');}
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
  ctx.lineWidth=5;ctx.strokeStyle='#ffffff';ctx.stroke();
  ctx.fillStyle=away?'#fff':'#1a1205';
  ctx.font='700 '+Math.round(r*0.95)+'px Georgia, serif';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText((letter||'?'),cx,cy+2);
}
function mdFitText(ctx,text,max,startPx,font){
  let px=startPx;
  do{ctx.font=font.replace('%',px);if(ctx.measureText(text).width<=max)break;px-=4;}while(px>18);
  return px;
}
// Draw the shareable graphic (1080x1350 portrait) onto #md-canvas from a
// normalized card object (see mdNormFromTournament / mdNormCustom).
function mdDrawData(d){
  const c=document.getElementById('md-canvas');
  const ctx=c.getContext('2d');
  const W=1080,H=1350;
  ctx.clearRect(0,0,W,H);
  const bg=ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#0c1a36');bg.addColorStop(.55,'#0a1428');bg.addColorStop(1,'#0b1122');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  const glow=ctx.createRadialGradient(W/2,-120,60,W/2,-120,760);
  glow.addColorStop(0,'rgba(212,175,55,.20)');glow.addColorStop(1,'rgba(212,175,55,0)');
  ctx.fillStyle=glow;ctx.fillRect(0,0,W,760);
  ctx.strokeStyle='rgba(212,175,55,.5)';ctx.lineWidth=4;
  mdRoundRect(ctx,26,26,W-52,H-52,40);ctx.stroke();

  const st=d.status||'up';
  ctx.textAlign='center';ctx.textBaseline='alphabetic';

  ctx.fillStyle='#e8c766';ctx.font='700 30px Georgia, serif';
  ctx.fillText((d.comp||'NEP CALI').toUpperCase(),W/2,120);
  if(d.stage){ctx.fillStyle='#62748f';ctx.font='600 22px -apple-system, sans-serif';ctx.fillText(d.stage.toUpperCase(),W/2,160);}

  const stTxt=st==='live'?'● LIVE':st==='ft'?'FULL-TIME':'UPCOMING';
  ctx.font='800 24px -apple-system, sans-serif';
  const pw=ctx.measureText(stTxt).width+52,px=W/2-pw/2,py=196,ph=48;
  ctx.fillStyle=st==='live'?'#c0392b':(st==='ft'?'#1a2c4a':'#12233f');
  mdRoundRect(ctx,px,py,pw,ph,24);ctx.fill();
  if(st!=='live'){ctx.strokeStyle='rgba(212,175,55,.45)';ctx.lineWidth=2;mdRoundRect(ctx,px,py,pw,ph,24);ctx.stroke();}
  ctx.fillStyle=st==='live'?'#fff':(st==='ft'?'#9fb0c9':'#e8c766');
  ctx.textBaseline='middle';ctx.fillText(stTxt,W/2,py+ph/2+1);
  ctx.textBaseline='alphabetic';

  const cyBadge=440,rBadge=92,leftX=250,rightX=830;
  mdBadgeCircle(ctx,leftX,cyBadge,rBadge,(d.homeBadge||'?'),false);
  mdBadgeCircle(ctx,rightX,cyBadge,rBadge,(d.awayBadge||'?'),true);
  ctx.fillStyle='#fff';
  const hn=d.home||'Home',an=d.away||'Away';
  let fp=mdFitText(ctx,hn,340,34,'700 %px -apple-system, sans-serif');
  ctx.font='700 '+fp+'px -apple-system, sans-serif';ctx.fillText(hn,leftX,cyBadge+rBadge+56);
  fp=mdFitText(ctx,an,340,34,'700 %px -apple-system, sans-serif');
  ctx.font='700 '+fp+'px -apple-system, sans-serif';ctx.fillText(an,rightX,cyBadge+rBadge+56);
  if(st==='up'){
    ctx.fillStyle='#d4af37';ctx.font='700 46px Georgia, serif';ctx.fillText('vs',W/2,cyBadge+16);
  }else{
    ctx.fillStyle='#fff';ctx.font='700 130px Georgia, serif';
    ctx.fillText(d.hs+'',W/2-70,cyBadge+44);
    ctx.fillText(d.as+'',W/2+70,cyBadge+44);
    ctx.fillStyle='#d4af37';ctx.font='700 70px Georgia, serif';ctx.fillText('-',W/2,cyBadge+34);
  }

  let y=720;
  ctx.strokeStyle='rgba(212,175,55,.25)';ctx.lineWidth=2;
  ctx.beginPath();ctx.setLineDash([8,8]);ctx.moveTo(90,y);ctx.lineTo(W-90,y);ctx.stroke();ctx.setLineDash([]);
  y+=52;
  ctx.fillStyle='#e8c766';ctx.font='800 24px -apple-system, sans-serif';ctx.textAlign='center';
  ctx.fillText((d.evHead||'EVENTS').toUpperCase(),W/2,y);
  y+=20;
  const evs=(d.events||[]).filter(e=>(e.text&&e.text.trim())||e.type==='goal');
  if(!evs.length){
    ctx.fillStyle='#62748f';ctx.font='400 26px -apple-system, sans-serif';
    ctx.fillText('No events yet',W/2,y+50);
  }else{
    const maxLines=14;
    evs.slice(0,maxLines).forEach(e=>{
      y+=48;
      const icon=mdEventIcon(e.type);
      const nm=(e.text&&e.text.trim())?e.text.trim():'Goal';
      if(e.side==='none'||e.type==='note'){
        ctx.textAlign='center';ctx.fillStyle='#9fb0c9';ctx.font='italic 400 25px -apple-system, sans-serif';
        ctx.fillText(icon+'  '+nm,W/2,y);
      }else if(e.side==='away'){
        ctx.textAlign='right';ctx.fillStyle='#fff';ctx.font='600 28px -apple-system, sans-serif';
        const nmW=ctx.measureText(nm).width;ctx.fillText(nm,W-120,y);
        ctx.font='400 24px -apple-system, sans-serif';ctx.fillText(icon,W-120-nmW-14,y);
      }else{
        ctx.textAlign='left';ctx.font='400 24px -apple-system, sans-serif';ctx.fillStyle='#e8c766';
        ctx.fillText(icon,120,y);
        ctx.fillStyle='#fff';ctx.font='600 28px -apple-system, sans-serif';ctx.fillText(nm,158,y);
      }
    });
    if(evs.length>maxLines){
      y+=44;ctx.textAlign='center';ctx.fillStyle='#62748f';ctx.font='400 22px -apple-system, sans-serif';
      ctx.fillText('+ '+(evs.length-maxLines)+' more',W/2,y);
    }
  }

  ctx.textAlign='center';ctx.fillStyle='#5a6b85';ctx.font='600 20px -apple-system, sans-serif';
  const dateStr=new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
  ctx.fillText('NEPCALI FC   ·   '+dateStr.toUpperCase(),W/2,H-70);
  return c;
}

function mdFileNameFromData(d){
  const s=((d.home||'home')+'-vs-'+(d.away||'away')).replace(/[^a-z0-9]+/gi,'_').replace(/^_|_$/g,'');
  return 'nepcali-'+(s||'match')+'.png';
}
function mdDownloadBlob(blob,name){
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},1500);
}
function mdExport(d,share){
  mdDrawData(d);
  document.getElementById('md-canvas').toBlob(async function(blob){
    if(!blob){alert('Could not create the image.');return;}
    const name=mdFileNameFromData(d);
    if(share){
      const file=new File([blob],name,{type:'image/png'});
      const text=`${d.home||'Home'} ${d.status==='up'?'vs':(d.hs+'-'+d.as)} ${d.away||'Away'} — Nepcali FC`;
      try{
        if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Nepcali FC',text});return;}
      }catch(e){if(e&&e.name==='AbortError')return;}
      mdDownloadBlob(blob,name);
      alert('Direct sharing isn’t supported here, so the image was downloaded — post it to social media manually.');
    }else{
      mdDownloadBlob(blob,name);
    }
  },'image/png');
}
function downloadMatchday(){const m=tMatches.find(x=>x.id===mdMatchId);if(!m){alert('Pick a match first');return;}mdExport(mdNormFromTournament(m),false);}
function shareMatchday(){const m=tMatches.find(x=>x.id===mdMatchId);if(!m){alert('Pick a match first');return;}mdExport(mdNormFromTournament(m),true);}
function downloadCustom(){mdExport(mdNormCustom(),false);}
function shareCustom(){mdExport(mdNormCustom(),true);}

// ---- Custom / external matchday editor (main-page tab) ----
function cmModel(){
  if(!_settings.custom_match)_settings.custom_match={comp:'Nepcali FC',stage:'Friendly',home:'',away:'',hs:0,as:0,status:'up',events:[]};
  if(!_settings.custom_match.events)_settings.custom_match.events=[];
  return _settings.custom_match;
}
function cmRenderPreview(){const el=document.getElementById('cm-preview');if(el)el.innerHTML=mdPreviewHTML(mdNormCustom());}
function cmSet(f,v){cmModel()[f]=v;saveSettings();cmRenderPreview();}
function cmSetEvent(i,f,v){const e=cmModel().events[i];if(!e)return;e[f]=v;saveSettings();cmRenderPreview();}
function cmAddEvent(){cmModel().events.push({side:'home',type:'goal',text:''});saveSettings();cmRenderEvents();cmRenderPreview();}
function cmAddComment(){cmModel().events.push({side:'none',type:'note',text:''});saveSettings();cmRenderEvents();cmRenderPreview();}
function cmDelEvent(i){cmModel().events.splice(i,1);saveSettings();cmRenderEvents();cmRenderPreview();}
function cmTypeOpts(sel){return [['goal','⚽ Goal'],['yellow','🟨 Yellow'],['red','🟥 Red'],['sub','🔁 Sub'],['note','💬 Comment']].map(o=>`<option value="${o[0]}" ${o[0]===sel?'selected':''}>${o[1]}</option>`).join('');}
function cmSideOpts(sel){return [['home','Home'],['away','Away'],['none','—']].map(o=>`<option value="${o[0]}" ${o[0]===sel?'selected':''}>${o[1]}</option>`).join('');}
function cmRenderEvents(){
  const el=document.getElementById('cm-events');if(!el)return;
  const evs=cmModel().events;
  if(!evs.length){el.innerHTML='<div class="empty">No events yet. Add goals, cards or comments.</div>';return;}
  el.innerHTML=evs.map((e,i)=>`<div class="scorer-entry">
    <select class="team-sel" onchange="cmSetEvent(${i},'type',this.value)">${cmTypeOpts(e.type)}</select>
    <select class="team-sel" onchange="cmSetEvent(${i},'side',this.value)">${cmSideOpts(e.side)}</select>
    <input class="name-inp" type="text" placeholder="${e.type==='note'?'comment / commentary':'name or detail'}" value="${escAttr(e.text||'')}" oninput="cmSetEvent(${i},'text',this.value)">
    <button class="rm-btn" onclick="cmDelEvent(${i})">×</button></div>`).join('');
}
function renderCustomMatch(){
  const c=cmModel();
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.value=(v==null?'':v);};
  set('cm-comp',c.comp);set('cm-stage',c.stage);set('cm-home',c.home);set('cm-away',c.away);
  set('cm-hs',c.hs);set('cm-as',c.as);
  const st=document.getElementById('cm-status');if(st)st.value=c.status||'up';
  cmRenderEvents();cmRenderPreview();
}
function cmReset(){
  if(!confirm('Clear the Live editor and start a blank match?\n\nTip: tap “Save to Matches” first if you want to keep the current one.'))return;
  _settings.custom_match={comp:'',stage:'',home:'',away:'',hs:0,as:0,status:'up',events:[]};
  saveSettings();
  renderCustomMatch();
}

// ---- Matches — Nepcali FC vs other clubs (EXTERNAL games only) -------------
// The full broadcast card (teams, score, status + events) is saved to the
// `results` table from the Matchday Live editor, and rendered identically via
// mdPreviewHTML() in the Matches section + the home "Results" preview.
// Internal Cup fixtures are NOT stored here — they live in the Cup tab.
let extResults=[];
async function loadResults(){
  if(!supa){renderResults();return;}
  const r=await supa.from('results').select('*').order('created_at',{ascending:false});
  extResults=r.error?[]:(r.data||[]);
  renderResults();
}
// Nepcali FC games always take priority; the rest (e.g. internal Cup finals)
// follow. Each group keeps newest-first order from the query.
function isNepcaliMatch(d){d=d||{};return /nepcali/i.test((d.home||'')+' '+(d.away||''));}
function sortedResults(){
  const nep=[],oth=[];
  extResults.forEach(r=>{(isNepcaliMatch(r.data)?nep:oth).push(r);});
  return nep.concat(oth);
}
// Simple, tappable score card that expands to the full broadcast card.
// `pfx` keeps element IDs unique between the Matches tab and the home preview
// (the same match renders in both — without a prefix the toggle hits the hidden copy).
function matchRow(row,pfx){
  const d=(row&&row.data)||{};
  const key=pfx+row.id;
  const cls=d.status==='live'?'live':d.status==='ft'?'ft':'';
  const st=d.status==='live'?'● Live':d.status==='ft'?'Full-time':'Upcoming';
  const score=d.status==='up'?'vs':`${d.hs==null?0:d.hs} - ${d.as==null?0:d.as}`;
  return `<div class="match-item">
    <div class="match-simple" onclick="toggleMatchCard('${key}')">
      <div class="ms-top"><span class="ms-comp">${escAttr(d.comp||'Match')}</span>
        <span class="ms-right"><span class="ms-badge ${cls}">${st}</span><button class="ms-del" onclick="event.stopPropagation();deleteResult('${row.id}')" title="Remove match">🗑</button></span></div>
      <div class="ms-row">
        <span class="ms-team h">${escAttr(d.home||'Home')}</span>
        <span class="ms-score">${score}</span>
        <span class="ms-team a">${escAttr(d.away||'Away')}</span>
      </div>
      <div class="ms-toggle" id="mt-${key}">▾ Match center</div>
    </div>
    <div class="match-full" id="mf-${key}" style="display:none">
      ${mdPreviewHTML(d)}
      <button class="result-del" onclick="deleteResult('${row.id}')" title="Remove match">🗑 Remove</button>
    </div>
  </div>`;
}
function toggleMatchCard(key){
  const f=document.getElementById('mf-'+key);const t=document.getElementById('mt-'+key);
  if(!f)return;
  const open=f.style.display==='none'||!f.style.display;
  f.style.display=open?'block':'none';
  if(t)t.textContent=open?'▴ Match center':'▾ Match center';
}
function renderResults(){
  const rows=sortedResults();
  // Full "Matches" section (all saved games, simple cards → expand for full card).
  const ml=document.getElementById('matches-list');
  if(ml)ml.innerHTML=rows.length?rows.map(r=>matchRow(r,'m-')).join(''):'<div class="empty">No matches saved yet. Tap “Create new match” below, or build a rich card in the <b>Live</b> tab.</div>';
  // Home "Results" preview: last match + fold-out for the rest.
  const last=document.getElementById('lastmatch');if(!last)return;
  const rw=document.getElementById('recent-wrap');
  if(!rows.length){last.innerHTML='<div class="empty">No matches saved yet. Add one in the <b>Matches</b> tab.</div>';if(rw)rw.style.display='none';return;}
  last.innerHTML=matchRow(rows[0],'h-');
  const rest=rows.slice(1);
  if(rest.length){rw.style.display='block';document.getElementById('recent-matches').innerHTML=rest.map(r=>matchRow(r,'h-')).join('');}
  else if(rw)rw.style.display='none';
  renderDashLatest();
}
function toggleNewMatch(){
  const f=document.getElementById('nm-form');const b=document.getElementById('nm-open');
  if(!f)return;
  const open=f.style.display==='none'||!f.style.display;
  f.style.display=open?'block':'none';
  if(b)b.textContent=open?'✕ Close':'＋ Create new match';
}
function toggleEdit(id,btn){
  const el=document.getElementById(id);if(!el)return;
  const open=el.style.display==='none'||!el.style.display;
  el.style.display=open?'block':'none';
  if(btn){const a=btn.querySelector('.tg-arrow');if(a)a.textContent=open?'▴':'▾';}
}
function toggleResults(){
  const el=document.getElementById('recent-matches');const t=document.getElementById('results-toggle-txt');
  const open=el.style.display==='none'||!el.style.display;
  el.style.display=open?'block':'none';t.textContent=open?'Hide earlier matches':'Show earlier matches';
}
let _savingResult=false;
function sameMatch(a,b){
  a=a||{};b=b||{};
  return (a.home||'')===(b.home||'')&&(a.away||'')===(b.away||'')&&
         (a.comp||'')===(b.comp||'')&&(Number(a.hs)||0)===(Number(b.hs)||0)&&
         (Number(a.as)||0)===(Number(b.as)||0)&&(a.status||'')===(b.status||'');
}
async function saveResult(norm){
  if(!supa){alert('Not connected to the database.');return;}
  if(!norm||!(norm.home||'').trim()||!(norm.away||'').trim()){alert('Enter both team names first.');return;}
  if(_savingResult)return;                                   // block accidental double-click
  if(extResults.some(r=>sameMatch(r.data,norm))&&           // block obvious duplicates
     !confirm('A match with the same teams, score & status is already saved.\n\nSave another copy anyway?'))return;
  _savingResult=true;
  const {error}=await supa.from('results').insert({data:norm});
  _savingResult=false;
  if(error){alert('Could not save.\n\n'+(error.message||'')+'\n\nIf it mentions a missing table/column, run migrations/schema-results.sql in Supabase.');return;}
  await loadResults();
  alert('Saved to Matches — see it in the Matches tab and on the home page.');
}
function saveCustomToHistory(){
  const c=cmModel();
  if(!(c.home||'').trim()||!(c.away||'').trim()){alert('Enter both team names in the Live editor first.');return;}
  saveResult(mdNormCustom());
}
async function createMatch(){
  const g=id=>document.getElementById(id);
  const home=(g('nm-home').value||'').trim(),away=(g('nm-away').value||'').trim();
  if(!home&&!away){alert('Enter team names first.');return;}
  const status=g('nm-status').value||'ft';
  const norm={comp:(g('nm-comp').value||'').trim()||'Match',stage:'',
    home:home||'Nepcali FC',away:away||'Away',
    homeBadge:mdInitial(home||'Nepcali FC'),awayBadge:mdInitial(away||'Away'),
    hs:parseInt(g('nm-hs').value)||0,as:parseInt(g('nm-as').value)||0,
    status:status,events:[],evHead:'📋 Events'};
  await saveResult(norm);
  ['nm-comp','nm-home','nm-away','nm-hs','nm-as'].forEach(id=>{const e=g(id);if(e)e.value='';});
}
async function deleteResult(id){
  if(!confirm('Remove this match?'))return;
  await supa.from('results').delete().eq('id',id);
  loadResults();
}

// ---- Snaps — photos & videos gallery ---------------------------------------
let snaps=[];
const SNAP_BUCKET='snaps';
function toggleSnapForm(){
  const f=document.getElementById('snap-form');const b=document.getElementById('snap-open');
  if(!f)return;
  const open=f.style.display==='none'||!f.style.display;
  f.style.display=open?'block':'none';
  if(b)b.textContent=open?'✕ Close':'📸 Add photo / video';
}
async function loadSnaps(){
  if(!supa){renderSnaps();return;}
  const r=await supa.from('snaps').select('*').order('created_at',{ascending:false});
  snaps=r.error?[]:(r.data||[]);
  renderSnaps();
}
function snapCardHTML(s){
  const cap=s.caption?`<div class="snap-cap">${escAttr(s.caption)}</div>`:'';
  const isImg=s.type!=='video';
  const media=isImg
    ? `<img src="${escAttr(s.url)}" loading="lazy" alt="${escAttr(s.caption||'snap')}">`
    : `<video src="${escAttr(s.url)}" controls preload="metadata" playsinline></video>`;
  const feat=isImg&&isHeroSnap(s.id);
  const featBtn=isImg
    ? `<button class="snap-feat${feat?' on':''}" onclick="toggleHeroSnap('${s.id}')" title="${feat?'Showing on the home background — tap to remove':'Feature this photo on the home background'}">${feat?'★ On home':'☆ Home'}</button>`
    : '';
  return `<div class="snap${feat?' featured':''}">
    <div class="snap-media">${media}</div>
    ${featBtn}
    ${cap}
    <button class="snap-del" onclick="deleteSnap('${s.id}','${escAttr(s.path||'')}')" title="Remove">🗑</button>
  </div>`;
}
function renderSnaps(){
  const el=document.getElementById('snaps-grid');
  if(el){
    el.innerHTML=snaps.length?snaps.map(snapCardHTML).join(''):'<div class="empty">No snaps yet. Tap “Add photo / video” to share the first one.</div>';
  }
  renderPreview();
  renderDashLatest();
}

// ---- Club Preview — dreamy landing-page slideshow of recent snaps ----------
let previewIndex=0,previewTimer=null;
function shuffled(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function previewList(){return shuffled(snaps).slice(0,12);}   // random order each load
// ---- Hero background slideshow (banner first, then hand-picked Snaps) ------
// Only photos the user explicitly features appear behind the home headline.
let heroIndex=0,heroTimer=null;
const HERO_MAX=20;
function heroSnapIds(){return Array.isArray(_settings.hero_snaps)?_settings.hero_snaps:[];}
function isHeroSnap(id){return heroSnapIds().includes(id);}
function toggleHeroSnap(id){
  let arr=heroSnapIds().slice();
  if(arr.includes(id)){arr=arr.filter(x=>x!==id);}
  else{
    if(arr.length>=HERO_MAX){alert('You can feature up to '+HERO_MAX+' photos on the home background. Remove one first.');return;}
    arr.push(id);
  }
  _settings.hero_snaps=arr;
  saveSettings();
  renderSnaps();   // refreshes the grid buttons + preview + hero background
}
function heroImages(){
  const imgs=['club-banner.png'];                       // existing banner always first
  shuffled(heroSnapIds()).forEach(id=>{                 // featured photos in random order
    const s=snaps.find(x=>x&&x.id===id&&x.type!=='video'&&x.url);
    if(s)imgs.push(s.url);
  });
  return imgs;
}
function renderHeroBg(){
  const bg=document.getElementById('mu-hero-bg');if(!bg)return;
  const imgs=heroImages();
  bg.innerHTML=imgs.map((u,i)=>`<div class="hero-slide${i===0?' on':''}" style="background-image:url(&quot;${String(u).replace(/"/g,'%22')}&quot;)"></div>`).join('');
  heroIndex=0;stopHero();
  if(imgs.length>1)startHero();
}
function startHero(){stopHero();const n=heroImages().length;if(n>1)heroTimer=setInterval(()=>heroGo((heroIndex+1)%n),6000);}
function stopHero(){if(heroTimer){clearInterval(heroTimer);heroTimer=null;}}
function heroGo(i){
  const bg=document.getElementById('mu-hero-bg');if(!bg)return;
  const slides=bg.querySelectorAll('.hero-slide');if(!slides.length)return;
  heroIndex=i;slides.forEach((sl,idx)=>sl.classList.toggle('on',idx===i));
}

function renderPreview(){
  const stage=document.getElementById('preview-stage');
  const wrap=document.getElementById('mu-preview-wrap');
  renderHeroBg();
  if(!stage)return;
  const list=previewList();
  if(!list.length){if(wrap)wrap.style.display='none';stopPreview();stage.innerHTML='';return;}
  if(wrap)wrap.style.display='block';
  const slides=list.map((s,i)=>{
    const media=s.type==='video'
      ? `<video class="pv-media" src="${escAttr(s.url)}" muted loop playsinline preload="metadata"></video>`
      : `<img class="pv-media" src="${escAttr(s.url)}" alt="${escAttr(s.caption||'')}">`;
    const cap=s.caption?`<div class="pv-cap">${escAttr(s.caption)}</div>`:'';
    return `<div class="pv-slide${i===0?' on':''}">${media}${cap}</div>`;
  }).join('');
  const dots=list.length>1?`<div class="pv-dots">${list.map((s,i)=>`<button class="pv-dot${i===0?' on':''}" onclick="previewGo(${i})"></button>`).join('')}</div>`:'';
  stage.innerHTML=slides+dots;
  previewIndex=0;
  syncPreviewVideos();
  startPreview();
}
function startPreview(){
  stopPreview();
  const n=previewList().length;
  if(n>1)previewTimer=setInterval(()=>previewGo((previewIndex+1)%n),5200);
}
function stopPreview(){if(previewTimer){clearInterval(previewTimer);previewTimer=null;}}
function previewGo(i){
  const stage=document.getElementById('preview-stage');if(!stage)return;
  const slides=stage.querySelectorAll('.pv-slide');const dots=stage.querySelectorAll('.pv-dot');
  if(!slides.length)return;
  previewIndex=i;
  slides.forEach((sl,idx)=>sl.classList.toggle('on',idx===i));
  dots.forEach((d,idx)=>d.classList.toggle('on',idx===i));
  syncPreviewVideos();
  startPreview();
}
function syncPreviewVideos(){
  const stage=document.getElementById('preview-stage');if(!stage)return;
  stage.querySelectorAll('.pv-slide').forEach(sl=>{
    const v=sl.querySelector('video');if(!v)return;
    if(sl.classList.contains('on'))v.play().catch(()=>{});else v.pause();
  });
}
async function uploadSnap(){
  if(!supa){alert('Not connected to the database.');return;}
  const fi=document.getElementById('snap-file');
  const file=fi&&fi.files&&fi.files[0];
  if(!file){alert('Choose a photo or video first.');return;}
  if(file.size>50*1024*1024){alert('That file is over 50 MB. Please pick a smaller one (or compress the video).');return;}
  const btn=document.getElementById('snap-upload-btn');
  const prog=document.getElementById('snap-progress');
  const isVideo=(file.type||'').startsWith('video');
  const ext=(file.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'');
  const path=Date.now()+'-'+Math.random().toString(36).slice(2,8)+'.'+ext;
  if(btn)btn.disabled=true;if(prog)prog.textContent='Uploading…';
  const up=await supa.storage.from(SNAP_BUCKET).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type||undefined});
  if(up.error){if(btn)btn.disabled=false;if(prog)prog.textContent='';
    alert('Upload failed: '+up.error.message+'\n\nMake sure you ran migrations/schema-snaps.sql (creates the “snaps” storage bucket).');return;}
  const pub=supa.storage.from(SNAP_BUCKET).getPublicUrl(path);
  const url=pub.data.publicUrl;
  const caption=(document.getElementById('snap-caption').value||'').trim();
  const {error}=await supa.from('snaps').insert({url,type:isVideo?'video':'image',caption,path});
  if(btn)btn.disabled=false;if(prog)prog.textContent='';
  if(error){alert('Uploaded the file but could not save the record: '+error.message);return;}
  fi.value='';document.getElementById('snap-caption').value='';
  loadSnaps();
}
async function addSnapUrl(){
  if(!supa){alert('Not connected to the database.');return;}
  const inp=document.getElementById('snap-url');
  let url=(inp.value||'').trim();
  if(!url){alert('Paste a photo or video link first.');return;}
  if(!/^https?:\/\//i.test(url))url='https://'+url;
  const isVideo=/\.(mp4|mov|webm|m4v|ogg)(\?|$)/i.test(url);
  const caption=(document.getElementById('snap-caption').value||'').trim();
  const {error}=await supa.from('snaps').insert({url,type:isVideo?'video':'image',caption});
  if(error){alert('Could not save.\n\n'+(error.message||'')+'\n\nIf it mentions a missing table, run migrations/schema-snaps.sql in Supabase.');return;}
  inp.value='';document.getElementById('snap-caption').value='';
  loadSnaps();
}
async function deleteSnap(id,path){
  if(!confirm('Remove this snap?'))return;
  if(path)await supa.storage.from(SNAP_BUCKET).remove([path]);
  await supa.from('snaps').delete().eq('id',id);
  loadSnaps();
}

// ---- Social media links (editable in Dashboard, shown on landing page) ----
const SOCIALS=[
  {key:'instagram',label:'Instagram',svg:'<svg viewBox="0 0 24 24"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.43-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.9 5.9 0 0 0-2.12 1.38A5.9 5.9 0 0 0 .64 4.13C.33 4.9.13 5.77.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.28.26 2.15.57 2.91.31.79.72 1.46 1.38 2.12.66.66 1.33 1.07 2.12 1.38.76.3 1.63.5 2.91.57C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.28-.06 2.15-.26 2.91-.57a5.9 5.9 0 0 0 2.12-1.38 5.9 5.9 0 0 0 1.38-2.12c.3-.76.5-1.63.57-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.28-.26-2.15-.57-2.91a5.9 5.9 0 0 0-1.38-2.12A5.9 5.9 0 0 0 19.86.63c-.76-.3-1.63-.5-2.91-.57C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4zm6.41-10.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z"/></svg>'},
  {key:'tiktok',label:'TikTok',svg:'<svg viewBox="0 0 24 24"><path d="M12.53 0h3.28c.19 1.5.75 2.78 1.66 3.79a5.9 5.9 0 0 0 3.53 1.86v3.36a9.3 9.3 0 0 1-5.06-1.6v7.08c0 4-3.2 7.5-7.24 7.5A7.3 7.3 0 0 1 1.4 14.2c0-4 3.2-7.36 7.24-7.36.5 0 1 .05 1.47.14v3.5a3.9 3.9 0 0 0-1.47-.29 3.8 3.8 0 1 0 3.8 3.8V0z"/></svg>'},
  {key:'facebook',label:'Facebook',svg:'<svg viewBox="0 0 24 24"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"/></svg>'},
  {key:'youtube',label:'YouTube',svg:'<svg viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6z"/></svg>'},
  {key:'x',label:'X (Twitter)',svg:'<svg viewBox="0 0 24 24"><path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.48l8.6-9.83L0 1.15h7.59l5.24 6.93zm-1.29 19.5h2.04L6.49 3.24H4.3z"/></svg>'},
  {key:'whatsapp',label:'WhatsApp',svg:'<svg viewBox="0 0 24 24"><path d="M.06 24l1.68-6.13A11.8 11.8 0 0 1 .16 11.9C.16 5.4 5.46.1 11.96.1a11.8 11.8 0 0 1 8.4 3.49 11.8 11.8 0 0 1 3.48 8.4c0 6.5-5.3 11.8-11.8 11.8a11.9 11.9 0 0 1-5.65-1.44zm6.6-3.8c1.68.99 3.28 1.58 5.3 1.58 5.4 0 9.8-4.4 9.8-9.8s-4.4-9.8-9.8-9.8-9.8 4.4-9.8 9.8c0 2.07.6 3.62 1.62 5.24l-1 3.64zm11.4-5.5c-.07-.12-.27-.2-.57-.35s-1.77-.87-2.04-.97-.47-.15-.67.15-.77.96-.94 1.16-.35.22-.65.07a8.2 8.2 0 0 1-2.4-1.48 9 9 0 0 1-1.66-2.06c-.17-.3 0-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.5s.05-.37-.02-.52-.67-1.6-.92-2.2c-.24-.58-.49-.5-.67-.5l-.57-.01c-.2 0-.52.07-.8.37s-1.05 1.02-1.05 2.5 1.08 2.9 1.23 3.1 2.12 3.24 5.14 4.54c.72.31 1.28.5 1.71.63.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42z"/></svg>'}
];
function socialUrl(u){u=(u||'').trim();if(!u)return '';if(!/^https?:\/\//i.test(u)&&!/^mailto:/i.test(u))u='https://'+u;return u;}
function renderSocials(){
  const el=document.getElementById('welcome-socials');if(!el)return;
  const s=_settings.socials||{};
  const items=SOCIALS.filter(x=>s[x.key]&&s[x.key].trim());
  if(!items.length){el.style.display='none';el.innerHTML='';return;}
  el.style.display='flex';
  el.innerHTML='<div class="socials-hd">Follow Nepcali FC</div>'+items.map(x=>
    `<a class="social-btn ${x.key}" href="${escAttr(socialUrl(s[x.key]))}" target="_blank" rel="noopener noreferrer" aria-label="${x.label}" title="${x.label}">${x.svg}</a>`
  ).join('');
}
function setSocial(key,val){
  if(!_settings.socials)_settings.socials={};
  _settings.socials[key]=val;
  saveSettings();renderSocials();
}
function renderSocialInputs(){
  const s=_settings.socials||{};
  const html=SOCIALS.map(x=>`<label>${x.label}</label><input type="text" placeholder="https://…" value="${escAttr(s[x.key]||'')}" oninput="setSocial('${x.key}',this.value)">`).join('');
  ['social-inputs','welcome-social-inputs'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=html;});
}
function toggleSocialEdit(){
  const b=document.getElementById('welcome-social-edit');if(!b)return;
  b.style.display=(b.style.display==='none'||!b.style.display)?'block':'none';
}

// ---- RSVP polls (attendance + guest tracking, shareable to Viber) ----
let polls=[],pollResponses=[],pollsReady=true;
const RSVP_STATUS={going:{l:'Going',c:'#34d399'},cant:{l:'Not going',c:'#f87171'}};

async function loadPolls(){
  if(!supa){pollsReady=false;renderRSVP();return;}
  const p=await supa.from('polls').select('*').order('created_at',{ascending:false});
  if(p.error){pollsReady=false;renderRSVP();return;}
  pollsReady=true;polls=p.data||[];
  const r=await supa.from('poll_responses').select('*').order('created_at',{ascending:true});
  pollResponses=r.error?[]:(r.data||[]);
  renderRSVP();
}
async function createPoll(){
  if(!supa)return;
  const q=document.getElementById('poll-q').value.trim();
  if(!q){alert('Enter a question');return;}
  const when=document.getElementById('poll-when').value.trim();
  const {error}=await supa.from('polls').insert({question:q,when_text:when});
  if(error){alert('Could not create poll.\n\n'+(error.message||'')+'\n\nIf this mentions a missing table, run migrations/schema-polls.sql in Supabase.');return;}
  document.getElementById('poll-q').value='';document.getElementById('poll-when').value='';
  loadPolls();
}
async function deletePoll(id){
  if(!confirm('Delete this poll and all its responses?'))return;
  await supa.from('polls').delete().eq('id',id);
  loadPolls();
}
let _rsvpGuests={};
function rsvpGuest(id,d){
  _rsvpGuests[id]=Math.max(0,Math.min(20,(_rsvpGuests[id]||0)+d));
  const el=document.getElementById('rsvp-g-'+id);if(el)el.textContent=_rsvpGuests[id];
}
async function rsvpVote(pollId,status){
  const name=document.getElementById('rsvp-name-'+pollId).value.trim();
  if(!name){alert('Type your name first');document.getElementById('rsvp-name-'+pollId).focus();return;}
  const guests=status==='going'?(_rsvpGuests[pollId]||0):0;
  const {error}=await supa.from('poll_responses').insert({poll_id:pollId,name,status,guests});
  if(error){alert(error.message);return;}
  try{localStorage.setItem('nc_rsvp_name',name);}catch(e){}
  _rsvpGuests[pollId]=0;
  loadPolls();
}
async function deleteResponse(id){
  await supa.from('poll_responses').delete().eq('id',id);
  loadPolls();
}
function pollTally(pollId){
  const rs=pollResponses.filter(r=>r.poll_id===pollId);
  const going=rs.filter(r=>r.status==='going');
  const members=going.length;
  const guests=going.reduce((s,r)=>s+(Number(r.guests)||0),0);
  return {members,guests,total:members+guests,cant:rs.filter(r=>r.status==='cant').length,rs};
}
function renderRSVP(){
  if(typeof renderDashRSVP==='function')renderDashRSVP();
  const el=document.getElementById('rsvp-list');if(!el)return;
  if(!pollsReady){
    el.innerHTML='<div class="card"><div class="banner" style="display:block">⚠️ Polls need a one-time setup. Run <b>migrations/schema-polls.sql</b> in your Supabase SQL Editor, then reload.</div></div>';
    return;
  }
  if(!polls.length){el.innerHTML='<div class="empty">No polls yet. Create one above.</div>';return;}
  const myName=(function(){try{return localStorage.getItem('nc_rsvp_name')||'';}catch(e){return '';}})();
  el.innerHTML=polls.map(p=>{
    const t=pollTally(p.id);
    const rows=t.rs.map(r=>{
      const st=RSVP_STATUS[r.status]||RSVP_STATUS.going;
      const g=(Number(r.guests)||0);
      const gb=g>0?` <span class="guest-badge">+${g}</span>`:'';
      return `<div class="list-row">
        <div class="player-info"><div class="player-name">${escAttr(r.name)}${gb}</div></div>
        <span class="pill" style="background:${st.c};color:#0a1428;font-weight:700">${st.l}</span>
        <button class="del" onclick="deleteResponse('${r.id}')" title="Remove">🗑</button></div>`;
    }).join('')||'<div class="empty">No responses yet — be the first.</div>';
    const yes=t.members,no=t.cant,maxv=Math.max(1,yes+no);
    const g=_rsvpGuests[p.id]||0;
    return `<div class="card">
      <div class="card-hd">${escAttr(p.question)}</div>
      ${p.when_text?`<div class="muted" style="margin-top:-4px;margin-bottom:10px">🗓️ ${escAttr(p.when_text)}</div>`:''}
      <div class="poll-opt"><div class="poll-opt-top"><span>✅ Yes</span><span>${yes}${t.guests?` <span class="muted">+${t.guests} guest${t.guests===1?'':'s'}</span>`:''}</span></div><div class="poll-bar"><div class="poll-bar-fill yes" style="width:${Math.round(yes/maxv*100)}%"></div></div></div>
      <div class="poll-opt"><div class="poll-opt-top"><span>❌ No</span><span>${no}</span></div><div class="poll-bar"><div class="poll-bar-fill no" style="width:${Math.round(no/maxv*100)}%"></div></div></div>
      <div class="rsvp-total"><b>${t.total}</b> coming in total</div>
      <div class="rsvp-form">
        <input id="rsvp-name-${p.id}" type="text" value="${escAttr(myName)}" placeholder="Your name">
        <div class="guest-step"><span>Bringing guests?</span><div class="stepper"><button onclick="rsvpGuest('${p.id}',-1)">−</button><span id="rsvp-g-${p.id}">${g}</span><button onclick="rsvpGuest('${p.id}',1)">+</button></div></div>
        <div class="yn"><button class="yn-yes" onclick="rsvpVote('${p.id}','going')">✅ Yes, I'm in</button><button class="yn-no" onclick="rsvpVote('${p.id}','cant')">❌ Can't make it</button></div>
      </div>
      <div class="rsvp-responses">${rows}</div>
      <div class="md-actions">
        <button class="btn" onclick="shareViber('${p.id}')">📤 Share to Viber</button>
        <button class="btn" onclick="copyPollLink('${p.id}')">🔗 Copy link</button>
      </div>
      <div style="text-align:right;margin-top:8px"><button class="rm-btn" onclick="deletePoll('${p.id}')">Delete poll</button></div>
    </div>`;
  }).join('');
}
function pollShareText(p){
  const url=location.origin+location.pathname+'#rsvp';
  return `⚽ ${p.question}${p.when_text?(' — '+p.when_text):''}\nRSVP here (add your +1s): ${url}`;
}
function shareViber(pollId){
  const p=polls.find(x=>x.id===pollId);if(!p)return;
  window.location.href='viber://forward?text='+encodeURIComponent(pollShareText(p));
}
function copyPollLink(pollId){
  const p=polls.find(x=>x.id===pollId);if(!p)return;
  const txt=pollShareText(p);
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(()=>alert('Copied! Paste it into Viber, WhatsApp, or anywhere.'),()=>prompt('Copy this:',txt));
  }else{prompt('Copy this:',txt);}
}

// ---- Tournament history (saved records of completed tournaments) ----
async function finishTournament(){
  const playedCount=tMatches.filter(isPlayed).length;
  if(!playedCount){alert('No matches have been played yet — nothing to save.');return;}
  const rows=computeStandings();
  const scorers=computeScorers();
  const champ=rows[0]&&rows[0].p>0?teamName(rows[0].id):null;
  const remaining=tMatches.length-playedCount;
  const msg=remaining>0
    ? `Save this tournament to history?\n\n${remaining} match(es) still have no score and will be recorded as unplayed.`
    : 'Save this completed tournament to history?';
  if(!confirm(msg))return;
  const record={
    name:tour.name||'NEP Cali',
    num_teams:tour.num_teams,
    champion:champ,
    runner_up:rows[1]&&rows[1].p>0?teamName(rows[1].id):null,
    standings:rows.map(r=>({team:teamName(r.id),p:r.p,w:r.w,d:r.d,l:r.l,gf:r.gf,ga:r.ga,gd:r.gd,pts:r.pts})),
    top_scorers:scorers.map(s=>({name:s.name,team:teamName(s.team),goals:s.goals})),
    team_names:tour.team_names||{}
  };
  const ins=await supa.from('tournament_history').insert(record).select().single();
  if(ins.error){alert('Could not save to history.\n\n'+(ins.error.message||'')+'\n\nIf this mentions a missing table, run migrations/schema-history.sql in Supabase.');return;}
  tHistory.unshift(ins.data);
  renderHistory();
  alert('Saved to history 🏆'+(champ?('\nChampion: '+champ):''));
  subshow('t-history',document.querySelectorAll('#tournament .subnav-btn')[3]);
}

async function loadHistory(){
  if(!supa){renderHistory();return;}
  const {data,error}=await supa.from('tournament_history').select('*').order('completed_at',{ascending:false});
  if(!error)tHistory=data||[];
  renderHistory();
}

function renderHistory(){
  const el=document.getElementById('t-history-list');
  if(!el)return;
  if(!tHistory.length){el.innerHTML='<div class="empty">No saved tournaments yet.<br>Play some matches, then use “🏁 Finish &amp; save” on the Table tab.</div>';return;}
  el.innerHTML=tHistory.map(h=>{
    const d=new Date(h.completed_at).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
    const standings=(h.standings||[]).map((r,i)=>`<tr class="${i===0?'gold':''}">
      <td title="${r.team}">${i===0?'🥇 ':''}${r.team}</td>
      <td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td>
      <td class="${r.gd>0?'gd-pos':r.gd<0?'gd-neg':''}">${r.gd>0?'+':''}${r.gd}</td>
      <td style="font-weight:700">${r.pts}</td></tr>`).join('');
    const scorers=(h.top_scorers||[]).slice(0,5).map((s,i)=>`<div class="top-row">
      <div class="rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</div>
      <div class="player-info"><div class="player-name cap">${s.name}</div><div class="player-meta">${s.team}</div></div>
      <div class="top-goals">${s.goals}</div></div>`).join('')||'<div class="empty">No goals logged</div>';
    return `<div class="card">
      <div class="match-hd"><span>${h.name||'NEP Cali'} • ${d}</span>
        <button class="del" onclick="deleteHistory('${h.id}')" title="Delete record">🗑</button></div>
      <div class="card-hd">🏆 ${h.champion?('Champion: '+h.champion):'No champion recorded'}</div>
      <div class="tbl-wrap"><table><thead><tr><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead><tbody>${standings}</tbody></table></div>
      <div class="scorers-hd" style="margin-top:11px">⚽ Top scorers</div>${scorers}
    </div>`;
  }).join('');
}

async function deleteHistory(id){
  if(!confirm('Delete this saved tournament record? This cannot be undone.'))return;
  const {error}=await supa.from('tournament_history').delete().eq('id',id);
  if(error){alert('Could not delete: '+error.message);return;}
  tHistory=tHistory.filter(h=>h.id!==id);
  renderHistory();
}

function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('sb-scrim').classList.toggle('show');}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('sb-scrim').classList.remove('show');}
function openSidebar(){document.getElementById('sidebar').classList.add('open');document.getElementById('sb-scrim').classList.add('show');}
function show(id,btn){
  document.querySelectorAll('.sec').forEach(s=>s.classList.remove('on'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('on'));
  document.getElementById(id).classList.add('on');btn.classList.add('on');
  if(id!=='tournament')mdStopPolling();
  if(id==='matchday')renderCustomMatch();
  if(id==='matches')renderResults();
  if(id==='snaps')loadSnaps();
  if(id==='rsvp')loadPolls();
  if(id==='dashboard')renderDashboard();
  if(window.innerWidth<900)closeSidebar();
  const mi=document.querySelector('.main-inner');if(mi)mi.scrollTop=0;
  window.scrollTo(0,0);
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
    const btn=document.querySelector('.nav-btn[data-tab="'+tabId+'"]');
    if(btn)btn.click();
  }
  // On phones, reveal the left nav/branding drawer on entry instead of dropping
  // straight into the tab content (btn.click above closes it, so open it after).
  if(window.innerWidth<900)openSidebar();
}

function enterMatchday(){enterApp('matchday');}
function updateWelcomeStats(){}
function subshow(id,btn){
  document.querySelectorAll('.subsec').forEach(s=>s.classList.remove('on'));
  document.querySelectorAll('.subnav-btn').forEach(b=>b.classList.remove('on'));
  document.getElementById(id).classList.add('on');btn.classList.add('on');
  if(id==='t-live'){renderMatchday();mdStartPolling();}else{mdStopPolling();}
}

if(initSupabase()){
  applyAuthUI();
  loadAll();
  checkSession();
  trackVisit();
}

// Deep-link support: open straight to a tab via URL hash (e.g. index.html#dash)
(function(){
  const map={dash:'dashboard',dashboard:'dashboard',cup:'tournament',tournament:'tournament',xi:'lineup',lineup:'lineup',roster:'roster',money:'money',rsvp:'rsvp',live:'matchday',matchday:'matchday'};
  const tab=map[(location.hash||'').replace('#','').toLowerCase()];
  if(tab)enterApp(tab);
})();
