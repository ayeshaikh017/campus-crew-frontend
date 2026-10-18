import {useCallback,useEffect,useRef,useState} from 'react';
import {GraduationCap,HeartHandshake,Send,MessageCircle,X,Check,ClipboardList,ArrowRight,ArrowLeft,Plus,Users,BookOpen} from 'lucide-react';
import api,{payload,errorMessage} from '../lib/api';
import {useAuth} from '../context/AuthContext';
import {Button,Field,Notice,Spinner,Empty} from './UI';

export const roleLabel=r=>r==='coordinator'?'Teacher':'Student';
export const isTeacherRole=r=>r==='coordinator';
const statusLabel={todo:'To do',in_progress:'In progress',completed:'Completed'};
const fmtDate=d=>d?new Date(d).toLocaleDateString('en',{month:'short',day:'numeric'}):'No due date';

/* ---------- Choose student / teacher after login ---------- */
export function RoleSelect(){
  const {me,chooseRole,refreshMe,logout}=useAuth();
  const [pick,setPick]=useState('');const [code,setCode]=useState('');
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const knownTeacher=me.isTeacher||me.role==='coordinator'||me.role==='admin';
  async function go(role){
    setBusy(true);setError('');
    try{await chooseRole(role,code)}catch(e){setError(errorMessage(e))}finally{setBusy(false)}
  }
  return <div className="role-screen"><div className="role-box">
    <div className="brand-mark"><HeartHandshake size={24}/></div>
    <h1>Hi {me.name?.split(' ')[0]}, how are you using CampusCrew?</h1>
    <p>Pick one to continue. You can switch later from the sidebar.</p>
    <Notice>{error}</Notice>
    <div className="role-grid">
      <button className="role-card" disabled={busy} onClick={()=>go('student')}>
        <span className="role-icon"><GraduationCap size={26}/></span><b>Login as Student</b>
        <small>Volunteer for tasks, see what your teacher assigns, and chat with them.</small>
      </button>
      <div className={`role-card ${pick==='teacher'?'picked':''}`} onClick={()=>setPick('teacher')} role="button" tabIndex={0}>
        <span className="role-icon role-icon-alt"><BookOpen size={26}/></span><b>Login as Teacher</b>
        <small>See student volunteers live, assign each one a task, and message them.</small>
        {pick==='teacher'&&<form className="role-code" onClick={e=>e.stopPropagation()} onSubmit={e=>{e.preventDefault();go('teacher')}}>
          {!knownTeacher&&<Field label="Teacher access code" type="password" value={code} onChange={e=>setCode(e.target.value)} placeholder="Ask your college for the code" autoFocus required/>}
          <Button type="submit" disabled={busy}>{busy?'Please wait…':'Continue as Teacher'} <ArrowRight size={16}/></Button>
        </form>}
      </div>
    </div>
    <div className="role-foot">
      <button onClick={refreshMe}>Cancel</button><span>·</span><button onClick={logout}>Log out</button>
    </div>
  </div></div>;
}

/* ---------- Student: add my name as a volunteer ---------- */
export function VolunteerPage({setToast}){
  const {socket}=useAuth();
  const [enrolled,setEnrolled]=useState(false),[tasks,setTasks]=useState([]);
  const [busy,setBusy]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[note,setNote]=useState('');
  const load=useCallback(async()=>{
    try{
      const v=payload(await api.get('/volunteers/me'));
      const t=payload(await api.get('/tasks/mine'));
      setEnrolled(v.enrolled);setTasks(t.tasks||[]);setError('');
    }catch(e){setError(errorMessage(e))}finally{setBusy(false)}
  },[]);
  useEffect(()=>{load()},[load]);
  useEffect(()=>{
    if(!socket)return;
    const f=()=>{load();setToast?.('Your teacher just updated your tasks.')};
    socket.on('task:updated',f);return()=>socket.off('task:updated',f);
  },[socket,load,setToast]);
  async function enroll(){
    setSaving(true);setError('');
    try{await api.post('/volunteers/enroll',{note});setEnrolled(true);setToast?.('You are on the volunteer list! Your teacher can see you now.')}
    catch(e){setError(errorMessage(e))}finally{setSaving(false)}
  }
  async function withdraw(){
    if(!confirm('Remove your name from the volunteer list?'))return;
    setSaving(true);
    try{await api.delete('/volunteers/enroll');setEnrolled(false)}catch(e){setError(errorMessage(e))}finally{setSaving(false)}
  }
  async function setStatus(t,status){
    try{await api.patch('/tasks/'+t._id,{status});load()}catch(e){setError(errorMessage(e))}
  }
  if(busy)return <Spinner/>;
  return <div className="page-wrap">
    <div className="page-title-row"><div><span className="section-kicker">LEND A HAND</span><h1>Volunteer</h1><p>Add your name and your teacher will give you something to take care of.</p></div></div>
    <Notice>{error}</Notice>
    <section className="content-panel vol-join">
      {enrolled?<>
        <div className="vol-badge"><Check size={18}/> You are a volunteer</div>
        <p>Your name is on your teacher's list. Tasks they write for you show up below instantly.</p>
        <Button variant="outline" onClick={withdraw} disabled={saving}>Remove my name</Button>
      </>:<>
        <h2>Want to volunteer?</h2>
        <p>One tap adds your name to your teacher's volunteer list, live.</p>
        <label className="field"><span>Anything your teacher should know? (optional)</span><input value={note} maxLength={300} onChange={e=>setNote(e.target.value)} placeholder="e.g. Good at design, free after 3pm"/></label>
        <Button onClick={enroll} disabled={saving}><Plus size={16}/> {saving?'Adding…':'Add my name as a volunteer'}</Button>
      </>}
    </section>
    {enrolled&&<section className="content-panel" style={{marginTop:18}}>
      <h2>Your tasks</h2>
      {tasks.length?<div className="vol-tasks">{tasks.map(t=><div className="vol-task" key={t._id}>
        <div><b className={t.status==='completed'?'done-text':''}>{t.title}</b>{t.description&&<p>{t.description}</p>}<small>{t.dueDate?'Due '+fmtDate(t.dueDate):'No due date'}</small></div>
        <select value={t.status} onChange={e=>setStatus(t,e.target.value)}>{Object.entries(statusLabel).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
      </div>)}</div>:<Empty icon={ClipboardList} title="No tasks yet" body="When your teacher writes a task for you it will appear here in real time."/>}
    </section>}
  </div>;
}

/* ---------- Teacher: volunteers list + write tasks ---------- */
function AssignTask({student,onDone,setToast}){
  const [f,setF]=useState({title:'',description:'',dueDate:''});const [busy,setBusy]=useState(false),[err,setErr]=useState('');
  async function submit(e){
    e.preventDefault();setBusy(true);setErr('');
    try{
      await api.post(`/volunteers/${student._id}/tasks`,{title:f.title,description:f.description||undefined,dueDate:f.dueDate?new Date(f.dueDate).toISOString():undefined});
      setToast?.(`Task sent to ${student.name}`);onDone();
    }catch(e){setErr(errorMessage(e))}finally{setBusy(false)}
  }
  return <form className="assign-form" onSubmit={submit}>
    <Notice>{err}</Notice>
    <Field label="Task" value={f.title} onChange={e=>setF({...f,title:e.target.value})} required minLength={2} maxLength={160} placeholder={`What should ${student.name?.split(' ')[0]} do?`}/>
    <label className="field"><span>Details (optional)</span><textarea rows={2} value={f.description} onChange={e=>setF({...f,description:e.target.value})}/></label>
    <Field label="Due date (optional)" type="date" value={f.dueDate} onChange={e=>setF({...f,dueDate:e.target.value})}/>
    <div className="form-actions"><Button type="button" variant="outline" onClick={onDone}>Cancel</Button><Button type="submit" disabled={busy}>{busy?'Sending…':'Assign task'} <ArrowRight size={15}/></Button></div>
  </form>;
}

export function TeacherVolunteers({setToast}){
  const {socket}=useAuth();
  const [rows,setRows]=useState([]),[busy,setBusy]=useState(true),[error,setError]=useState(''),[open,setOpen]=useState(null);
  const load=useCallback(async()=>{
    try{setRows(payload(await api.get('/volunteers')).volunteers||[]);setError('')}
    catch(e){setError(errorMessage(e))}finally{setBusy(false)}
  },[]);
  useEffect(()=>{load()},[load]);
  useEffect(()=>{
    if(!socket)return;
    const enrolled=d=>{setToast?.(`${d?.name||'A student'} just enrolled as a volunteer`);load()};
    const withdrawn=d=>{setToast?.(`${d?.name||'A student'} left the volunteer list`);load()};
    socket.on('volunteer:enrolled',enrolled);socket.on('volunteer:withdrawn',withdrawn);socket.on('volunteer:updated',load);
    return()=>{socket.off('volunteer:enrolled',enrolled);socket.off('volunteer:withdrawn',withdrawn);socket.off('volunteer:updated',load)};
  },[socket,load,setToast]);
  const chat=s=>window.dispatchEvent(new CustomEvent('campuscrew:open-chat',{detail:{user:s}}));
  return <div className="page-wrap">
    <div className="page-title-row"><div><span className="section-kicker">YOUR VOLUNTEER CREW</span><h1>Volunteers</h1><p>Students who want to help appear here live. Give each one a task.</p></div><span className="live-chip"><i className="live-dot"/> Live · {rows.length} volunteer{rows.length===1?'':'s'}</span></div>
    <Notice>{error}</Notice>
    {busy?<Spinner/>:rows.length?<div className="vol-list">{rows.map(v=><section className="content-panel vol-card" key={v._id}>
      <div className="vol-head">
        <div className="person-avatar person-color-1">{v.student.name?.slice(0,1)}</div>
        <div className="vol-who"><h3>{v.student.name}</h3><p>{[v.student.department,v.student.academicYear,v.student.collegeId].filter(Boolean).join(' · ')||'Student'}</p>{v.note&&<small>“{v.note}”</small>}</div>
        <div className="vol-actions"><Button variant="outline" onClick={()=>chat(v.student)}><MessageCircle size={15}/> Message</Button><Button onClick={()=>setOpen(open===v._id?null:v._id)}><Plus size={15}/> Write task</Button></div>
      </div>
      {open===v._id&&<AssignTask student={v.student} setToast={setToast} onDone={()=>{setOpen(null);load()}}/>}
      {v.tasks.length>0&&<div className="vol-tasks">{v.tasks.map(t=><div className="vol-task" key={t._id}>
        <div><b className={t.status==='completed'?'done-text':''}>{t.title}</b>{t.description&&<p>{t.description}</p>}<small>{t.dueDate?'Due '+fmtDate(t.dueDate):'No due date'}</small></div>
        <span className={`status-pill status-${t.status.replace(/[^a-z]/g,'')}`}>{statusLabel[t.status]}</span>
      </div>)}</div>}
    </section>)}</div>:<div className="content-panel"><Empty icon={Users} title="No volunteers yet" body="When a student adds their name as a volunteer, they'll pop up here instantly."/></div>}
  </div>;
}

/* ---------- Teacher: add / manage people on one event ---------- */
function StudentPicker({event,type,taken,onAdded,onClose,setToast}){
  const [q,setQ]=useState(''),[users,setUsers]=useState([]),[busy,setBusy]=useState(true),[err,setErr]=useState(''),[adding,setAdding]=useState(''),[workRole,setWorkRole]=useState('');
  const isVol=type==='volunteer';
  useEffect(()=>{
    let live=true;setBusy(true);
    const t=setTimeout(async()=>{
      try{
        const d=payload(await api.get('/users/directory?search='+encodeURIComponent(q.trim())));
        if(live){setUsers((d.users||[]).filter(u=>u.role==='volunteer'));setErr('')}
      }catch(e){if(live)setErr(errorMessage(e))}finally{if(live)setBusy(false)}
    },q?250:0);
    return()=>{live=false;clearTimeout(t)};
  },[q]);
  async function add(u){
    setAdding(u._id);setErr('');
    try{
      await api.post(`/events/${event._id}/members`,{userId:u._id,type,workRole:isVol&&workRole.trim()?workRole.trim():undefined});
      setToast?.(`${u.name} added as ${isVol?'volunteer':'participant'}`);onAdded();
    }catch(e){setErr(errorMessage(e))}finally{setAdding('')}
  }
  const list=users.filter(u=>!taken.has(String(u._id)));
  return <div className="ep-picker">
    <div className="ep-picker-head"><b>{isVol?'Pick students to add as volunteers':'Pick students to add as participants'}</b><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X size={16}/></button></div>
    <Notice>{err}</Notice>
    {isVol&&<Field label="Their job at this event (optional)" value={workRole} onChange={e=>setWorkRole(e.target.value)} maxLength={100} placeholder="e.g. Registration desk, Stage help"/>}
    <Field label="Search student by name" value={q} onChange={e=>setQ(e.target.value)} placeholder="Type a name…"/>
    {busy?<Spinner/>:list.length?<div className="ep-pick-list">{list.map(u=><div className="ep-row" key={u._id}>
      <span className="ep-avatar">{u.name?.slice(0,1)}</span>
      <span className="ep-who"><b>{u.name}</b><small>{[u.collegeId,u.department,u.academicYear].filter(Boolean).join(' · ')||'Student'}</small></span>
      <Button type="button" onClick={()=>add(u)} disabled={adding===u._id}><Plus size={14}/> {adding===u._id?'Adding…':'Add'}</Button>
    </div>)}</div>:<p className="ep-empty">{q?'No student found with that name.':'No more students to add.'}</p>}
    <div className="form-actions"><Button type="button" variant="outline" onClick={onClose}>Done</Button></div>
  </div>;
}

export function EventPeople({event,setToast}){
  const {socket}=useAuth();
  const [regs,setRegs]=useState([]),[busy,setBusy]=useState(true),[error,setError]=useState(''),[pick,setPick]=useState('');
  const load=useCallback(async()=>{
    try{setRegs(payload(await api.get(`/events/${event._id}/registrations`)).registrations||[]);setError('')}
    catch(e){setError(errorMessage(e))}finally{setBusy(false)}
  },[event._id]);
  useEffect(()=>{load()},[load]);
  useEffect(()=>{
    if(!socket)return;
    const f=d=>{if(!d?.eventId||d.eventId===event._id)load()};
    socket.on('registration:new',f);return()=>socket.off('registration:new',f);
  },[socket,load,event._id]);
  const vols=regs.filter(r=>r.type==='volunteer_applicant'&&['pending','approved'].includes(r.status));
  const parts=regs.filter(r=>r.type==='participant'&&r.status==='approved');
  const takenVol=new Set(vols.map(r=>String(r.userId._id))),takenPart=new Set(parts.map(r=>String(r.userId._id)));
  async function decide(r,decision){
    try{await api.patch(`/events/${event._id}/registrations/${r._id}`,{decision});setToast?.(decision==='approve'?'Volunteer approved':'Application rejected');load()}
    catch(e){setError(errorMessage(e))}
  }
  async function remove(r){
    if(!confirm(`Remove ${r.userId.name} from this event?`))return;
    try{await api.delete(`/events/${event._id}/members/${r._id}`);load()}catch(e){setError(errorMessage(e))}
  }
  const row=r=><div className="ep-row" key={r._id}>
    <span className="ep-avatar">{r.userId.name?.slice(0,1)}</span>
    <span className="ep-who"><b>{r.userId.name}</b><small>{[r.workRole,r.userId.collegeId,r.userId.department].filter(Boolean).join(' · ')||'Student'}</small></span>
    {r.status==='pending'?<span className="ep-actions"><button type="button" className="approve-btn" onClick={()=>decide(r,'approve')}><Check size={14}/> Approve</button><button type="button" className="reject-btn" onClick={()=>decide(r,'reject')}>Reject</button></span>
    :<span className="ep-actions"><button type="button" className="reject-btn" onClick={()=>remove(r)}>Remove</button></span>}
  </div>;
  const section=({type,title,hint,rows,taken,icon:Icon})=><section className="content-panel ep-section" key={type}>
    <div className="ep-section-head">
      <div className="ep-section-title"><span className="ep-icon"><Icon size={18}/></span><div><h2>{title} <span className="ep-count">{rows.length}</span></h2><p>{hint}</p></div></div>
      <Button onClick={()=>setPick(pick===type?'':type)} variant={pick===type?'outline':'primary'}><Plus size={15}/> {type==='volunteer'?'Add volunteer':'Add participant'}</Button>
    </div>
    {pick===type&&<StudentPicker event={event} type={type} taken={taken} setToast={setToast} onAdded={load} onClose={()=>setPick('')}/>}
    {rows.length?<div className="ep-list">{rows.map(row)}</div>:<p className="ep-empty">Nobody yet. Tap “{type==='volunteer'?'Add volunteer':'Add participant'}” to add students.</p>}
  </section>;
  return <div className="ep-wrap">
    <div className="ep-intro"><b>You are managing this event.</b><span>Students can already see it and can join on their own. You can also add them yourself below.</span></div>
    <Notice>{error}</Notice>
    {busy?<Spinner/>:<>
      {section({type:'volunteer',title:'Volunteers',hint:'Students who help run the event. Applications from students wait here for your approval.',rows:vols,taken:takenVol,icon:HeartHandshake})}
      {section({type:'participant',title:'Participants',hint:'Students who are attending the event.',rows:parts,taken:takenPart,icon:Users})}
    </>}
  </div>;
}

/* ---------- Chat: student <-> teacher, real time ---------- */
export function ChatWidget(){
  const {me,socket}=useAuth();
  const [open,setOpen]=useState(false),[contacts,setContacts]=useState([]),[active,setActive]=useState(null),[conv,setConv]=useState(null);
  const [messages,setMessages]=useState([]),[text,setText]=useState(''),[unread,setUnread]=useState({}),[err,setErr]=useState('');
  const endRef=useRef(null),cur=useRef({});cur.current={conv};

  const loadContacts=useCallback(async()=>{try{setContacts(payload(await api.get('/chat/contacts')).contacts||[])}catch{/* ignore */}},[]);
  useEffect(()=>{if(open)loadContacts()},[open,loadContacts]);

  const openContact=useCallback(async c=>{
    setActive(c);setErr('');setMessages([]);setConv(null);setUnread(u=>({...u,[c._id]:false}));
    try{
      const cv=payload(await api.post('/chat',{recipientId:c._id})).conversation;
      setConv(cv);
      setMessages(payload(await api.get(`/chat/${cv._id}/messages`)).messages||[]);
    }catch(e){setErr(errorMessage(e))}
  },[]);

  useEffect(()=>{
    const f=e=>{setOpen(true);if(e.detail?.user)openContact(e.detail.user)};
    window.addEventListener('campuscrew:open-chat',f);return()=>window.removeEventListener('campuscrew:open-chat',f);
  },[openContact]);

  useEffect(()=>{
    if(!socket)return;
    const onMsg=({conversationId,message})=>{
      const sid=String(message.senderId?._id||message.senderId);
      if(cur.current.conv&&cur.current.conv._id===conversationId){
        setMessages(m=>m.some(x=>x._id===message._id)?m:[...m,message]);
      }else if(sid!==String(me._id)){
        setUnread(u=>({...u,[sid]:true}));loadContacts();
      }
    };
    socket.on('message:new',onMsg);return()=>socket.off('message:new',onMsg);
  },[socket,me._id,loadContacts]);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'})},[messages,active]);

  async function send(e){
    e.preventDefault();const t=text.trim();if(!t||!conv)return;
    setText('');
    try{
      const m=payload(await api.post(`/chat/${conv._id}/messages`,{text:t})).message;
      setMessages(list=>list.some(x=>x._id===m._id)?list:[...list,m]);
    }catch(e2){setErr(errorMessage(e2));setText(t)}
  }
  const teacher=isTeacherRole(me.role);
  const anyUnread=Object.values(unread).some(Boolean);
  return <>
    <button className="chat-fab" onClick={()=>setOpen(o=>!o)} aria-label="Chat">{open?<X size={22}/>:<MessageCircle size={22}/>}{!open&&anyUnread&&<i className="chat-badge"/>}</button>
    {open&&<div className="chat-panel">
      <div className="chat-head">
        {active&&<button onClick={()=>{setActive(null);setConv(null)}} aria-label="Back"><ArrowLeft size={17}/></button>}
        <b>{active?active.name:teacher?'Student messages':'Chat with your teacher'}</b>
      </div>
      {!active?<div className="chat-list">
        {contacts.length?contacts.map(c=><button key={c._id} onClick={()=>openContact(c)}>
          <span className="chat-avatar">{c.name?.slice(0,1)}</span>
          <span><b>{c.name}</b><small>{c.department||roleLabel(c.role)}</small></span>
          {unread[c._id]&&<i className="chat-badge chat-badge-inline"/>}
        </button>):<p className="chat-empty">{teacher?'No students yet. Volunteers and anyone who messages you will show up here.':'No teacher has joined yet. Check back soon.'}</p>}
      </div>:<>
        <div className="chat-msgs">
          {err&&<div className="notice notice-error">{err}</div>}
          {messages.map(m=>{const mine=String(m.senderId?._id||m.senderId)===String(me._id);return <div key={m._id} className={`chat-msg ${mine?'mine':''}`}><span>{m.text}</span><small>{new Date(m.createdAt).toLocaleTimeString('en',{hour:'numeric',minute:'2-digit'})}</small></div>})}
          {!messages.length&&!err&&<p className="chat-empty">Say hi 👋</p>}
          <div ref={endRef}/>
        </div>
        <form className="chat-input" onSubmit={send}><input value={text} onChange={e=>setText(e.target.value)} placeholder="Type a message…" maxLength={1000} disabled={!conv}/><button disabled={!conv||!text.trim()} aria-label="Send"><Send size={17}/></button></form>
      </>}
    </div>}
  </>;
}
