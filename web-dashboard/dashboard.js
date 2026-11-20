
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.48.1';
const URL='https://ezzvalwtvcadizcwlptm.supabase.co';
const PUBLISHABLE_KEY='sb_publishable_zUZB0yUQf_HB1JsJO4FXTQ_uW6SqG3X';
const db=createClient(URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
const $=id=>document.getElementById(id);
let requestedMode='admin', currentSession=null, profile=null, rows=[], activeView='overview', loading=false;
let staffLoading=false;
function safeText(value){return String(value ?? '')}
function fmtDate(x){if(!x)return '—';const t=new Date(x);return Number.isNaN(t.getTime())?'—':new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Kolkata'}).format(t)}
function timeNow(){return new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'}).format(new Date())}
function hello(){const hour=Number(new Intl.DateTimeFormat('en-GB',{hour:'numeric',hourCycle:'h23',timeZone:'Asia/Kolkata'}).format(new Date()));return hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'}
function tag(label,type){const span=document.createElement('span');span.className='status-badge '+(type||'unverified');span.textContent=label;return span}
function showToast(text,error=false){const box=$('toast');box.hidden=false;box.className='alert'+(error?'':' success');box.textContent=text;box.scrollIntoView({block:'nearest',behavior:'smooth'})}
function clearToast(){$('toast').hidden=true;$('toast').textContent=''}
function setText(id,value){$(id).textContent=safeText(value)}
function node(tagName,className='',value){const item=document.createElement(tagName);if(className)item.className=className;if(value!==undefined)item.textContent=safeText(value);return item}
function cell(row,content){const td=node('td');if(content instanceof Node)td.append(content);else td.textContent=safeText(content);row.append(td)}
function maskedMobile(m){const s=safeText(m);return s.length>=4?'••••••'+s.slice(-4):'Not provided'}
function rowView(record,detailed=false){const tr=document.createElement('tr');
 const ref=node('span','ref',record.reference);cell(tr,ref);
 const cust=node('div','customer-name',record.full_name);cell(tr,cust);
 if(detailed){cell(tr,record.city||'—');cell(tr,fmtDate(record.created_at))}
 cell(tr,tag((record.status||'pending').replace(/^./,c=>c.toUpperCase()),record.status||'pending'));
 const phone=node('div','',maskedMobile(record.mobile));const phoneStatus=tag(record.phone_verified_at?'Provider-verified':'UNVERIFIED',record.phone_verified_at?'approved':'unverified');
 const holder=node('div');holder.append(phone,phoneStatus);cell(tr,holder);return tr}
function switchMode(next){requestedMode=next;$('adminTab').classList.toggle('active',next==='admin');$('staffTab').classList.toggle('active',next==='staff');setText('formTitle',next==='admin'?'Administrator Sign In':'Staff Sign In');setText('formHint',next==='admin'?'Restricted to active administrator accounts.':'Authorized staff may enroll customers and upload private KYC documents.');$('staffRequestWrap').hidden=next!=='staff';$('requestForm').hidden=true;clearToast()}
function showAuth(){profile=null;currentSession=null;$('authScreen').hidden=false;$('dashboardScreen').hidden=true;$('sideNavigation').hidden=true;$('welcome').hidden=false;setText('accountName','Guest Access');setText('accountRole','Sign in to continue');setText('avatar','OS');setText('crumb','Sign in');document.querySelectorAll('.admin-only,.reviewer-only').forEach(n=>n.hidden=true);closeMenu()}
function closeMenu(){$('sidebar').classList.remove('show');$('mobileOverlay').classList.remove('show');$('menuToggle').setAttribute('aria-expanded','false')}
function showMenu(){const now=$('sidebar').classList.toggle('show');$('mobileOverlay').classList.toggle('show',now);$('menuToggle').setAttribute('aria-expanded',String(now))}
function view(name){if(!profile)return;if(name==='team' && profile.role!=='admin')return;activeView=name;
 $('overviewView').hidden=name!=='overview';$('customersView').hidden=name!=='customers';$('teamView').hidden=name!=='team';
 document.querySelectorAll('[data-view]').forEach(el=>el.classList.toggle('active',el.dataset.view===name));
 setText('crumb',name==='overview'?'Dashboard':name==='customers'?'Customer Directory':'Staff Management');
 closeMenu();if(name==='customers')paintCustomerRecords();if(name==='team')loadStaff();window.scrollTo({top:0,behavior:'auto'})}
async function checkAccess(expectedMode=null){const {data:{session},error}=await db.auth.getSession();if(error||!session){showAuth();return false}
 const {data:role,error:roleError}=await db.from('crm_staff_profiles').select('role,active').eq('user_id',session.user.id).maybeSingle();
 if(roleError){showAuth();showToast('Unable to verify staff permissions. Please try again.',true);return false}
 if(!role?.active){showAuth();showToast(role?'Your staff account is pending administrator approval.':'This account is not registered for CRM access.',true);return false}
 if(expectedMode==='admin'&&role.role!=='admin'){await db.auth.signOut();showAuth();switchMode('staff');showToast('This account is not an administrator. Use Staff Login.',true);return false}
 if(expectedMode==='staff'&&role.role==='admin'){await db.auth.signOut();showAuth();switchMode('admin');showToast('Use the Administrator Login for this account.',true);return false}
 profile=role;currentSession=session;
 $('authScreen').hidden=true;$('dashboardScreen').hidden=false;$('sideNavigation').hidden=false;
 setText('accountName',session.user.email||'Authorized staff');
 setText('accountRole',role.role==='admin'?'Administrator':role.role==='reviewer'?'Reviewer':'Staff Agent');
 setText('avatar',safeText(session.user.email||'OS').slice(0,2).toUpperCase());
 setText('subtitle',role.role==='admin'?'Organization-wide CRM visibility and compliance operations.':'Customers visible within your assigned access scope.');
 setText('greeting',hello()+', '+(role.role==='admin'?'Administrator':role.role==='reviewer'?'Reviewer':'Team Member'));
 $('reviewerNav').hidden=!['admin','reviewer'].includes(role.role);
 $('adminNav').hidden=role.role!=='admin';
 document.querySelectorAll('.reviewer-only').forEach(n=>n.hidden=!['admin','reviewer'].includes(role.role));
 document.querySelectorAll('.admin-only').forEach(n=>n.hidden=role.role!=='admin');
 await loadRecords();
 if(role.role==='admin')void loadStaff();
 view('overview');
 return true
}
async function loadRecords(){
 if(!profile||loading)return;
 loading=true;
 const [customers,docs]=await Promise.all([
  db.from('crm_enrollments').select('reference,full_name,mobile,city,enrollment_type,status,created_at,phone_verified_at').order('created_at',{ascending:false}).limit(200),
  db.from('crm_kyc_documents').select('id',{head:true,count:'exact'})
 ]);
 loading=false;
 if(customers.error){showToast('Unable to refresh enrollments: '+customers.error.message,true);return}
 rows=customers.data||[];
 const counts={pending:0,approved:0,rejected:0};for(const e of rows){if(e.status in counts)counts[e.status]++}
 setText('statTotal',rows.length);setText('statPending',counts.pending);setText('statApproved',counts.approved);setText('statRejected',counts.rejected);
 const total=Math.max(rows.length,1);
 for(const k of Object.keys(counts)){const pct=100*counts[k]/total;setText('pipe'+k[0].toUpperCase()+k.slice(1),counts[k]+' · '+(rows.length?Math.round(pct):0)+'%');$('bar'+k[0].toUpperCase()+k.slice(1)).style.width=pct+'%'}
 setText('kycCount',docs.error?'Unavailable':docs.count??0);
 setText('syncLabel','Last refreshed: '+new Intl.DateTimeFormat('en-IN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kolkata'}).format(new Date())+' IST');
 const recent=$('recentBody');recent.replaceChildren();for(const r of rows.slice(0,5))recent.append(rowView(r));
 if(!rows.length){const empty=node('tr');const td=node('td','empty','No enrollments yet. Use New Enrollment to register your first customer.');td.colSpan=4;empty.append(td);recent.append(empty)}
 paintCustomerRecords();
}
function paintCustomerRecords(){const search=$('searchRecords').value.toLowerCase().trim(),status=$('statusFilter').value;
 const shown=rows.filter(r=>(status==='all'||r.status===status)&&(!search||[r.reference,r.full_name,r.city].some(v=>safeText(v).toLowerCase().includes(search))));
 const body=$('customerBody');body.replaceChildren();for(const r of shown)body.append(rowView(r,true));
 if(!shown.length){const tr=node('tr');const td=node('td','empty',rows.length?'No matching customers. Adjust your filters.':'No accessible records have been added yet.');td.colSpan=6;tr.append(td);body.append(tr)}
 setText('dirCount',shown.length+' displayed');setText('recordsFoot','Displaying '+shown.length+' of '+rows.length+' most recent accessible enrollments (up to 200). Client-side search does not include older records.')
}
async function loadStaff(){if(profile?.role!=='admin'||staffLoading)return;staffLoading=true;$('teamList').replaceChildren(node('div','empty','Loading staff requests…'));
 const {data,error}=await db.rpc('sarva_admin_staff_directory');staffLoading=false;
 const list=$('teamList');list.replaceChildren();
 if(error){list.append(node('div','empty','Could not load staff requests: '+error.message));return}
 if(!Array.isArray(data)||!data.length){list.append(node('div','empty','No staff access requests yet. Share the Staff Login link to let new staff request access.'));return}
 for(const staff of data){const row=node('div','staff-person');const info=node('div');const name=node('strong','',staff.email||'Staff account');const sub=node('small','',(staff.active?'Active staff':'Pending / Inactive')+' · Requested '+fmtDate(staff.created_at));info.append(name,sub);
 const action=node('button','btn small '+(staff.active?'danger':'primary'),staff.active?'Deactivate Staff':'Approve Staff');action.disabled=false;
 action.addEventListener('click',async()=>{const approve=!staff.active;if(!approve&&!confirm('Deactivate this staff account?'))return;action.disabled=true;const {error:changeError}=await db.rpc('sarva_admin_set_staff_active',{p_user_id:staff.user_id,p_active:approve});if(changeError){showToast(changeError.message,true);action.disabled=false;return}showToast(approve?'Staff access approved.':'Staff account deactivated.');await loadStaff()});
 row.append(info,action);list.append(row)}
}
async function login(ev){ev.preventDefault();const button=$('signInBtn');button.disabled=true;const requested=requestedMode;
 try{const {error}=await db.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error)throw error;await checkAccess(requested)}
 catch(err){showToast(err.message||'Unable to sign in.',true)}finally{button.disabled=false}}
async function requestStaff(ev){ev.preventDefault();const button=$('requestBtn');button.disabled=true;
 try{const {data,error}=await db.auth.signUp({email:$('requestEmail').value.trim(),password:$('requestPassword').value});if(error)throw error;
 if(data.session)await db.auth.signOut();
 showToast('Request submitted. Verify your email if requested. An administrator must approve your staff access.');$('requestForm').hidden=true;
 }catch(err){showToast(err.message||'Unable to submit request.',true)}finally{button.disabled=false}
}
function initialize(){
 setText('todayLabel',timeNow());$('adminTab').addEventListener('click',()=>switchMode('admin'));$('staffTab').addEventListener('click',()=>switchMode('staff'));
 $('loginForm').addEventListener('submit',login);$('requestToggle').addEventListener('click',()=>{$('requestForm').hidden=!$('requestForm').hidden});
 $('requestForm').addEventListener('submit',requestStaff);
 $('signOutButton').addEventListener('click',async()=>{await db.auth.signOut();showAuth();switchMode('admin');showToast('Signed out successfully.')});
 $('menuToggle').addEventListener('click',showMenu);$('mobileOverlay').addEventListener('click',closeMenu);
 for(const b of document.querySelectorAll('button[data-view]'))b.addEventListener('click',()=>view(b.dataset.view));
 $('viewCustomersQuick').addEventListener('click',()=>view('customers'));$('showAllCustomers').addEventListener('click',()=>view('customers'));
 $('searchRecords').addEventListener('input',paintCustomerRecords);$('statusFilter').addEventListener('change',paintCustomerRecords);
 for(const id of ['refreshOverview','refreshCustomers'])$(id).addEventListener('click',loadRecords);
 $('refreshTeam').addEventListener('click',loadStaff);
 checkAccess().catch(e=>{showAuth();showToast(e.message,true)});
}
initialize();
