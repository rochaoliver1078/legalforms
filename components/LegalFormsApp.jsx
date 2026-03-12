"use client";
import { useState, useRef, useEffect, useCallback } from "react";

// ============================================================
// LEGALFORMS — JotForm-style Form Builder & Collector
// Integrated with Supabase + Resend for production
// ============================================================

const uid = () => "f" + Math.random().toString(36).slice(2, 8);

// --- API HELPERS ---
const api = {
  async getForms() {
    const res = await fetch("/api/forms");
    return res.ok ? res.json() : [];
  },
  async getForm(id) {
    const res = await fetch(`/api/forms?id=${id}`);
    return res.ok ? res.json() : null;
  },
  async createForm(data) {
    const res = await fetch("/api/forms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return res.ok ? res.json() : null;
  },
  async updateForm(data) {
    const res = await fetch("/api/forms", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return res.ok ? res.json() : null;
  },
  async deleteForm(id) {
    await fetch(`/api/forms?id=${id}`, { method: "DELETE" });
  },
  async submitForm(data) {
    const res = await fetch("/api/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return res.ok ? res.json() : null;
  },
  async uploadFile(file, formId, fieldId) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("form_id", formId);
    fd.append("field_id", fieldId);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    return res.ok ? res.json() : null;
  },
};
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

// --- ICONS ---
const Ic={
  Plus:({s=18})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash:({s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6m5 0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"/></svg>,
  Edit:({s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Eye:({s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Share:({s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Copy:({s=15})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Check:({s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X:({s=18})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Up:({s=14})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>,
  Down:({s=14})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Grip:()=><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" opacity=".4"><circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="19" r="2"/><circle cx="15" cy="19" r="2"/></svg>,
  Back:({s=18})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Send:({s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Link:({s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Mail:({s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,6 12,13 2,6"/></svg>,
  Wpp:({s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  Users:({s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Cond:({s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>,
  Search:({s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Folder:({s=18})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  File:({s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Settings:({s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

// --- FIELD TYPES ---
const FTYPES=[
  {type:"text",label:"Texto",icon:"Aa",cat:"basic"},
  {type:"textarea",label:"Texto longo",icon:"¶",cat:"basic"},
  {type:"email",label:"E-mail",icon:"@",cat:"basic"},
  {type:"phone",label:"Telefone",icon:"☎",cat:"basic"},
  {type:"number",label:"Número",icon:"#",cat:"basic"},
  {type:"date",label:"Data",icon:"📅",cat:"basic"},
  {type:"select",label:"Dropdown",icon:"▾",cat:"basic"},
  {type:"radio",label:"Múltipla escolha",icon:"◉",cat:"basic"},
  {type:"checkbox",label:"Checkbox",icon:"☑",cat:"basic"},
  {type:"file",label:"Upload",icon:"📎",cat:"basic"},
  {type:"cpf",label:"CPF",icon:"ID",cat:"legal"},
  {type:"cnpj",label:"CNPJ",icon:"§",cat:"legal"},
  {type:"cep",label:"CEP",icon:"📍",cat:"legal"},
  {type:"currency",label:"Valor R$",icon:"R$",cat:"legal"},
  {type:"heading",label:"Título / Seção",icon:"H",cat:"layout"},
  {type:"separator",label:"Separador",icon:"—",cat:"layout"},
  {type:"socios",label:"Bloco de Sócios",icon:"👥",cat:"smart"},
  {type:"alt_events",label:"Seletor de Alterações",icon:"⚡",cat:"smart"},
];

// Sócio sub-fields
const socioFields=n=>[
  {id:`s${n}_nome`,type:"text",label:"Nome completo",required:true,placeholder:"Conforme documento"},
  {id:`s${n}_cpf`,type:"cpf",label:"CPF",required:true,placeholder:"000.000.000-00"},
  {id:`s${n}_rg`,type:"text",label:"RG e órgão emissor",required:true},
  {id:`s${n}_nasc`,type:"date",label:"Data de nascimento",required:true},
  {id:`s${n}_civil`,type:"select",label:"Estado civil",required:true,options:["Solteiro(a)","Casado(a) — Comunhão parcial","Casado(a) — Comunhão universal","Casado(a) — Separação total","Divorciado(a)","Viúvo(a)","União Estável"]},
  {id:`s${n}_prof`,type:"text",label:"Profissão",required:true},
  {id:`s${n}_email`,type:"email",label:"E-mail",required:true},
  {id:`s${n}_tel`,type:"phone",label:"Celular",required:true,placeholder:"(00) 00000-0000"},
  {id:`s${n}_end`,type:"textarea",label:"Endereço completo",required:true,placeholder:"Rua, nº, bairro, cidade-UF, CEP"},
  {id:`s${n}_pct`,type:"text",label:"Participação no capital (%)",required:true},
  {id:`s${n}_admin`,type:"radio",label:"Será administrador?",required:true,options:["Sim","Não"]},
  {id:`s${n}_cert`,type:"radio",label:"Possui e-CPF?",required:true,options:["Sim","Não","Vou providenciar"]},
  {id:`s${n}_doc`,type:"file",label:"RG ou CNH",required:true},
];

const ALT_EV=[
  {id:"alt_end",label:"Alterar endereço",fields:[{id:"ae_cep",type:"cep",label:"Novo CEP",required:true},{id:"ae_logr",type:"text",label:"Logradouro",required:true},{id:"ae_num",type:"text",label:"Número",required:true},{id:"ae_bairro",type:"text",label:"Bairro",required:true},{id:"ae_cidade",type:"text",label:"Cidade",required:true},{id:"ae_uf",type:"select",label:"UF",required:true,options:UFS}]},
  {id:"alt_sin",label:"Entrada de sócio",fields:[{id:"asi_nome",type:"text",label:"Nome do novo sócio",required:true},{id:"asi_cpf",type:"cpf",label:"CPF",required:true},{id:"asi_qualif",type:"textarea",label:"Qualificação completa",required:true},{id:"asi_valor",type:"currency",label:"Valor (R$)",required:true},{id:"asi_doc",type:"file",label:"RG/CNH",required:true}]},
  {id:"alt_sout",label:"Saída de sócio",fields:[{id:"aso_nome",type:"text",label:"Sócio retirante",required:true},{id:"aso_cpf",type:"cpf",label:"CPF",required:true},{id:"aso_dest",type:"select",label:"Destino das quotas",required:true,options:["Transferir p/ remanescente","Transferir p/ terceiro","Reduzir capital"]}]},
  {id:"alt_cnae",label:"Alterar CNAE",fields:[{id:"ac_add",type:"textarea",label:"CNAEs a incluir",required:false},{id:"ac_rem",type:"textarea",label:"CNAEs a excluir",required:false}]},
  {id:"alt_cap",label:"Alterar capital",fields:[{id:"ak_atual",type:"currency",label:"Capital atual (R$)",required:true},{id:"ak_novo",type:"currency",label:"Novo capital (R$)",required:true},{id:"ak_dist",type:"textarea",label:"Nova distribuição",required:true}]},
  {id:"alt_razao",label:"Alterar razão social",fields:[{id:"ar_nova1",type:"text",label:"Nova razão (1ª opção)",required:true},{id:"ar_nova2",type:"text",label:"2ª opção",required:false}]},
  {id:"alt_admin",label:"Alterar administrador",fields:[{id:"aa_novo",type:"text",label:"Novo administrador",required:true},{id:"aa_cpf",type:"cpf",label:"CPF",required:true}]},
  {id:"alt_obj",label:"Alterar objeto social",fields:[{id:"ao_novo",type:"textarea",label:"Novo objeto social",required:true}]},
  {id:"alt_transf",label:"Transformação societária",fields:[{id:"at_de",type:"select",label:"Tipo atual",required:true,options:["MEI","EI","SLU","LTDA","S/A"]},{id:"at_para",type:"select",label:"Transformar para",required:true,options:["MEI","EI","SLU","LTDA","S/A"]}]},
];

// --- INITIAL FORMS now loaded from Supabase API ---

// =====================
// MAIN APP
// =====================
export default function App(){
  const [page,setPage]=useState("myforms"); // myforms|builder|fill|done
  const [forms,setForms]=useState([]);
  const [curId,setCurId]=useState(null);
  const [selField,setSelField]=useState(null);
  const [fillData,setFillData]=useState({});
  const [fillStep,setFillStep]=useState(0);
  const [nSocios,setNSocios]=useState(2);
  const [altEvts,setAltEvts]=useState([]);
  const [showShare,setShowShare]=useState(false);
  const [showCreate,setShowCreate]=useState(false);
  const [toastMsg,setToastMsg]=useState("");
  const [newName,setNewName]=useState("");
  const [search,setSearch]=useState("");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const fillRef=useRef(null);
  const saveTimer=useRef(null);

  const toast=m=>{setToastMsg(m);setTimeout(()=>setToastMsg(""),3e3)};
  const cur=forms.find(f=>f.id===curId);

  // Load forms from API on mount
  useEffect(()=>{
    api.getForms().then(data=>{
      setForms(Array.isArray(data)?data:[]);
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[]);

  const go=(pg,id=null)=>{setPage(pg);if(id)setCurId(id);setSelField(null);setFillData({});setFillStep(0);setNSocios(2);setAltEvts([])};

  // Auto-save form to API (debounced)
  const updForm=(id,u)=>{
    setForms(p=>p.map(f=>f.id===id?{...f,...u}:f));
    if(saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(()=>{
      const form=forms.find(f=>f.id===id);
      if(form) {
        setSaving(true);
        api.updateForm({id,...form,...u}).finally(()=>setSaving(false));
      }
    }, 800);
  };

  // Add field
  const addField=(type)=>{
    if(!cur)return;
    const ft=FTYPES.find(t=>t.type===type);
    const nf={id:uid(),type,label:ft?.label||type,required:false,placeholder:"",options:["select","radio"].includes(type)?["Opção 1","Opção 2"]:undefined};
    updForm(curId,{fields:[...cur.fields,nf]});
    setSelField(nf.id);
  };
  const updField=(fid,u)=>{if(!cur)return;updForm(curId,{fields:cur.fields.map(f=>f.id===fid?{...f,...u}:f)})};
  const delField=fid=>{if(!cur)return;updForm(curId,{fields:cur.fields.filter(f=>f.id!==fid)});if(selField===fid)setSelField(null)};
  const moveField=(fid,dir)=>{if(!cur)return;const i=cur.fields.findIndex(f=>f.id===fid);if(i<0)return;const j=i+dir;if(j<0||j>=cur.fields.length)return;const a=[...cur.fields];[a[i],a[j]]=[a[j],a[i]];updForm(curId,{fields:a})};

  // Create form via API
  const createForm=async()=>{
    const result=await api.createForm({name:newName||"Novo Formulário"});
    if(result){
      setForms(p=>[{...result,response_count:0},...p]);
      setCurId(result.id);setNewName("");setShowCreate(false);setPage("builder");
      toast("Formulário criado!");
    }
  };
  // Delete form via API
  const deleteForm=async(id)=>{
    await api.deleteForm(id);
    setForms(p=>p.filter(f=>f.id!==id));
    toast("Excluído");
  };

  // Fill: expand smart fields into real steps
  const getFillFields=()=>{
    if(!cur)return[];
    let all=[];
    cur.fields.forEach(f=>{
      if(f.type==="socios"){
        for(let i=1;i<=nSocios;i++) socioFields(i).forEach(sf=>all.push({...sf,_group:`Sócio ${i}${i===1?" (Admin)":""}`}));
      } else if(f.type==="alt_events"){
        altEvts.forEach(eid=>{
          const ev=ALT_EV.find(e=>e.id===eid);
          if(ev) ev.fields.forEach(ef=>all.push({...ef,_group:ev.label}));
        });
      } else {
        all.push(f);
      }
    });
    return all;
  };

  const fillFields=getFillFields();
  const fillable=fillFields.filter(f=>f.type!=="heading"&&f.type!=="separator"&&f.type!=="socios"&&f.type!=="alt_events");
  const curFillField=fillable[fillStep];
  const totalFillSteps=fillable.length;
  const pct=totalFillSteps>0?Math.round((fillStep/totalFillSteps)*100):0;

  // Check if we need socio picker or alt picker before the real fields
  const hasSocios=cur?.fields.some(f=>f.type==="socios");
  const hasAltEvts=cur?.fields.some(f=>f.type==="alt_events");
  const [showSocioPicker,setShowSocioPicker]=useState(false);
  const [showAltPicker,setShowAltPicker]=useState(false);

  const startFill=(id)=>{
    go("fill",id);
    const fm=forms.find(f=>f.id===id);
    const hs=fm?.fields.some(f=>f.type==="socios");
    const ha=fm?.fields.some(f=>f.type==="alt_events");
    if(hs){setShowSocioPicker(true);setShowAltPicker(false)}
    else if(ha){setShowAltPicker(true);setShowSocioPicker(false)}
    else{setShowSocioPicker(false);setShowAltPicker(false)}
  };

  const confirmPicker=()=>{
    if(showSocioPicker){
      setShowSocioPicker(false);
      const ha2=cur?.fields.some(f=>f.type==="alt_events");
      if(ha2)setShowAltPicker(true);
    } else if(showAltPicker){
      setShowAltPicker(false);
    }
  };

  const appUrl=typeof window!=="undefined"?window.location.origin:"https://legalforms.vercel.app";
  const shareLink=`${appUrl}/f/${curId||"form"}`;
  const shareWpp=encodeURIComponent(`Olá! Preencha este formulário:\n📋 *${cur?.name||""}*\n🔗 ${shareLink}`);
  const shareMail=encodeURIComponent(`Olá!\n\nPreencha o formulário:\n📋 ${cur?.name||""}\n🔗 ${shareLink}\n\nObrigado!`);

  // ===== CSS =====
  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Circular+Std:wght@400;500;700&family=Nunito:wght@400;500;600;700;800&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    html,body,#root{font-family:'Nunito',system-ui,sans-serif;background:#f4f4f9;color:#1a1a2e;min-height:100vh;-webkit-font-smoothing:antialiased}

    /* TOPBAR - JotForm orange */
    .topbar{background:#FF6100;color:#fff;height:54px;display:flex;align-items:center;padding:0 20px;position:sticky;top:0;z-index:100;box-shadow:0 2px 8px rgba(255,97,0,.2)}
    .topbar-brand{font-size:18px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:8px;letter-spacing:-.3px}
    .topbar-center{flex:1;display:flex;justify-content:center}
    .topbar-input{background:rgba(255,255,255,.2);border:none;border-radius:8px;padding:7px 14px;color:#fff;font-size:14px;font-family:inherit;outline:none;min-width:250px;text-align:center;font-weight:600}
    .topbar-input::placeholder{color:rgba(255,255,255,.6)}
    .topbar-input:focus{background:rgba(255,255,255,.3)}
    .topbar-right{display:flex;align-items:center;gap:6px}
    .tb{padding:7px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-family:inherit;transition:background .12s}
    .tb:hover{background:rgba(255,255,255,.15)}
    .tb-fill{background:rgba(255,255,255,.2)}

    /* MY FORMS */
    .mf{max-width:1000px;margin:0 auto;padding:24px 20px}
    .mf-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px}
    .mf-header h2{font-size:22px;font-weight:800}
    .mf-search{position:relative;width:260px}
    .mf-search svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#999}
    .mf-search input{width:100%;padding:9px 12px 9px 34px;border:1px solid #ddd;border-radius:8px;font-size:14px;font-family:inherit;outline:none;background:#fff}
    .mf-search input:focus{border-color:#FF6100}

    /* FORM LIST */
    .fl{display:flex;flex-direction:column;gap:0;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;background:#fff}
    .fi{display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid #f0f0f0;transition:background .1s;cursor:pointer}
    .fi:last-child{border-bottom:none}
    .fi:hover{background:#fafafa}
    .fi-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
    .fi-info{flex:1;min-width:0}
    .fi-name{font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .fi-meta{font-size:12px;color:#888;margin-top:2px}
    .fi-actions{display:flex;gap:4px;opacity:0;transition:opacity .15s}
    .fi:hover .fi-actions{opacity:1}
    .fi-btn{width:32px;height:32px;border-radius:8px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#666;transition:all .12s}
    .fi-btn:hover{background:#f0f0f0;color:#FF6100}
    .fi-responses{background:#f0f0f0;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;color:#666;white-space:nowrap}

    /* BUILDER 3-col */
    .bld{display:flex;height:calc(100vh - 54px)}
    .bld-left{width:240px;border-right:1px solid #e8e8e8;overflow-y:auto;background:#fff;flex-shrink:0;padding:12px}
    .bld-center{flex:1;overflow-y:auto;background:#f4f4f9;padding:24px}
    .bld-right{width:280px;border-left:1px solid #e8e8e8;overflow-y:auto;background:#fff;flex-shrink:0;padding:16px}
    @media(max-width:900px){.bld-left{width:56px;padding:6px}.bld-left .ft-label,.bld-left .cat-title{display:none}.bld-right{width:240px}}
    @media(max-width:600px){.bld-right{display:none}.bld-left{width:48px}}

    .cat-title{font-size:10px;font-weight:800;color:#999;text-transform:uppercase;letter-spacing:.8px;padding:8px 4px 4px;margin-top:8px}
    .ft{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;transition:background .1s;border:none;background:none;width:100%;text-align:left;font-family:inherit;font-size:13px;font-weight:600;color:#555}
    .ft:hover{background:#fff3eb;color:#FF6100}
    .ft-ic{width:30px;height:30px;border-radius:8px;background:#f5f5fa;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#FF6100;flex-shrink:0;border:1px solid #eee}

    /* Builder field card */
    .bf{background:#fff;border:1px solid #e8e8e8;border-radius:10px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all .12s}
    .bf:hover{border-color:#ccc;box-shadow:0 2px 8px rgba(0,0,0,.04)}
    .bf.sel{border-color:#FF6100;box-shadow:0 0 0 2px rgba(255,97,0,.15)}
    .bf.heading{background:transparent;border:1px dashed #ddd}
    .bf .bf-grip{color:#ccc;flex-shrink:0;cursor:grab}
    .bf .bf-body{flex:1;min-width:0}
    .bf .bf-label{font-size:14px;font-weight:600}
    .bf .bf-type{font-size:11px;color:#aaa;margin-top:2px}
    .bf .bf-actions{display:flex;gap:2px;opacity:0;transition:opacity .12s}
    .bf:hover .bf-actions{opacity:1}
    .bf-abtn{width:28px;height:28px;border-radius:6px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#999;transition:all .1s}
    .bf-abtn:hover{background:#f5f5f5;color:#FF6100}
    .bf.smart{background:#fff8f0;border-color:#ffd6a0;border-style:dashed}
    .bf.smart .bf-label{color:#c06000}

    /* Properties panel */
    .prop-title{font-size:11px;font-weight:800;color:#999;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px}
    .pfg{margin-bottom:14px}
    .pfg label{font-size:12px;font-weight:700;color:#555;display:block;margin-bottom:4px}
    .pfg input,.pfg textarea,.pfg select{width:100%;padding:8px 10px;border:1px solid #ddd;border-radius:8px;font-size:13px;font-family:inherit;outline:none}
    .pfg input:focus,.pfg textarea:focus{border-color:#FF6100}
    .pfg textarea{min-height:60px;resize:vertical}
    .toggle{display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:600;color:#555}
    .toggle-track{width:36px;height:20px;border-radius:10px;background:#ddd;position:relative;transition:background .2s}
    .toggle-track.on{background:#FF6100}
    .toggle-track::after{content:'';position:absolute;width:16px;height:16px;border-radius:50%;background:#fff;top:2px;left:2px;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)}
    .toggle-track.on::after{transform:translateX(16px)}

    /* FILL - Card Mode */
    .fill-wrap{min-height:calc(100vh - 54px);display:flex;align-items:center;justify-content:center;padding:20px;background:linear-gradient(135deg,#FF6100 0%,#ff8a3d 50%,#ffb347 100%)}
    .fill-card{background:#fff;border-radius:20px;padding:36px;max-width:560px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.15);min-height:300px;display:flex;flex-direction:column}
    @media(max-width:600px){.fill-card{padding:24px;border-radius:14px;margin:0}}
    .fill-progress{display:flex;gap:3px;margin-bottom:20px}
    .fill-dot{flex:1;height:4px;border-radius:2px;background:#eee;transition:background .3s}
    .fill-dot.done{background:#FF6100}
    .fill-dot.now{background:#FF6100}
    .fill-label{font-size:22px;font-weight:800;color:#1a1a2e;margin-bottom:6px;line-height:1.3}
    .fill-sub{font-size:13px;color:#999;margin-bottom:20px}
    .fill-input{width:100%;padding:14px 16px;border:2px solid #eee;border-radius:12px;font-size:17px;font-family:inherit;outline:none;transition:border .15s;background:#fafafa;color:#1a1a2e}
    .fill-input:focus{border-color:#FF6100;background:#fff}
    .fill-input::placeholder{color:#ccc}
    .fill-ta{min-height:100px;resize:vertical}
    .fill-sel{font-size:17px;padding:14px 16px}
    .fill-radio{display:flex;flex-direction:column;gap:8px}
    .fill-ro{padding:14px 16px;border:2px solid #eee;border-radius:12px;cursor:pointer;font-size:16px;font-weight:600;transition:all .12s;display:flex;align-items:center;gap:12px}
    .fill-ro:hover{background:#fafafa}
    .fill-ro.on{border-color:#FF6100;background:#fff8f0}
    .fill-rod{width:20px;height:20px;border-radius:50%;border:2px solid #ddd;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .12s}
    .fill-ro.on .fill-rod{border-color:#FF6100;background:#FF6100}
    .fill-roi{width:8px;height:8px;border-radius:50%;background:#fff;opacity:0;transition:.12s}.fill-ro.on .fill-roi{opacity:1}
    .fill-file{border:2px dashed #ddd;border-radius:12px;padding:32px;text-align:center;color:#aaa;font-size:14px;cursor:pointer;transition:.15s}
    .fill-file:hover{border-color:#FF6100;color:#FF6100}
    .fill-nav{display:flex;gap:10px;margin-top:auto;padding-top:20px}
    .fill-btn{flex:1;padding:14px;border-radius:12px;border:none;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .12s;display:flex;align-items:center;justify-content:center;gap:8px}
    .fill-btn-back{background:#f0f0f0;color:#555}.fill-btn-back:hover{background:#e5e5e5}
    .fill-btn-next{background:#FF6100;color:#fff}.fill-btn-next:hover{background:#e55800}
    .fill-btn-send{background:#00B67A;color:#fff}.fill-btn-send:hover{background:#009966}
    .fill-group{font-size:12px;font-weight:700;color:#FF6100;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;display:flex;align-items:center;gap:6px}

    /* Socio / Alt pickers in fill */
    .picker{text-align:center}
    .picker-title{font-size:24px;font-weight:800;margin-bottom:8px}
    .picker-desc{font-size:14px;color:#888;margin-bottom:24px;line-height:1.5}
    .picker-counter{display:flex;align-items:center;justify-content:center;gap:24px;margin-bottom:20px}
    .picker-num{font-size:56px;font-weight:900;color:#FF6100;letter-spacing:-2px}
    .picker-btn{width:48px;height:48px;border-radius:50%;border:2px solid #ddd;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#666;transition:.15s;font-size:20px}
    .picker-btn:hover{border-color:#FF6100;color:#FF6100}
    .picker-btn:disabled{opacity:.3;cursor:default}
    .picker-quick{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:20px}
    .pq{padding:10px 18px;border-radius:10px;border:2px solid #eee;background:#fff;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;transition:.12s}
    .pq:hover{border-color:#FF6100}.pq.on{border-color:#FF6100;background:#fff8f0;color:#FF6100}
    .picker-evts{display:grid;grid-template-columns:1fr 1fr;gap:8px;text-align:left;margin-bottom:20px}
    @media(max-width:500px){.picker-evts{grid-template-columns:1fr}}
    .pe{display:flex;align-items:center;gap:10px;padding:12px 14px;border:2px solid #eee;border-radius:10px;cursor:pointer;font-size:14px;font-weight:600;transition:.12s}
    .pe:hover{background:#fafafa}.pe.on{border-color:#FF6100;background:#fff8f0;color:#c06000}
    .peb{width:22px;height:22px;border:2px solid #ddd;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:.12s}
    .pe.on .peb{background:#FF6100;border-color:#FF6100;color:#fff}

    /* Done page */
    .done-wrap{min-height:calc(100vh - 54px);display:flex;align-items:center;justify-content:center;padding:20px}
    .done-card{background:#fff;border-radius:20px;padding:48px 36px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.06);max-width:480px;width:100%}
    .done-icon{font-size:64px;margin-bottom:12px}
    .done-title{font-size:24px;font-weight:800;margin-bottom:8px}
    .done-desc{font-size:15px;color:#888;line-height:1.6;margin-bottom:24px}

    /* Modal */
    .mbg{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px;backdrop-filter:blur(3px)}
    .modal{background:#fff;border-radius:16px;width:100%;max-width:480px;box-shadow:0 20px 60px rgba(0,0,0,.15);overflow:hidden}
    .mhead{padding:18px 22px;border-bottom:1px solid #eee;display:flex;align-items:center;justify-content:space-between}
    .mhead h3{font-size:17px;font-weight:800}
    .mbody{padding:22px}
    .slink{display:flex;gap:8px;align-items:center;background:#f5f5fa;border-radius:10px;padding:10px 14px;font-size:13px;color:#888;margin-bottom:14px}
    .slink span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:monospace}
    .sbtn-row{display:flex;gap:10px;flex-wrap:wrap}
    .sbtn{flex:1;padding:10px;border-radius:10px;border:none;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:7px;transition:.12s;text-decoration:none;color:#fff}
    .sbtn-wpp{background:#25D366}.sbtn-wpp:hover{background:#1eba59}
    .sbtn-mail{background:#FF6100}.sbtn-mail:hover{background:#e55800}
    .email-box{background:#f5f5fa;border-radius:10px;padding:14px;margin-top:16px}
    .email-box-t{font-size:13px;font-weight:700;margin-bottom:4px}
    .email-box-d{font-size:12px;color:#999;margin-bottom:8px}

    /* Btn reusable */
    .btn{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;border:1px solid #ddd;background:#fff;color:#333;font-size:13px;font-weight:600;cursor:pointer;transition:.12s;font-family:inherit}
    .btn:hover{background:#f5f5f5;border-color:#ccc}
    .btn-orange{background:#FF6100;border-color:#FF6100;color:#fff}.btn-orange:hover{background:#e55800}
    .btn-sm{padding:6px 10px;font-size:12px}

    /* Toast */
    .toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;z-index:999;box-shadow:0 8px 30px rgba(0,0,0,.2);animation:tin .3s}
    @keyframes tin{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
    ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#ddd;border-radius:3px}
  `;

  // ===== RENDER: MY FORMS =====
  const MyForms=()=>{
    const filtered=search?forms.filter(f=>f.name.toLowerCase().includes(search.toLowerCase())):forms;
    return <div className="mf">
      <div className="mf-header">
        <h2>Meus Formulários</h2>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <div className="mf-search"><Ic.Search/><input placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <button className="btn btn-orange" onClick={()=>setShowCreate(true)}><Ic.Plus s={16}/> Criar Formulário</button>
        </div>
      </div>
      <div className="fl">
        {filtered.map(f=><div key={f.id} className="fi" onClick={()=>go("builder",f.id)}>
          <div className="fi-icon" style={{background:f.color+"18",color:f.color}}>{f.icon}</div>
          <div className="fi-info">
            <div className="fi-name">{f.name}</div>
            <div className="fi-meta">Criado em {f.created_at?.split("T")[0]||""} · {(f.fields||[]).length} campos</div>
          </div>
          <div className="fi-responses">{f.response_count||0} respostas</div>
          <div className="fi-actions" onClick={e=>e.stopPropagation()}>
            <button className="fi-btn" title="Editar" onClick={()=>go("builder",f.id)}><Ic.Edit/></button>
            <button className="fi-btn" title="Preencher" onClick={()=>startFill(f.id)}><Ic.Eye/></button>
            <button className="fi-btn" title="Compartilhar" onClick={()=>{setCurId(f.id);setShowShare(true)}}><Ic.Share/></button>
            <button className="fi-btn" title="Excluir" onClick={()=>deleteForm(f.id)}><Ic.Trash/></button>
          </div>
        </div>)}
        {filtered.length===0&&<div style={{padding:40,textAlign:"center",color:"#999"}}>Nenhum formulário encontrado</div>}
      </div>
    </div>;
  };

  // ===== RENDER: BUILDER =====
  const Builder=()=>{
    if(!cur)return null;
    const sf=cur.fields.find(f=>f.id===selField);
    const cats=[{key:"basic",title:"Básicos"},{key:"legal",title:"Legalização"},{key:"layout",title:"Layout"},{key:"smart",title:"Inteligentes"}];

    return <div className="bld">
      {/* LEFT: Elements */}
      <div className="bld-left">
        {cats.map(c=><div key={c.key}>
          <div className="cat-title">{c.title}</div>
          {FTYPES.filter(t=>t.cat===c.key).map(t=><button key={t.type} className="ft" onClick={()=>addField(t.type)}>
            <div className="ft-ic">{t.icon}</div>
            <span className="ft-label">{t.label}</span>
          </button>)}
        </div>)}
      </div>

      {/* CENTER: Canvas */}
      <div className="bld-center">
        <div style={{maxWidth:640,margin:"0 auto"}}>
          {cur.fields.length===0&&<div style={{textAlign:"center",padding:60,color:"#bbb"}}>
            <div style={{fontSize:40,marginBottom:12}}>📝</div>
            <div style={{fontSize:16,fontWeight:700}}>Adicione campos pela barra lateral</div>
          </div>}
          {cur.fields.map(f=>{
            const isSmart=f.type==="socios"||f.type==="alt_events";
            const isH=f.type==="heading"||f.type==="separator";
            return <div key={f.id} className={`bf ${selField===f.id?"sel":""} ${isH?"heading":""} ${isSmart?"smart":""}`} onClick={()=>setSelField(f.id)}>
              <div className="bf-grip"><Ic.Grip/></div>
              <div className="bf-body">
                <div className="bf-label">{f.label}{f.required&&<span style={{color:"#e53",marginLeft:4}}>*</span>}</div>
                {!isH&&!isSmart&&<div className="bf-type">{FTYPES.find(t=>t.type===f.type)?.label||f.type}</div>}
                {isSmart&&<div className="bf-type" style={{color:"#c06000"}}>⚡ Campo inteligente — expande automaticamente no preenchimento</div>}
              </div>
              <div className="bf-actions">
                <button className="bf-abtn" onClick={e=>{e.stopPropagation();moveField(f.id,-1)}}><Ic.Up/></button>
                <button className="bf-abtn" onClick={e=>{e.stopPropagation();moveField(f.id,1)}}><Ic.Down/></button>
                <button className="bf-abtn" onClick={e=>{e.stopPropagation();delField(f.id)}} style={{color:"#e53"}}><Ic.Trash s={14}/></button>
              </div>
            </div>;
          })}
        </div>
      </div>

      {/* RIGHT: Properties */}
      <div className="bld-right">
        {sf?<>
          <div className="prop-title">Propriedades</div>
          <div className="pfg"><label>Rótulo</label><input value={sf.label} onChange={e=>updField(sf.id,{label:e.target.value})}/></div>
          {sf.type!=="heading"&&sf.type!=="separator"&&sf.type!=="socios"&&sf.type!=="alt_events"&&<>
            <div className="pfg"><label>Placeholder</label><input value={sf.placeholder||""} onChange={e=>updField(sf.id,{placeholder:e.target.value})}/></div>
            <div className="pfg"><div className="toggle" onClick={()=>updField(sf.id,{required:!sf.required})}><div className={`toggle-track ${sf.required?"on":""}`}/> Obrigatório</div></div>
          </>}
          {(sf.type==="select"||sf.type==="radio")&&<div className="pfg"><label>Opções (uma por linha)</label><textarea value={(sf.options||[]).join("\n")} onChange={e=>updField(sf.id,{options:e.target.value.split("\n")})}/></div>}
          <div style={{marginTop:16}}><button className="btn btn-sm" style={{color:"#e53"}} onClick={()=>delField(sf.id)}><Ic.Trash s={14}/> Remover</button></div>
        </>:<div style={{textAlign:"center",padding:40,color:"#bbb",fontSize:13}}>Selecione um campo para editar</div>}
      </div>
    </div>;
  };

  // ===== RENDER: FILL (Card mode) =====
  const Fill=()=>{
    if(!cur)return null;

    // Pickers
    if(showSocioPicker) return <div className="fill-wrap"><div className="fill-card"><div className="picker">
      <div style={{fontSize:40,marginBottom:10}}>👥</div>
      <div className="picker-title">Quantos sócios?</div>
      <div className="picker-desc">Para cada sócio será exibida uma ficha completa de dados.</div>
      <div className="picker-counter">
        <button className="picker-btn" disabled={nSocios<=1} onClick={()=>setNSocios(s=>Math.max(1,s-1))}>−</button>
        <div className="picker-num">{nSocios}</div>
        <button className="picker-btn" onClick={()=>setNSocios(s=>Math.min(10,s+1))}>+</button>
      </div>
      <div className="picker-quick">{[1,2,3,4,5,6].map(n=><button key={n} className={`pq ${nSocios===n?"on":""}`} onClick={()=>setNSocios(n)}>{n}</button>)}</div>
      <button className="fill-btn fill-btn-next" style={{width:"100%"}} onClick={confirmPicker}>Continuar →</button>
    </div></div></div>;

    if(showAltPicker) return <div className="fill-wrap"><div className="fill-card"><div className="picker">
      <div style={{fontSize:40,marginBottom:10}}>⚡</div>
      <div className="picker-title">Quais alterações?</div>
      <div className="picker-desc">Marque todas que se aplicam. Campos específicos aparecerão para cada uma.</div>
      <div className="picker-evts">{ALT_EV.map(ev=>{const on=altEvts.includes(ev.id);return <div key={ev.id} className={`pe ${on?"on":""}`} onClick={()=>setAltEvts(p=>on?p.filter(x=>x!==ev.id):[...p,ev.id])}><div className="peb">{on&&<Ic.Check s={12}/>}</div>{ev.label}</div>})}</div>
      {altEvts.length>0&&<p style={{fontSize:13,color:"#00B67A",fontWeight:700,marginBottom:14}}>✓ {altEvts.length} selecionada{altEvts.length>1?"s":""}</p>}
      <button className="fill-btn fill-btn-next" style={{width:"100%"}} onClick={confirmPicker}>Continuar →</button>
    </div></div></div>;

    // Card fill
    if(!curFillField) return <div className="fill-wrap"><div className="fill-card" style={{textAlign:"center",padding:40}}><p>Este formulário não tem campos preenchíveis.</p><button className="btn" onClick={()=>go("myforms")}>Voltar</button></div></div>;
    const v=fillData[curFillField.id]??"";
    const setV=val=>setFillData(p=>({...p,[curFillField.id]:val}));

    return <div className="fill-wrap" ref={fillRef}>
      <div className="fill-card">
        {/* Progress */}
        <div className="fill-progress">{fillable.map((_,i)=><div key={i} className={`fill-dot ${i<fillStep?"done":""} ${i===fillStep?"now":""}`}/>)}</div>

        {curFillField._group&&<div className="fill-group">📎 {curFillField._group}</div>}
        <div className="fill-label">{curFillField.label}{curFillField.required&&<span style={{color:"#e53"}}>*</span>}</div>
        <div className="fill-sub">Pergunta {fillStep+1} de {totalFillSteps}</div>

        {/* Input by type */}
        {curFillField.type==="textarea"&&<textarea className="fill-input fill-ta" value={v} onChange={e=>setV(e.target.value)} placeholder={curFillField.placeholder||"Digite aqui..."}/>}
        {curFillField.type==="select"&&<select className="fill-input fill-sel" value={v} onChange={e=>setV(e.target.value)}><option value="">Selecione...</option>{(curFillField.options||[]).map(o=><option key={o} value={o}>{o}</option>)}</select>}
        {curFillField.type==="radio"&&<div className="fill-radio">{(curFillField.options||[]).map(o=><div key={o} className={`fill-ro ${v===o?"on":""}`} onClick={()=>setV(o)}><div className="fill-rod"><div className="fill-roi"/></div>{o}</div>)}</div>}
        {curFillField.type==="file"&&<div className="fill-file">📎 Toque para anexar<br/><span style={{fontSize:12}}>PDF, JPG, PNG</span></div>}
        {!["textarea","select","radio","file"].includes(curFillField.type)&&<input className="fill-input" type={curFillField.type==="email"?"email":curFillField.type==="date"?"date":["number","currency"].includes(curFillField.type)?"number":"text"} value={v} onChange={e=>setV(e.target.value)} placeholder={curFillField.placeholder||"Digite aqui..."} inputMode={["phone","cpf","cnpj","cep","number","currency"].includes(curFillField.type)?"numeric":undefined} autoFocus/>}

        <div className="fill-nav">
          {fillStep>0&&<button className="fill-btn fill-btn-back" onClick={()=>setFillStep(s=>s-1)}><Ic.Back s={16}/> Voltar</button>}
          {fillStep===0&&<button className="fill-btn fill-btn-back" onClick={()=>go("myforms")}><Ic.Back s={16}/> Sair</button>}
          {fillStep<totalFillSteps-1&&<button className="fill-btn fill-btn-next" onClick={()=>setFillStep(s=>s+1)}>Continuar →</button>}
          {fillStep===totalFillSteps-1&&<button className="fill-btn fill-btn-send" onClick={async()=>{
            await api.submitForm({ form_id: curId, data: fillData, submitted_by: fillData.resp || fillData.nome || fillData.resp_alt || null });
            go("done",curId);toast("Enviado com sucesso!");
          }}><Ic.Check/> Enviar</button>}
        </div>
      </div>
    </div>;
  };

  const Done=()=><div className="done-wrap"><div className="done-card">
    <div className="done-icon">✅</div>
    <div className="done-title">Formulário enviado!</div>
    <div className="done-desc">Os dados foram coletados com sucesso e serão enviados para a equipe.</div>
    <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
      <button className="btn btn-orange" onClick={()=>go("myforms")}>Meus Formulários</button>
      <button className="btn" onClick={()=>startFill(curId)}>Preencher outro</button>
    </div>
  </div></div>;

  // ===== MODALS =====
  const ShareModal=()=>showShare?<div className="mbg" onClick={()=>setShowShare(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
    <div className="mhead"><h3>Compartilhar</h3><button className="fi-btn" onClick={()=>setShowShare(false)}><Ic.X/></button></div>
    <div className="mbody">
      <div className="slink"><Ic.Link/><span>{shareLink}</span><button className="btn btn-sm" onClick={()=>{navigator.clipboard?.writeText(shareLink);toast("Copiado!")}}><Ic.Copy/></button></div>
      <div className="sbtn-row">
        <a href={`https://wa.me/?text=${shareWpp}`} target="_blank" rel="noopener" className="sbtn sbtn-wpp"><Ic.Wpp/> WhatsApp</a>
        <a href={`mailto:?subject=${encodeURIComponent(cur?.name||"")}&body=${shareMail}`} target="_blank" rel="noopener" className="sbtn sbtn-mail"><Ic.Mail/> E-mail</a>
      </div>
      <div className="email-box">
        <div className="email-box-t">📬 Notificações de resposta</div>
        <div className="email-box-d">E-mails que receberão as respostas:</div>
        <input style={{width:"100%",padding:"8px 10px",border:"1px solid #ddd",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none"}} value={(cur?.emails||[]).join(", ")} onChange={e=>updForm(curId,{emails:e.target.value.split(",").map(x=>x.trim()).filter(Boolean)})} placeholder="email@empresa.com, outro@empresa.com"/>
      </div>
    </div>
  </div></div>:null;

  const CreateModal=()=>showCreate?<div className="mbg" onClick={()=>setShowCreate(false)}><div className="modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
    <div className="mhead"><h3>Novo Formulário</h3><button className="fi-btn" onClick={()=>setShowCreate(false)}><Ic.X/></button></div>
    <div className="mbody">
      <div className="pfg"><label>Nome do formulário</label><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Ex: Abertura de empresa" autoFocus/></div>
      <button className="btn btn-orange" style={{width:"100%",justifyContent:"center"}} onClick={createForm}>Criar</button>
    </div>
  </div></div>:null;

  // ===== TOPBAR =====
  const Topbar=()=><div className="topbar">
    <div className="topbar-brand" onClick={()=>go("myforms")}>📋 LegalForms</div>
    <div className="topbar-center">
      {page==="builder"&&cur&&<input className="topbar-input" value={cur.name} onChange={e=>updForm(curId,{name:e.target.value})}/>}
    </div>
    <div className="topbar-right">
      {page==="builder"&&<>
        <button className="tb" onClick={()=>startFill(curId)}><Ic.Eye s={14}/> Preencher</button>
        <button className="tb" onClick={()=>{setShowShare(true)}}><Ic.Share s={14}/> Compartilhar</button>
      </>}
      {page==="myforms"&&<button className="tb tb-fill" onClick={()=>setShowCreate(true)}><Ic.Plus s={14}/> Criar</button>}
      {(page==="fill"||page==="done")&&<button className="tb" onClick={()=>go("myforms")}><Ic.Back s={14}/> Meus Formulários</button>}
    </div>
  </div>;

  return <>
    <style>{css}</style>
    <Topbar/>
    {page==="myforms"&&<MyForms/>}
    {page==="builder"&&<Builder/>}
    {page==="fill"&&<Fill/>}
    {page==="done"&&<Done/>}
    <ShareModal/><CreateModal/>
    {toastMsg&&<div className="toast">{toastMsg}</div>}
  </>;
}
