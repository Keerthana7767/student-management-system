import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import {LayoutDashboard, Users, BookOpen, CalendarCheck, CreditCard, Search, Plus, Pencil, Trash2, X, Menu, GraduationCap} from "lucide-react";
import "./styles.css";

const API = "http://localhost:5000/api";

function App(){
  const [page,setPage]=useState("Dashboard");
  const [students,setStudents]=useState([]);
  const [stats,setStats]=useState({});
  const [search,setSearch]=useState("");
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [mobile,setMobile]=useState(false);

  const load=async()=>{
    const [a,b]=await Promise.all([fetch(API+"/students"),fetch(API+"/stats")]);
    setStudents(await a.json()); setStats(await b.json());
  };
  useEffect(()=>{load()},[]);

  const filtered=useMemo(()=>students.filter(s=>
    `${s.name} ${s.email} ${s.course}`.toLowerCase().includes(search.toLowerCase())
  ),[students,search]);

  const remove=async(id)=>{
    if(!confirm("Delete this student?")) return;
    await fetch(`${API}/students/${id}`,{method:"DELETE"}); load();
  };

  const save=async(e)=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(e.currentTarget));
    const url=editing?`${API}/students/${editing.id}`:`${API}/students`;
    await fetch(url,{method:editing?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    setModal(false); setEditing(null); load();
  };

  const nav=[
    ["Dashboard",LayoutDashboard],["Students",Users],["Courses",BookOpen],["Attendance",CalendarCheck],["Fees",CreditCard]
  ];

  return <div className="app">
    <aside className={mobile?"sidebar open":"sidebar"}>
      <div className="brand"><div className="brand-icon"><GraduationCap size={22}/></div><span>EduManage</span></div>
      <nav>{nav.map(([name,Icon])=><button key={name} className={page===name?"nav active":"nav"} onClick={()=>{setPage(name);setMobile(false)}}><Icon size={19}/>{name}</button>)}</nav>
      <div className="sidebar-bottom"><div className="help">Need help?<br/><small>Check the project README</small></div></div>
    </aside>
    {mobile&&<div className="overlay" onClick={()=>setMobile(false)}/>}
    <main className="main">
      <header className="topbar">
        <button className="mobile-btn" onClick={()=>setMobile(true)}><Menu/></button>
        <div><div className="eyebrow">ADMIN PORTAL</div><h1>{page}</h1></div>
        <div className="top-actions"><div className="search global"><Search size={17}/><input placeholder="Search students..." value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="avatar">AD</div></div>
      </header>

      {page==="Dashboard" && <Dashboard stats={stats} students={students}/>}
      {page==="Students" && <Students students={filtered} search={search} setSearch={setSearch} open={(s=null)=>{setEditing(s);setModal(true)}} remove={remove}/>}
      {page==="Courses" && <Placeholder title="Courses" icon={<BookOpen/>} text="Course management module is ready for extension."/>}
      {page==="Attendance" && <Placeholder title="Attendance" icon={<CalendarCheck/>} text="Attendance tracking module is ready for extension."/>}
      {page==="Fees" && <Placeholder title="Fees" icon={<CreditCard/>} text="Fee collection module is ready for extension."/>}
    </main>

    {modal && <div className="modal-wrap"><div className="modal">
      <div className="modal-head"><h2>{editing?"Edit student":"Add student"}</h2><button onClick={()=>{setModal(false);setEditing(null)}}><X/></button></div>
      <form onSubmit={save} className="form">
        {["name","email","phone"].map(k=><label key={k}>{k[0].toUpperCase()+k.slice(1)}<input name={k} defaultValue={editing?.[k]||""} required={k!=="phone"}/></label>)}
        <label>Course<select name="course" defaultValue={editing?.course||"Computer Science"}><option>Computer Science</option><option>Information Technology</option><option>Data Science</option><option>Business Administration</option></select></label>
        <label>Year<select name="year" defaultValue={editing?.year||"1st Year"}><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option></select></label>
        <label>Status<select name="status" defaultValue={editing?.status||"Active"}><option>Active</option><option>Inactive</option></select></label>
        <button className="primary full" type="submit">{editing?"Save changes":"Add student"}</button>
      </form>
    </div></div>}
  </div>
}

function Dashboard({stats,students}){
 return <section className="content">
   <div className="welcome"><div><span>Academic year 2026–27</span><h2>Good morning, Admin 👋</h2><p>Here’s an overview of your student management system.</p></div><div className="welcome-mark">EDU</div></div>
   <div className="stats-grid">
    <Stat title="Total Students" value={stats.students||0} note={`${stats.active||0} active`} icon={<Users/>}/>
    <Stat title="Attendance" value={`${stats.attendance||0}%`} note="This month" icon={<CalendarCheck/>}/>
    <Stat title="Fees Collected" value={`${stats.feesCollected||0}%`} note="Of total fees" icon={<CreditCard/>}/>
    <Stat title="Active Students" value={stats.active||0} note={`${stats.inactive||0} inactive`} icon={<GraduationCap/>}/>
   </div>
   <div className="panel"><div className="panel-head"><div><h3>Recent Students</h3><p>Latest student registrations</p></div><span className="pill">{students.length} records</span></div>
    <StudentTable students={students.slice(0,5)} compact/>
   </div>
 </section>
}
function Stat({title,value,note,icon}){return <div className="stat"><div className="stat-top"><span>{title}</span><div className="stat-icon">{icon}</div></div><strong>{value}</strong><small>{note}</small></div>}
function Students({students,search,setSearch,open,remove}){return <section className="content"><div className="page-row"><div><h2>Student Directory</h2><p>Manage student profiles, courses and enrollment status.</p></div><button className="primary" onClick={()=>open()}><Plus size={18}/> Add student</button></div>
 <div className="panel"><div className="toolbar"><div className="search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, email or course"/></div><span className="muted">{students.length} students</span></div><StudentTable students={students} remove={remove} open={open}/></div></section>}
function StudentTable({students,remove,open,compact}){return <div className="table-wrap"><table><thead><tr><th>Student</th><th>Course</th><th>Year</th><th>Status</th>{!compact&&<th>Actions</th>}</tr></thead><tbody>{students.length?students.map(s=><tr key={s.id}><td><div className="person"><span>{s.avatar}</span><div><b>{s.name}</b><small>{s.email}</small></div></div></td><td>{s.course}</td><td>{s.year}</td><td><span className={s.status==="Active"?"status active":"status inactive"}>{s.status}</span></td>{!compact&&<td><div className="actions"><button onClick={()=>open(s)}><Pencil size={16}/></button><button onClick={()=>remove(s.id)}><Trash2 size={16}/></button></div></td>}</tr>):<tr><td colSpan="5" className="empty">No students found.</td></tr>}</tbody></table></div>}
function Placeholder({title,icon,text}){return <section className="content"><div className="placeholder"><div className="placeholder-icon">{icon}</div><h2>{title}</h2><p>{text}</p><small>Use this starter to add your own business rules and API endpoints.</small></div></section>}

createRoot(document.getElementById("root")).render(<App/>);
