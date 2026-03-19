import { useState, useCallback, useRef } from "react";
import { useSync } from "./useSync";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const TABS = ["plan","meals","groceries"];

const INITIAL_MEALS = [
  { id:"1", name:"Tacos", variations: [
    { id:"1a", name:"Beef Tacos", ingredients:["tortillas","ground beef","cheese","lettuce","tomato","sour cream","salsa"] },
    { id:"1b", name:"Chicken Tacos", ingredients:["tortillas","chicken breast","cheese","cilantro","lime","onion","salsa verde"] },
    { id:"1c", name:"Fish Tacos", ingredients:["tortillas","white fish","cabbage","lime crema","cilantro","avocado"] },
  ]},
  { id:"2", name:"Pasta", variations: [
    { id:"2a", name:"Spaghetti & Meatballs", ingredients:["spaghetti","ground beef","marinara sauce","parmesan","garlic","olive oil"] },
    { id:"2b", name:"Pesto Pasta", ingredients:["penne","basil pesto","cherry tomatoes","parmesan","pine nuts","olive oil"] },
    { id:"2c", name:"Mac & Cheese", ingredients:["elbow macaroni","cheddar cheese","milk","butter","flour","breadcrumbs"] },
  ]},
  { id:"3", name:"Stir Fry", variations: [
    { id:"3a", name:"Chicken Stir Fry", ingredients:["rice","chicken breast","soy sauce","broccoli","bell pepper","sesame oil"] },
    { id:"3b", name:"Beef & Broccoli", ingredients:["rice","flank steak","broccoli","soy sauce","garlic","cornstarch","ginger"] },
    { id:"3c", name:"Tofu Stir Fry", ingredients:["rice","firm tofu","soy sauce","snap peas","carrots","sesame oil","ginger"] },
  ]},
  { id:"4", name:"Pizza", variations: [
    { id:"4a", name:"Pepperoni Pizza", ingredients:["pizza dough","mozzarella","marinara sauce","pepperoni","olive oil"] },
    { id:"4b", name:"Veggie Pizza", ingredients:["pizza dough","mozzarella","marinara sauce","bell pepper","mushrooms","onion","olives"] },
  ]},
  { id:"5", name:"Burgers", variations: [
    { id:"5a", name:"Classic Burgers", ingredients:["ground beef","buns","cheese","lettuce","tomato","pickles","ketchup"] },
    { id:"5b", name:"Turkey Burgers", ingredients:["ground turkey","buns","avocado","arugula","red onion","mayo"] },
  ]},
  { id:"6", name:"Soup", variations: [
    { id:"6a", name:"Chicken Noodle", ingredients:["chicken broth","carrots","celery","onion","egg noodles","chicken breast"] },
    { id:"6b", name:"Tomato Soup & Grilled Cheese", ingredients:["canned tomatoes","onion","cream","butter","bread","cheddar cheese"] },
  ]},
];

export default function App() {
  const { meals, setMeals, plan, setPlan, templates, setTemplates, ready, synced, shareUrl } = useSync(INITIAL_MEALS);

  const [tab, setTab] = useState("plan");
  const [openDay, setOpenDay] = useState(null);
  const [pickedMeal, setPickedMeal] = useState(null);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [addName, setAddName] = useState("");
  const [addVarName, setAddVarName] = useState("");
  const [addVarIng, setAddVarIng] = useState("");
  const [editMealId, setEditMealId] = useState(null);
  const [editMealName, setEditMealName] = useState("");
  const [addingVar, setAddingVar] = useState(null);
  const [newVarName, setNewVarName] = useState("");
  const [newVarIng, setNewVarIng] = useState("");
  const [editVarKey, setEditVarKey] = useState(null);
  const [editVarName, setEditVarName] = useState("");
  const [editVarIng, setEditVarIng] = useState("");
  const [showCopy, setShowCopy] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [checkedItems, setCheckedItems] = useState({});
  const [addingMeal, setAddingMeal] = useState(false);
  const [newMealName, setNewMealName] = useState("");
  const [newMealVarName, setNewMealVarName] = useState("");
  const [newMealIng, setNewMealIng] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(null);
  const flashCopied = useCallback((key) => { setCopied(key); setTimeout(() => setCopied(c => c === key ? null : c), 1500); }, []);

  const touchStart = useRef(null);
  const switchTab = (dir) => {
    const i = TABS.indexOf(tab);
    const next = TABS[i + dir];
    if (next) { setTab(next); setOpenDay(null); setPickedMeal(null); setAdding(false); }
  };
  const onTouchStart = (e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) switchTab(dx < 0 ? 1 : -1);
    touchStart.current = null;
  };

  if (!ready || !meals) {
    return (
      <div style={{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh",fontFamily:"'DM Sans',sans-serif",background:"#faf7f2"}}>
        <p style={{color:"#8b7355",fontSize:16}}>Loading...</p>
      </div>
    );
  }

  const planned = Object.keys(plan).length;
  const getMeal = (id) => meals.find(m => m.id === id);
  const getVar = (mId, vId) => { const m = getMeal(mId); return m ? m.variations.find(v => v.id === vId) : null; };

  const assignVar = (day, mealId, varId) => {
    setPlan(p => ({...p, [day]: { mealId, varId }}));
    setOpenDay(null); setPickedMeal(null); setSearch(""); setAdding(false);
  };
  const skipDay = (day, reason) => {
    setPlan(p => ({...p, [day]: { skip: reason }}));
    setOpenDay(null); setPickedMeal(null); setSearch(""); setAdding(false);
  };
  const clearDay = (day) => setPlan(p => { const n={...p}; delete n[day]; return n; });

  const inlineAddMeal = (day) => {
    if (!addName.trim()) return;
    const mealId = "m" + Date.now();
    const varId = mealId + "v1";
    const varName = addVarName.trim() || addName.trim();
    setMeals(m => [...m, { id: mealId, name: addName.trim(), variations: [{ id: varId, name: varName, ingredients: addVarIng.split(",").map(s=>s.trim()).filter(Boolean) }] }]);
    assignVar(day, mealId, varId);
    setAddName(""); setAddVarName(""); setAddVarIng("");
  };

  const addVariation = (mealId) => {
    if (!newVarName.trim()) return;
    const varId = mealId + "v" + Date.now();
    setMeals(ms => ms.map(m => m.id === mealId ? {...m, variations: [...m.variations, { id: varId, name: newVarName.trim(), ingredients: newVarIng.split(",").map(s=>s.trim()).filter(Boolean) }]} : m));
    setAddingVar(null); setNewVarName(""); setNewVarIng("");
  };

  const deleteVariation = (mealId, varId) => {
    setMeals(ms => ms.map(m => m.id === mealId ? {...m, variations: m.variations.filter(v => v.id !== varId)} : m));
    setPlan(p => { const n={...p}; DAYS.forEach(d => { if(n[d]?.mealId===mealId && n[d]?.varId===varId) delete n[d]; }); return n; });
  };

  const startEditVar = (mealId, v) => {
    setEditVarKey(mealId + ":" + v.id);
    setEditVarName(v.name);
    setEditVarIng(v.ingredients.join(", "));
  };

  const saveEditVar = (mealId, varId) => {
    if (!editVarName.trim()) return;
    setMeals(ms => ms.map(m => m.id === mealId ? {
      ...m, variations: m.variations.map(v => v.id === varId ? {
        ...v, name: editVarName.trim(), ingredients: editVarIng.split(",").map(s=>s.trim()).filter(Boolean)
      } : v)
    } : m));
    setEditVarKey(null);
  };

  const cancelEditVar = () => setEditVarKey(null);

  const deleteMeal = (id) => {
    setMeals(m => m.filter(x => x.id !== id));
    setPlan(p => { const n={...p}; DAYS.forEach(d => { if(n[d]?.mealId===id) delete n[d]; }); return n; });
  };

  const renameMeal = (id) => {
    if (!editMealName.trim()) return;
    setMeals(ms => ms.map(m => m.id === id ? {...m, name: editMealName.trim()} : m));
    setEditMealId(null);
  };

  const addMealFromTab = () => {
    if (!newMealName.trim()) return;
    const mealId = "m" + Date.now();
    const varId = mealId + "v1";
    const varName = newMealVarName.trim() || newMealName.trim();
    setMeals(m => [...m, { id: mealId, name: newMealName.trim(), variations: [{ id: varId, name: varName, ingredients: newMealIng.split(",").map(s=>s.trim()).filter(Boolean) }] }]);
    setAddingMeal(false);
    setNewMealName("");
    setNewMealVarName("");
    setNewMealIng("");
  };

  const grocery = () => {
    const items = {};
    Object.values(plan).forEach(entry => {
      if (entry.skip) return;
      const v = getVar(entry.mealId, entry.varId);
      if (v) (v.ingredients || []).forEach(i => { const k=i.toLowerCase(); items[k]=(items[k]||0)+1; });
    });
    return Object.entries(items).sort((a,b) => a[0].localeCompare(b[0]));
  };

  // Templates
  const saveTemplate = () => {
    if (!templateName.trim() || Object.keys(plan).length === 0) return;
    setTemplates(t => [...t, { id: "t" + Date.now(), name: templateName.trim(), plan: {...plan} }]);
    setSavingTemplate(false);
    setTemplateName("");
  };

  const loadTemplate = (tpl) => {
    // Only load entries whose meals/vars still exist
    const newPlan = {};
    DAYS.forEach(d => {
      const e = tpl.plan[d];
      if (e && getVar(e.mealId, e.varId)) newPlan[d] = e;
    });
    setPlan(newPlan);
  };

  const deleteTemplate = (id) => {
    setTemplates(t => t.filter(x => x.id !== id));
  };

  // Sorted meals: unused dinners first, used dinners at bottom
  const usedMealIds = new Set(Object.values(plan).filter(e => e.mealId).map(e => e.mealId));
  const sortedMeals = [...meals].sort((a, b) => {
    const aUsed = usedMealIds.has(a.id) ? 1 : 0;
    const bUsed = usedMealIds.has(b.id) ? 1 : 0;
    return aUsed - bUsed;
  });

  const S = {
    wrap: { maxWidth:520, margin:"0 auto", padding:"0 16px 80px", minHeight:"100vh", background:"#faf7f2", fontFamily:"'DM Sans',sans-serif", color:"#3d3427" },
    h1: { fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, textAlign:"center", paddingTop:16, marginBottom:1 },
    sub: { textAlign:"center", color:"#a0937d", fontSize:12, marginBottom:12 },
    tabs: { display:"flex", gap:3, background:"#f0ebe2", borderRadius:10, padding:3, marginBottom:12 },
    tab: (a) => ({ flex:1, padding:"9px 0", border:"none", borderRadius:8, fontSize:13, fontWeight:600, fontFamily:"inherit", cursor:"pointer", background:a?"#fff":"transparent", color:a?"#3d3427":"#a0937d", boxShadow:a?"0 1px 3px rgba(0,0,0,0.07)":"none" }),
    card: { background:"#fff", borderRadius:12, padding:"12px 14px", marginBottom:6 },
    lbl: { fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", color:"#a0937d", marginBottom:1 },
    btn: (bg,fg) => ({ border:"none", borderRadius:7, padding:"5px 12px", fontSize:12, fontWeight:600, fontFamily:"inherit", cursor:"pointer", background:bg, color:fg }),
    inp: { width:"100%", padding:"7px 10px", border:"1px solid #e5ddd0", borderRadius:7, fontSize:13, fontFamily:"inherit", outline:"none", background:"#faf7f2", boxSizing:"border-box" },
    dd: { background:"#fff", borderRadius:10, marginTop:3, padding:"8px 10px", boxShadow:"0 3px 12px rgba(0,0,0,0.05)", border:"1px solid #ebe5da" },
    ddi: { display:"block", width:"100%", textAlign:"left", background:"transparent", border:"none", padding:"8px 10px", borderRadius:7, fontSize:13, fontFamily:"inherit", color:"#3d3427", cursor:"pointer" },
  };

  return (
    <div style={S.wrap} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet"/>
      <h1 style={S.h1}>Dinner Plan</h1>
      <p style={S.sub}>
        {planned}/7 nights planned
        {synced && <span style={{marginLeft:8,fontSize:11,color:"#8baa7d"}}>● synced</span>}
        {!synced && <span style={{marginLeft:8,fontSize:11,color:"#c8bfb1"}}>● local only</span>}
      </p>

      <div style={S.tabs}>
        {TABS.map(t => (
          <button key={t} style={S.tab(tab===t)} onClick={() => { setTab(t); setOpenDay(null); setPickedMeal(null); setAdding(false); }}>
            {t==="plan"?"This Week":t==="meals"?"Dinners":"Groceries"}
          </button>
        ))}
      </div>

      {/* ===== PLAN ===== */}
      {tab === "plan" && <>
        {DAYS.map(day => {
          const e = plan[day];
          const isSkip = e?.skip;
          const meal = (e && !isSkip) ? getMeal(e.mealId) : null;
          const vari = (e && !isSkip) ? getVar(e.mealId, e.varId) : null;
          const open = openDay === day;
          const filtered = meals.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
          const skipLabels = { leftovers: "Leftovers", eating_out: "Eating Out", takeout: "Takeout" };
          return (
            <div key={day} style={{ marginBottom:3 }}>
              <div style={{...S.card, padding:"8px 12px", display:"flex", alignItems:"center", justifyContent:"space-between", border:open?"2px solid #c4956a":"2px solid transparent", marginBottom:0}}>
                <div>
                  <div style={{...S.lbl,fontSize:9,marginBottom:0}}>{day}</div>
                  {isSkip
                    ? <div style={{fontSize:13,fontWeight:500,color:"#a0937d",fontStyle:"italic"}}>{skipLabels[e.skip] || e.skip}</div>
                    : vari
                      ? <div><span style={{fontSize:13,fontWeight:500}}>{meal?.name}</span>{vari.name !== meal?.name && <span style={{fontSize:11,color:"#a0937d",marginLeft:6}}>— {vari.name}</span>}</div>
                      : <div style={{fontSize:13,color:"#c8bfb1",fontStyle:"italic"}}>No dinner set</div>}
                </div>
                <div style={{display:"flex",gap:5,alignItems:"center"}}>
                  {e && <button onClick={()=>clearDay(day)} style={{background:"none",border:"none",color:"#c8bfb1",fontSize:17,cursor:"pointer"}}>&times;</button>}
                  <button style={S.btn(open?"#c4956a":"#f0ebe2",open?"#fff":"#8b7355")} onClick={()=>{setOpenDay(open?null:day);setPickedMeal(null);setSearch("");setAdding(false);}}>
                    {open?"Cancel":e?"Change":"Pick"}
                  </button>
                </div>
              </div>

              {/* Step 1: pick dinner */}
              {open && !pickedMeal && !adding && (
                <div style={S.dd}>
                  {!search && (
                    <div style={{display:"flex",gap:4,marginBottom:8}}>
                      {[["leftovers","Leftovers"],["eating_out","Eating Out"],["takeout","Takeout"]].map(([key,label])=>(
                        <button key={key} onClick={()=>skipDay(day,key)} style={{...S.btn("#f5f0e8","#8b7355"),flex:1,padding:"8px 4px",fontSize:12,textAlign:"center"}}>
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                  <input style={{...S.inp,marginBottom:6}} placeholder="Search dinners..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus/>
                  <div style={{maxHeight:200,overflowY:"auto"}}>
                    {filtered.map(m=>(
                      <button key={m.id} onClick={()=>{ m.variations.length===1 ? assignVar(day,m.id,m.variations[0].id) : setPickedMeal(m.id); }} style={S.ddi}>
                        {m.name} <span style={{color:"#b8ad9c",fontSize:11,marginLeft:6}}>{m.variations.length > 1 ? `${m.variations.length} variations` : ""}</span>
                      </button>
                    ))}
                    {filtered.length===0 && <p style={{color:"#b8ad9c",fontSize:12,textAlign:"center",padding:10}}>No matches</p>}
                  </div>
                  <button onClick={()=>{setAdding(true);setAddName(search);}} style={{display:"block",width:"100%",textAlign:"left",background:"transparent",border:"none",borderTop:"1px solid #ebe5da",padding:"9px 10px",fontSize:13,fontWeight:600,fontFamily:"inherit",color:"#c4956a",cursor:"pointer",marginTop:3}}>
                    + Add new dinner
                  </button>
                </div>
              )}

              {/* Step 2: pick variation */}
              {open && pickedMeal && (()=>{
                const m=getMeal(pickedMeal); if(!m) return null;
                return (
                  <div style={S.dd}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontSize:13,fontWeight:600}}>Pick a {m.name} variation</span>
                      <button style={S.btn("#f0ebe2","#8b7355")} onClick={()=>setPickedMeal(null)}>Back</button>
                    </div>
                    {m.variations.map(v=>(
                      <button key={v.id} onClick={()=>assignVar(day,m.id,v.id)} style={S.ddi}>
                        <div style={{fontWeight:500}}>{v.name}</div>
                        <div style={{fontSize:11,color:"#b8ad9c",marginTop:1}}>{(v.ingredients || []).join(", ")}</div>
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* Inline add */}
              {open && adding && (
                <div style={S.dd}>
                  <div style={{fontSize:12,fontWeight:600,color:"#a0937d",marginBottom:6,textTransform:"uppercase"}}>New Dinner</div>
                  <input style={{...S.inp,marginBottom:5}} placeholder='Dinner name (e.g. "Tacos")' value={addName} onChange={e=>setAddName(e.target.value)} autoFocus/>
                  <input style={{...S.inp,marginBottom:5}} placeholder='Variation (optional, e.g. "Beef Tacos")' value={addVarName} onChange={e=>setAddVarName(e.target.value)}/>
                  <textarea style={{...S.inp,marginBottom:6,resize:"none"}} rows={2} placeholder="Ingredients (comma separated)" value={addVarIng} onChange={e=>setAddVarIng(e.target.value)}/>
                  <div style={{display:"flex",gap:5}}>
                    <button style={{...S.btn("#c4956a","#fff"),flex:1,padding:"7px"}} onClick={()=>inlineAddMeal(day)}>Add & Assign</button>
                    <button style={S.btn("#f0ebe2","#8b7355")} onClick={()=>{setAdding(false);setAddName("");setAddVarName("");setAddVarIng("");}}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {planned>0 && <button style={{...S.btn("#fce8e8","#c47070"),width:"100%",padding:10,borderRadius:10,fontSize:13,marginTop:8}} onClick={()=>setPlan({})}>Reset Week</button>}

        {/* Templates */}
        <div style={{...S.card, padding:"8px 12px", marginTop:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom: (templates.length > 0 || savingTemplate) ? 6 : 0}}>
            <div style={{...S.lbl,fontSize:9,marginBottom:0}}>Week Templates</div>
            {planned > 0 && !savingTemplate && (
              <button style={S.btn("#f0ebe2","#8b7355")} onClick={()=>setSavingTemplate(true)}>Save This Week</button>
            )}
          </div>

          {savingTemplate && (
            <div style={{marginBottom:10}}>
              <input style={{...S.inp,marginBottom:5}} placeholder='Template name (e.g. "Easy Week")' value={templateName} onChange={e=>setTemplateName(e.target.value)} autoFocus />
              <div style={{display:"flex",gap:5}}>
                <button style={{...S.btn("#c4956a","#fff"),flex:1,padding:"7px"}} onClick={saveTemplate}>Save</button>
                <button style={S.btn("#f0ebe2","#8b7355")} onClick={()=>{setSavingTemplate(false);setTemplateName("");}}>Cancel</button>
              </div>
            </div>
          )}

          {templates.length === 0 && !savingTemplate && (
            <div style={{fontSize:13,color:"#c8bfb1",fontStyle:"italic"}}>No saved templates yet</div>
          )}

          {templates.map(tpl => {
            const tplDays = DAYS.filter(d => tpl.plan[d]);
            return (
              <div key={tpl.id} style={{padding:"8px 0",borderTop:"1px solid #f0ebe2",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:500}}>{tpl.name}</div>
                  <div style={{fontSize:11,color:"#a0937d"}}>{tplDays.length} nights — {tplDays.map(d => {
                    const te = tpl.plan[d];
                    if (te?.skip) return ({leftovers:"Leftovers",eating_out:"Eating Out",takeout:"Takeout"})[te.skip];
                    const v = getVar(te?.mealId, te?.varId);
                    return v ? v.name : "?";
                  }).join(", ")}</div>
                </div>
                <div style={{display:"flex",gap:4,flexShrink:0}}>
                  <button style={S.btn("#c4956a","#fff")} onClick={()=>loadTemplate(tpl)}>Use</button>
                  <button style={S.btn("#fce8e8","#c47070")} onClick={()=>deleteTemplate(tpl.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      </>}

      {/* ===== DINNERS ===== */}
      {tab === "meals" && <>
        {addingMeal ? (
          <div style={{...S.card,padding:14,marginBottom:12,border:"2px solid #c4956a"}}>
            <div style={{...S.lbl,marginBottom:8}}>New Dinner</div>
            <input style={{...S.inp,marginBottom:5}} placeholder='Dinner name (e.g. "Tacos")' value={newMealName} onChange={e=>setNewMealName(e.target.value)} autoFocus />
            <input style={{...S.inp,marginBottom:5}} placeholder='Variation (optional, e.g. "Beef Tacos")' value={newMealVarName} onChange={e=>setNewMealVarName(e.target.value)} />
            <textarea style={{...S.inp,marginBottom:6,resize:"none"}} rows={2} placeholder="Ingredients (comma separated)" value={newMealIng} onChange={e=>setNewMealIng(e.target.value)} />
            <div style={{display:"flex",gap:5}}>
              <button style={{...S.btn("#c4956a","#fff"),flex:1,padding:"7px"}} onClick={addMealFromTab}>Add Dinner</button>
              <button style={S.btn("#f0ebe2","#8b7355")} onClick={()=>{setAddingMeal(false);setNewMealName("");setNewMealVarName("");setNewMealIng("");}}>Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={()=>setAddingMeal(true)} style={{...S.btn("#c4956a","#fff"),width:"100%",padding:11,borderRadius:10,fontSize:13,marginBottom:12}}>
            + Add New Dinner
          </button>
        )}
        {sortedMeals.map(meal=>{
        const isUsed = usedMealIds.has(meal.id);
        return (
        <div key={meal.id} style={{...S.card,padding:14,marginBottom:10,opacity:isUsed?0.6:1}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            {editMealId===meal.id ? (
              <div style={{display:"flex",gap:4,flex:1}}>
                <input style={{...S.inp,flex:1}} value={editMealName} onChange={e=>setEditMealName(e.target.value)}/>
                <button style={S.btn("#c4956a","#fff")} onClick={()=>renameMeal(meal.id)}>Save</button>
                <button style={S.btn("#f0ebe2","#8b7355")} onClick={()=>setEditMealId(null)}>Cancel</button>
              </div>
            ) : (
              <>
                <div>
                  <span style={{fontSize:16,fontWeight:600}}>{meal.name}</span>
                  {isUsed && <span style={{fontSize:11,color:"#a0937d",marginLeft:8,fontWeight:500}}>on this week</span>}
                </div>
                <div style={{display:"flex",gap:3}}>
                  <button style={S.btn("#f0ebe2","#8b7355")} onClick={()=>{setEditMealId(meal.id);setEditMealName(meal.name);}}>Rename</button>
                  <button style={S.btn("#fce8e8","#c47070")} onClick={()=>deleteMeal(meal.id)}>Delete</button>
                </div>
              </>
            )}
          </div>
          {(meal.variations || []).map(v=>{
            const isEditing = editVarKey === meal.id + ":" + v.id;
            return isEditing ? (
              <div key={v.id} style={{padding:"8px 0",borderTop:"1px solid #f0ebe2"}}>
                <input style={{...S.inp,marginBottom:4,fontWeight:500}} value={editVarName} onChange={e=>setEditVarName(e.target.value)} />
                <textarea style={{...S.inp,marginBottom:5,resize:"none",fontSize:12}} rows={2} value={editVarIng} onChange={e=>setEditVarIng(e.target.value)} />
                <div style={{display:"flex",gap:4}}>
                  <button style={{...S.btn("#c4956a","#fff"),flex:1,padding:6}} onClick={()=>saveEditVar(meal.id,v.id)}>Save</button>
                  <button style={S.btn("#f0ebe2","#8b7355")} onClick={cancelEditVar}>Cancel</button>
                </div>
              </div>
            ) : (
              <div key={v.id} style={{padding:"7px 0",borderTop:"1px solid #f0ebe2",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1,cursor:"pointer"}} onClick={()=>startEditVar(meal.id,v)}>
                  <div style={{fontSize:14,fontWeight:500}}>{v.name}</div>
                  <div style={{fontSize:12,color:"#a0937d",lineHeight:1.4}}>{(v.ingredients || []).join(" · ")}</div>
                </div>
                <div style={{display:"flex",gap:3,marginLeft:8,flexShrink:0}}>
                  <button style={{...S.btn("#f0ebe2","#8b7355"),fontSize:11}} onClick={()=>startEditVar(meal.id,v)}>Edit</button>
                  {meal.variations.length>1 && <button style={{...S.btn("#fce8e8","#c47070"),fontSize:11}} onClick={()=>deleteVariation(meal.id,v.id)}>Remove</button>}
                </div>
              </div>
            );
          })}
          {addingVar===meal.id ? (
            <div style={{borderTop:"1px solid #f0ebe2",paddingTop:8,marginTop:4}}>
              <input style={{...S.inp,marginBottom:4}} placeholder="Variation name" value={newVarName} onChange={e=>setNewVarName(e.target.value)}/>
              <textarea style={{...S.inp,marginBottom:5,resize:"none"}} rows={2} placeholder="Ingredients (comma separated)" value={newVarIng} onChange={e=>setNewVarIng(e.target.value)}/>
              <div style={{display:"flex",gap:4}}>
                <button style={{...S.btn("#c4956a","#fff"),flex:1,padding:6}} onClick={()=>addVariation(meal.id)}>Add Variation</button>
                <button style={S.btn("#f0ebe2","#8b7355")} onClick={()=>{setAddingVar(null);setNewVarName("");setNewVarIng("");}}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setAddingVar(meal.id)} style={{display:"block",width:"100%",textAlign:"left",background:"transparent",border:"none",borderTop:"1px solid #f0ebe2",padding:"8px 0",fontSize:12,fontWeight:600,fontFamily:"inherit",color:"#c4956a",cursor:"pointer",marginTop:4}}>
              + Add variation
            </button>
          )}
        </div>
        );
      })}
      </>}

      {/* ===== GROCERIES ===== */}
      {tab === "groceries" && (planned===0 ? (
        <div style={{textAlign:"center",padding:"40px 20px",color:"#b8ad9c"}}>
          <div style={{fontSize:36,marginBottom:10}}>🛒</div><p>Plan some dinners first.</p>
        </div>
      ) : (
        <>
          <div style={{...S.card,marginBottom:10,padding:14}}>
            <div style={{...S.lbl,marginBottom:5}}>This week's meals</div>
            {DAYS.filter(d=>plan[d]).map(d=>{
              const e=plan[d];
              const skipLabels = { leftovers: "Leftovers", eating_out: "Eating Out", takeout: "Takeout" };
              if (e.skip) return <div key={d} style={{fontSize:13,lineHeight:1.8,color:"#b8ad9c",fontStyle:"italic"}}><span style={{color:"#a0937d",fontSize:11,fontWeight:600}}>{d.slice(0,3)}</span> {skipLabels[e.skip]}</div>;
              const v=getVar(e.mealId,e.varId);
              return v ? <div key={d} style={{fontSize:13,lineHeight:1.8}}><span style={{color:"#a0937d",fontSize:11,fontWeight:600}}>{d.slice(0,3)}</span> {v.name}</div> : null;
            })}
          </div>
          <div style={{...S.card,padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{...S.lbl,marginBottom:0}}>Grocery List — {grocery().filter(([i])=>!checkedItems[i]).length} of {grocery().length} remaining</div>
              <div style={{display:"flex",gap:4}}>
                {Object.keys(checkedItems).length > 0 && <button style={S.btn("#f0ebe2","#8b7355")} onClick={()=>setCheckedItems({})}>Uncheck All</button>}
                <button style={S.btn("#f0ebe2","#8b7355")} onClick={()=>{
                  const text=grocery().filter(([i])=>!checkedItems[i]).map(([i])=>i).join("\n");
                  navigator.clipboard.writeText(text).then(()=>flashCopied("grocery")).catch(()=>{});
                }}>{copied==="grocery"?"Copied!":"Copy"}</button>
              </div>
            </div>
            {grocery().filter(([i])=>!checkedItems[i]).map(([item,count])=>(
              <div key={item} onClick={()=>setCheckedItems(c=>({...c,[item]:true}))} style={{padding:"8px 0",borderBottom:"1px solid #f0ebe2",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:14,cursor:"pointer"}}>
                <span>{item}</span>
                {count>1 && <span style={{background:"#f0ebe2",borderRadius:5,padding:"1px 7px",fontSize:11,fontWeight:600,color:"#8b7355"}}>×{count}</span>}
              </div>
            ))}
            {grocery().filter(([i])=>checkedItems[i]).length > 0 && (
              <>
                <div style={{...S.lbl,marginTop:12,marginBottom:6,color:"#c8bfb1"}}>Got it</div>
                {grocery().filter(([i])=>checkedItems[i]).map(([item,count])=>(
                  <div key={item} onClick={()=>setCheckedItems(c=>{const n={...c};delete n[item];return n;})} style={{padding:"6px 0",borderBottom:"1px solid #f5f0e8",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:14,cursor:"pointer",textDecoration:"line-through",color:"#c8bfb1"}}>
                    <span>{item}</span>
                    {count>1 && <span style={{background:"#f5f0e8",borderRadius:5,padding:"1px 7px",fontSize:11,fontWeight:600,color:"#c8bfb1"}}>×{count}</span>}
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      ))}
      {/* Share */}
      <div style={{textAlign:"center",marginTop:24,marginBottom:12}}>
        <button style={{...S.btn("#f0ebe2","#8b7355"),fontSize:12}} onClick={()=>setShowShare(!showShare)}>
          {showShare ? "Hide" : "Share with others"}
        </button>
      </div>
      {showShare && (
        <div style={{...S.card,padding:14,marginBottom:14}}>
          <div style={{...S.lbl,marginBottom:6}}>Collaborate on your meal plan</div>
          <input
            readOnly
            value={shareUrl || ""}
            onFocus={e => e.target.select()}
            style={{...S.inp,fontSize:12,color:"#3d3427",marginBottom:6}}
          />
          <button style={{...S.btn("#c4956a","#fff"),width:"100%",padding:8}} onClick={()=>{
            if (shareUrl) navigator.clipboard.writeText(shareUrl).then(()=>flashCopied("share")).catch(()=>{});
          }}>{copied==="share"?"Copied!":"Copy Link"}</button>
          <p style={{fontSize:11,color:"#a0937d",marginTop:6,lineHeight:1.4}}>
            Anyone with this link can view and edit your meal plan.
          </p>

          <div style={{borderTop:"1px solid #f0ebe2",marginTop:10,paddingTop:10}}>
            <div style={{...S.lbl,marginBottom:6}}>Share the app</div>
            <input
              readOnly
              value={`${window.location.origin}${window.location.pathname}`}
              onFocus={e => e.target.select()}
              style={{...S.inp,fontSize:12,color:"#3d3427",marginBottom:6}}
            />
            <button style={{...S.btn("#f0ebe2","#8b7355"),width:"100%",padding:8}} onClick={()=>{
              navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}`).then(()=>flashCopied("applink")).catch(()=>{});
            }}>{copied==="applink"?"Copied!":"Copy Link"}</button>
            <p style={{fontSize:11,color:"#a0937d",marginTop:6,lineHeight:1.4}}>
              They'll get their own independent meal plan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
