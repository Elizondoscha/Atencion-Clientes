import { useState } from "react";

const SUPABASE_URL = "https://gymivghaccozapngkomt.supabase.co";
const SUPABASE_KEY = "sb_publishable_nxcFI3DuMYTq9WwYTD_hPg_4jQ2pFyy";

const TIPOS = ["Cambio de alcance", "Queja", "Solicitud info", "Urgente", "Material", "Técnico"];
const PROYECTOS = ["Torre Monterrey", "Residencial Pedregal", "Planta Industrial Norte", "Centro Comercial Sur", "Red Fibra Noreste", "Otro"];

const estilos = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #F7F3EE; min-height: 100vh; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes checkDraw { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
  .campo { animation: fadeUp .5s ease both; }
  .input-field { width: 100%; padding: 14px 18px; border: 2px solid #E8E0D5; border-radius: 10px; font-size: 15px; font-family: 'DM Sans', sans-serif; background: #FFFDF9; color: #2C2416; transition: border-color .2s, box-shadow .2s; outline: none; appearance: none; }
  .input-field:focus { border-color: #B5825A; box-shadow: 0 0 0 3px #B5825A22; }
  .input-field::placeholder { color: #B0A898; }
  .btn-submit { width: 100%; padding: 16px; background: #2C2416; color: #F7F3EE; border: none; border-radius: 10px; font-size: 16px; font-family: 'DM Sans', sans-serif; font-weight: 600; cursor: pointer; letter-spacing: .5px; transition: background .2s, transform .1s; }
  .btn-submit:hover { background: #B5825A; }
  .btn-submit:active { transform: scale(.98); }
  .btn-submit:disabled { background: #C8BFB5; cursor: not-allowed; }
`;

async function crearTicketEnSupabase(datos) {
  const ahora = new Date();
  const pad = n => String(n).padStart(2, "0");
  const id = `TCK-${ahora.getFullYear()}${pad(ahora.getMonth()+1)}${pad(ahora.getDate())}-${pad(ahora.getHours())}${pad(ahora.getMinutes())}${pad(ahora.getSeconds())}`;
  const slaHoras = datos.urgente ? 4 : 24;
  const fechaSLA = new Date(ahora.getTime() + slaHoras * 3600000).toISOString();

  const payload = {
    id,
    cliente: datos.nombre,
    email_cliente: datos.email,
    empresa: datos.empresa,
    proyecto: datos.proyecto,
    asunto: datos.asunto,
    descripcion: datos.descripcion,
    origen: "Forms",
    tipo_ticket: datos.tipo,
    prioridad: datos.urgente ? "Alta" : "Media",
    estatus: "Nuevo",
    fecha_creacion: ahora.toISOString(),
    fecha_sla: fechaSLA,
    ultima_actualizacion: ahora.toISOString(),
    sla_vencido: false,
    urgente: datos.urgente,
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/tick_header`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return id;
}

function Campo({ label, required, children, delay }) {
  return (
    <div className="campo" style={{ animationDelay: `${delay}s` }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#7A6A5A", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>
        {label} {required && <span style={{ color: "#B5825A" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Exito({ folio, onNuevo }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", animation: "fadeUp .6s ease" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#E8F5E9", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="19" stroke="#4CAF50" strokeWidth="2" />
          <path d="M12 20l6 6 10-12" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="100" strokeDashoffset="100" style={{ animation: "checkDraw .6s .3s ease forwards" }} />
        </svg>
      </div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "#2C2416", marginBottom: 12 }}>Solicitud Recibida</div>
      <div style={{ fontSize: 15, color: "#7A6A5A", lineHeight: 1.7, marginBottom: 8 }}>Hemos registrado su solicitud exitosamente.</div>
      <div style={{ display: "inline-block", background: "#F0EBE3", borderRadius: 8, padding: "10px 20px", fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: "#B5825A", marginBottom: 24 }}>
        Folio: {folio}
      </div>
      <div style={{ fontSize: 14, color: "#9A8A7A", marginBottom: 32, lineHeight: 1.6 }}>
        Recibirá una confirmación en su correo.<br />
        Nuestro equipo atenderá su solicitud en un máximo de <strong>24 horas hábiles</strong>.
      </div>
      <button onClick={onNuevo} style={{ padding: "12px 28px", background: "none", border: "2px solid #2C2416", borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#2C2416", transition: "all .2s" }}
        onMouseEnter={e => { e.target.style.background = "#2C2416"; e.target.style.color = "#F7F3EE"; }}
        onMouseLeave={e => { e.target.style.background = "none"; e.target.style.color = "#2C2416"; }}>
        Enviar otra solicitud
      </button>
    </div>
  );
}

export default function FormularioSCHA() {
  const [form, setForm] = useState({ nombre: "", email: "", empresa: "", proyecto: "", tipo: "", asunto: "", descripcion: "", urgente: false });
  const [enviando, setEnviando] = useState(false);
  const [folio, setFolio] = useState(null);
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState("");

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrores(e => ({ ...e, [k]: "" })); };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "Requerido";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Email inválido";
    if (!form.tipo) e.tipo = "Seleccione un tipo";
    if (!form.asunto.trim()) e.asunto = "Requerido";
    if (!form.descripcion.trim() || form.descripcion.length < 20) e.descripcion = "Mínimo 20 caracteres";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validar()) return;
    setEnviando(true);
    setErrorServidor("");
    try {
      const id = await crearTicketEnSupabase(form);
      setFolio(id);
    } catch (err) {
      setErrorServidor("Ocurrió un error al enviar. Por favor intente de nuevo.");
      console.error(err);
    } finally {
      setEnviando(false);
    }
  };

  const handleNuevo = () => { setForm({ nombre: "", email: "", empresa: "", proyecto: "", tipo: "", asunto: "", descripcion: "", urgente: false }); setFolio(null); setErrores({}); setErrorServidor(""); };

  return (
    <>
      <style>{estilos}</style>
      <div style={{ minHeight: "100vh", background: "#F7F3EE", display: "flex", flexDirection: "column" }}>

        <div style={{ background: "#2C2416", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: "#F7F3EE" }}>SCHA</span>
            <span style={{ fontSize: 11, color: "#B5825A", textTransform: "uppercase", letterSpacing: 2 }}>Mesa de Atención</span>
          </div>
          <span style={{ fontSize: 12, color: "#7A6A5A" }}>soporte@scha.mx</span>
        </div>

        <div style={{ background: "linear-gradient(135deg, #2C2416 0%, #4A3828 60%, #B5825A 100%)", padding: "52px 24px 64px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, #B5825A22 0%, transparent 50%), radial-gradient(circle at 80% 20%, #F7F3EE11 0%, transparent 40%)" }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "inline-block", background: "#B5825A33", border: "1px solid #B5825A66", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#D4A574", fontWeight: 600, letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" }}>Portal de Soporte</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900, color: "#F7F3EE", lineHeight: 1.2, marginBottom: 14 }}>¿En qué podemos<br />ayudarle hoy?</div>
            <div style={{ fontSize: 15, color: "#C8B89A", maxWidth: 420, margin: "0 auto", lineHeight: 1.7 }}>Envíe su solicitud y nuestro equipo le dará seguimiento en menos de 24 horas hábiles.</div>
          </div>
        </div>

        <div style={{ maxWidth: 600, width: "100%", margin: "-32px auto 48px", padding: "0 16px" }}>
          <div style={{ background: "#FFFDF9", borderRadius: 20, boxShadow: "0 8px 48px #2C241622, 0 2px 8px #2C241611", overflow: "hidden" }}>
            {folio ? <Exito folio={folio} onNuevo={handleNuevo} /> : (
              <div style={{ padding: "36px 36px 40px" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#2C2416", marginBottom: 28 }}>Nueva Solicitud</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Campo label="Nombre completo" required delay={.05}>
                      <input className="input-field" style={{ borderColor: errores.nombre ? "#E57373" : undefined }} placeholder="Juan Pérez" value={form.nombre} onChange={e => set("nombre", e.target.value)} />
                      {errores.nombre && <div style={{ fontSize: 11, color: "#E57373", marginTop: 4 }}>{errores.nombre}</div>}
                    </Campo>
                    <Campo label="Correo electrónico" required delay={.10}>
                      <input className="input-field" style={{ borderColor: errores.email ? "#E57373" : undefined }} type="email" placeholder="juan@empresa.mx" value={form.email} onChange={e => set("email", e.target.value)} />
                      {errores.email && <div style={{ fontSize: 11, color: "#E57373", marginTop: 4 }}>{errores.email}</div>}
                    </Campo>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Campo label="Empresa" delay={.15}>
                      <input className="input-field" placeholder="Constructora XYZ" value={form.empresa} onChange={e => set("empresa", e.target.value)} />
                    </Campo>
                    <Campo label="Proyecto" delay={.20}>
                      <select className="input-field" value={form.proyecto} onChange={e => set("proyecto", e.target.value)}>
                        <option value="">Seleccionar...</option>
                        {PROYECTOS.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </Campo>
                  </div>

                  <Campo label="Tipo de solicitud" required delay={.25}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                      {TIPOS.map(t => (
                        <button key={t} type="button" onClick={() => set("tipo", t)}
                          style={{ padding: "10px 8px", border: `2px solid ${form.tipo === t ? "#B5825A" : "#E8E0D5"}`, borderRadius: 8, background: form.tipo === t ? "#FDF5EE" : "#FFFDF9", color: form.tipo === t ? "#B5825A" : "#7A6A5A", fontSize: 12, fontWeight: form.tipo === t ? 700 : 500, cursor: "pointer", fontFamily: "inherit", transition: "all .15s", textAlign: "center" }}>
                          {t}
                        </button>
                      ))}
                    </div>
                    {errores.tipo && <div style={{ fontSize: 11, color: "#E57373", marginTop: 4 }}>{errores.tipo}</div>}
                  </Campo>

                  <Campo label="Asunto" required delay={.30}>
                    <input className="input-field" style={{ borderColor: errores.asunto ? "#E57373" : undefined }} placeholder="Resumen breve de su solicitud" value={form.asunto} onChange={e => set("asunto", e.target.value)} />
                    {errores.asunto && <div style={{ fontSize: 11, color: "#E57373", marginTop: 4 }}>{errores.asunto}</div>}
                  </Campo>

                  <Campo label="Descripción detallada" required delay={.35}>
                    <textarea className="input-field" style={{ borderColor: errores.descripcion ? "#E57373" : undefined, resize: "vertical", minHeight: 110, lineHeight: 1.6 }}
                      placeholder="Describa con detalle su solicitud..." value={form.descripcion} onChange={e => set("descripcion", e.target.value)} rows={4} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      {errores.descripcion ? <span style={{ fontSize: 11, color: "#E57373" }}>{errores.descripcion}</span> : <span />}
                      <span style={{ fontSize: 11, color: form.descripcion.length < 20 ? "#B0A898" : "#4CAF50" }}>{form.descripcion.length} / 20 mín.</span>
                    </div>
                  </Campo>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: form.urgente ? "#FFF3E0" : "#F7F3EE", borderRadius: 10, border: `2px solid ${form.urgente ? "#FF9800" : "#E8E0D5"}`, cursor: "pointer", transition: "all .2s" }}
                    onClick={() => set("urgente", !form.urgente)}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${form.urgente ? "#FF9800" : "#C8BFB5"}`, background: form.urgente ? "#FF9800" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }}>
                      {form.urgente && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: form.urgente ? "#E65100" : "#2C2416" }}>Marcar como urgente</div>
                      <div style={{ fontSize: 12, color: "#9A8A7A" }}>Impacta operaciones críticas — SLA reducido a 4 horas</div>
                    </div>
                  </div>

                  {errorServidor && (
                    <div style={{ background: "#FFEBEE", border: "1px solid #FFCDD2", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#C62828" }}>
                      ⚠️ {errorServidor}
                    </div>
                  )}

                  <button className="btn-submit" onClick={handleSubmit} disabled={enviando}>
                    {enviando ? (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                        <svg width="18" height="18" viewBox="0 0 18 18" style={{ animation: "spin 1s linear infinite" }}>
                          <circle cx="9" cy="9" r="7" stroke="#F7F3EE" strokeWidth="2" fill="none" strokeDasharray="32" strokeDashoffset="10" />
                        </svg>
                        Enviando solicitud...
                      </span>
                    ) : "Enviar Solicitud →"}
                  </button>
                </div>
                <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#B0A898", lineHeight: 1.6 }}>
                  Tiempo de respuesta: <strong style={{ color: "#7A6A5A" }}>máximo 24 horas hábiles</strong>.
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ background: "#2C2416", padding: "20px 24px", textAlign: "center", marginTop: "auto" }}>
          <span style={{ fontSize: 12, color: "#7A6A5A" }}>© 2024 SCHA · Mesa de Atención · soporte@scha.mx</span>
        </div>
      </div>
    </>
  );
}
