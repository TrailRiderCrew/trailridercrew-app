const ADMINS=['deine@mail.de'];
const isAdm=u=>!!u&&ADMINS.includes((u.email||'').toLowerCase());
let usr=sess;if(usr&&!usr.email)usr=null;sess=isAdm(usr)?usr:null;
const jh={apikey:KEY,'Content-Type':'application/json'};
const gd=document.createElement('div');gd.className='ov';gd.id='gate';gd.style.zIndex=3500;
gd.innerHTML='<div class="app"><img class="logo" src="logo-lockup.png" alt="TRC Landau Pfalz"><h2>Anmelden</h2><p id="gT">Gib deine E-Mail-Adresse ein. Wir schicken dir einen Code.</p><div id="g1"><label for="gE">E-Mail</label><input id="gE" type="email" autocomplete="email"><div class="btns"><button class="btn" id="gS">Code senden</button></div></div><div id="g2" hidden><label for="gC">Code</label><input id="gC" inputmode="numeric" autocomplete="one-time-code"><div class="btns"><button class="btn" id="gV">Anmelden</button><button class="btn alt" id="gB">Andere E-Mail</button></div></div></div>';
document.body.append(gd);
function gate(){gd.classList.toggle('on',!usr);document.querySelector('.nav button[data-v=admin]').hidden=!sess}
function setSess(j){
  usr=j?{access_token:j.access_token,refresh_token:j.refresh_token,exp:Date.now()+j.expires_in*1000,email:(j.user&&j.user.email)||(usr&&usr.email)||''}:null;
  sess=isAdm(usr)?usr:null;
  try{usr?localStorage.setItem('trc_s',JSON.stringify(usr)):localStorage.removeItem('trc_s')}catch(e){}
  gate();renderAdmin();renderEvents();showSpot(null);
}
async function refresh(){
  if(!usr||Date.now()<usr.exp-60000)return;
  const r=await fetch(SB+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:jh,body:JSON.stringify({refresh_token:usr.refresh_token})});
  if(r.ok)setSess(await r.json());else setSess(null);
}
async function api(path,method='GET',body){
  const none=method==='GET'?[]:null;
  if(!usr)return none;
  await refresh();if(!usr)return none;
  const h={apikey:KEY,'Content-Type':'application/json',Authorization:'Bearer '+usr.access_token};
  if(method!=='GET')h.Prefer='return=minimal';
  const r=await fetch(SB+'/rest/v1/'+path,{method,headers:h,body:body?JSON.stringify(body):undefined});
  if(!r.ok)throw new Error('Fehler '+r.status);
  return method==='GET'?r.json():null;
}
$('#gS').onclick=async()=>{
  const m=$('#gE').value.trim().toLowerCase();if(!m){toast('Bitte E-Mail eingeben');return}
  try{
    const r=await fetch(SB+'/auth/v1/otp',{method:'POST',headers:jh,body:JSON.stringify({email:m,create_user:true})});
    if(!r.ok)throw 0;
    $('#g1').hidden=true;$('#g2').hidden=false;$('#gT').textContent='Wir haben einen Code an '+m+' geschickt.';
  }catch(e){toast('Code konnte nicht gesendet werden')}
};
$('#gV').onclick=async()=>{
  try{
    const r=await fetch(SB+'/auth/v1/verify',{method:'POST',headers:jh,body:JSON.stringify({type:'email',email:$('#gE').value.trim().toLowerCase(),token:$('#gC').value.trim()})});
    if(!r.ok)throw 0;
    setSess(await r.json());$('#gC').value='';load();
  }catch(e){toast('Code falsch oder abgelaufen')}
};
$('#gB').onclick=()=>{$('#g2').hidden=true;$('#g1').hidden=false};
const lo2=el('button','chip','Abmelden');lo2.style.cssText='float:right;margin-top:12px';
lo2.onclick=()=>setSess(null);document.querySelector('.top').append(lo2);
gate();renderAdmin();renderEvents();if(usr)load();
