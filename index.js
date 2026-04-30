import { useState, useMemo, useEffect } from "react";

const SUPABASE_URL = "https://gymivghaccozapngkomt.supabase.co";
const SUPABASE_KEY = "sb_publishable_nxcFI3DuMYTq9WwYTD_hPg_4jQ2pFyy";

const api = async (path, method = "GET", body = null) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": method === "POST" ? "return=representation" : "return=minimal",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(await res.text());
  if (method === "GET") return res.json();
  return res.status === 204 ? null : res.json();
};

const COLORES = { azul: "#0F3460", azulClaro: "#1A4A7A", acento: "#E94560", verde: "#00B894", amarillo: "#FDCB6E", gris: "#8892A4", grisBg: "#F0F4F8", blanco: "#FFFFFF", texto: "#1A2332" };
const PRIORIDAD_COLORES = { Alta: "#E94560", Media: "#FDCB6E", Baja: "#00B894" };
const ESTATUS_COLORES = { Nuevo: "#6C63FF", Asignado: "#0984E3", "En Proceso": "#00B894", "En Espera Cliente": "#FDCB6E", Resuelto: "#636E72", Cerrado: "#2D3436" };
const ESTATUSES = ["Nuevo", "Asignado", "En Proceso", "En Espera Cliente", "Resuelto", "Cerrado"];
const PRIORIDADES = ["Alta", "Media", "Baja"];
const RESPONSABLES = ["Ing. García", "Ing. Martínez", "Arq. López", "Lic. Ramírez", "Ing. Sánchez"];

function Badge({ color, children }) {
  return <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{children}</span>;
}

function KPICard({ label, value, color, sub }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 2px 12px #0F346015", borderLeft: `4px solid ${color}`, minWidth: 140 }}>
      <div style={{ fontSize: 32, fontWeight: 800, color, fontFamily: "Georgia, serif", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: COLORES.gris, marginTop: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: COLORES.gris, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 64 }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${COLORES.grisBg}`, borderTop: `3px solid ${COLORES.azul}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function DetalleTicket({ ticket, onClose, onUpdate }) {
  const [tab, setTab] = useState("info");
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [tipoComentario, setTipoComentario] = useState("Interno");
  const [edits, setEdits] = useState({ prioridad: ticket.prioridad, estatus: ticket.estatus, responsable: ticket.responsable || "" });
  const [guardando, setGuardando] = useState(false);
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    api(`tick_comentarios?ticket_id=eq.${ticket.id}&order=fecha_comentario.asc`).then(setComentarios).catch(console.error);
  }, [ticket.id]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const ahora = new Date().toISOString();
      const cambios = { prioridad: edits.prioridad, estatus: edits.estatus, responsable: edits.responsable, ultima_actualizacion: ahora };
      if (edits.responsable && !ticket.responsable) cambios.estatus = "Asignado";
      if (edits.estatus === "En Proceso" && !ticket.fecha_primera_respuesta) cambios.fecha_primera_respuesta = ahora;
      const slaH = edits.prioridad === "Alta" ? 4 : edits.prioridad === "Media" ? 24 : 48;
      if (edits.prioridad !== ticket.prioridad) cambios.fecha_sla = new Date(Date.now() + slaH * 3600000).toISOString();
      await api(`tick_header?id=eq.${ticket.id}`, "PATCH", cambios);
      onUpdate({ ...ticket, ...cambios });
      showToast("✅ Cambios guardados");
    } catch (e) { showToast("❌ Error al guardar"); }
    setGuardando(false);
  };

  const handleComentario = async () => {
    if (!nuevoComentario.trim()) return;
    setEnviandoComentario(true);
    try {
      const nuevo = { ticket_id: ticket.id, comentario: nuevoComentario, autor: "Mesa de Atención", tipo_comentario: tipoComentario };
      await api("tick_comentarios", "POST", nuevo);
      const ahora = new Date().toISOString();
      setComentarios(c => [...c, { ...nuevo, fecha_comentario: ahora }]);
      await api(`tick_header?id=eq.${ticket.id}`, "PATCH", { ultima_actualizacion: ahora });
      setNuevoComentario("");
      showToast("✅ Comentario agregado");
    } catch (e) { showToast("❌ Error al agregar comentario"); }
    setEnviandoComentario(false);
  };

  const tabStyle = (t) => ({ padding: "10px 16px", borderBottom: tab === t ? `3px solid ${COLORES.azul}` : "3px solid transparent", cursor: "pointer", fontWeight: tab === t ? 700 : 500, color: tab === t ? COLORES.azul : COLORES.gris, background: "none", border: "none", borderBottom: tab === t ? `3px solid ${COLORES.azul}` : "3px solid transparent", fontFamily: "inherit", fontSize: 14 });

  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000055", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {toast && <div style={{ position: "fixed", top: 20, right: 20, background: "#2D3436", color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 200, boxShadow: "0 4px 20px #00000033" }}>{toast}</div>}
      <div style={{ background: "#F8FAFC", borderRadius: 16, width: 680, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 80px #00000044" }}>
        <div style={{ background: COLORES.azul, padding: "24px 28px", borderRadius: "16px 16px 0 0", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7, fontFamily: "monospace", marginBottom: 4 }}>{ticket.id}</div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "Georgia, serif" }}>{ticket.asunto}</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{ticket.cliente} {ticket.proyecto ? `· ${ticket.proyecto}` : ""}</div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 8, width: 32, height: 32, fontSize: 18, cursor: "pointer" }}>×</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <Badge color={PRIORIDAD_COLORES[ticket.prioridad]}>{ticket.prioridad}</Badge>
            <Badge color={ESTATUS_COLORES[ticket.estatus]}>{ticket.estatus}</Badge>
            <Badge color="#FFFFFF88">{ticket.origen}</Badge>
            {ticket.sla_vencido && <Badge color={COLORES.acento}>⚠ SLA Vencido</Badge>}
            {ticket.urgente && <Badge color="#FF9800">🔥 Urgente</Badge>}
          </div>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid #E2E8F0", background: "#fff", padding: "0 16px" }}>
          {["info", "acciones", "comentarios"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={tabStyle(t)}>
              {t === "info" ? "Información" : t === "acciones" ? "Acciones" : `Comentarios (${comentarios.length})`}
            </button>
          ))}
        </div>

        <div style={{ padding: 24 }}>
          {tab === "info" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[["Cliente", ticket.cliente], ["Email", ticket.email_cliente], ["Empresa", ticket.empresa || "—"], ["Proyecto", ticket.proyecto || "—"], ["Tipo", ticket.tipo_ticket], ["Origen", ticket.origen], ["Responsable", ticket.responsable || "Sin asignar"], ["Creación", ticket.fecha_creacion?.slice(0,16).replace("T"," ")], ["SLA", ticket.fecha_sla?.slice(0,16).replace("T"," ")], ["Primera Respuesta", ticket.fecha_primera_respuesta ? ticket.fecha_primera_respuesta.slice(0,16).replace("T"," ") : "—"]].map(([k, v]) => (
                <div key={k} style={{ background: "#fff", padding: "12px 16px", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: COLORES.gris, textTransform: "uppercase", letterSpacing: 1 }}>{k}</div>
                  <div style={{ fontSize: 14, color: COLORES.texto, marginTop: 4, fontWeight: 500 }}>{v}</div>
                </div>
              ))}
              <div style={{ gridColumn: "1/-1", background: "#fff", padding: "12px 16px", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: COLORES.gris, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Descripción</div>
                <div style={{ fontSize: 14, color: COLORES.texto, lineHeight: 1.6 }}>{ticket.descripcion}</div>
              </div>
            </div>
          )}

          {tab === "acciones" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#fff", padding: 20, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                <div style={{ fontWeight: 700, color: COLORES.azul, marginBottom: 14, fontSize: 14 }}>Modificar Ticket</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  {[["Prioridad", "prioridad", PRIORIDADES], ["Estatus", "estatus", ESTATUSES]].map(([lbl, key, opts]) => (
                    <div key={key}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: COLORES.gris, marginBottom: 6, textTransform: "uppercase" }}>{lbl}</div>
                      <select value={edits[key]} onChange={e => setEdits(s => ({ ...s, [key]: e.target.value }))}
                        style={{ padding: "8px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", background: "#fff", width: "100%" }}>
                        {opts.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: COLORES.gris, marginBottom: 6, textTransform: "uppercase" }}>Responsable</div>
                    <select value={edits.responsable} onChange={e => setEdits(s => ({ ...s, responsable: e.target.value }))}
                      style={{ padding: "8px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", background: "#fff", width: "100%" }}>
                      <option value="">Sin asignar</option>
                      {RESPONSABLES.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={handleGuardar} disabled={guardando}
                  style={{ marginTop: 16, padding: "10px 24px", background: guardando ? COLORES.gris : COLORES.azul, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: guardando ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  {guardando ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </div>
          )}

          {tab === "comentarios" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {comentarios.length === 0 && <div style={{ textAlign: "center", color: COLORES.gris, padding: 32 }}>Sin comentarios aún</div>}
              {comentarios.map((c, i) => (
                <div key={i} style={{ background: c.tipo_comentario === "Interno" ? "#EEF2FF" : "#F0FDF4", borderRadius: 10, padding: "12px 16px", borderLeft: `3px solid ${c.tipo_comentario === "Interno" ? "#6C63FF" : COLORES.verde}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{c.autor}</span>
                    <span style={{ fontSize: 11, color: COLORES.gris }}>{c.fecha_comentario?.slice(0,16).replace("T"," ")} · <Badge color={c.tipo_comentario === "Interno" ? "#6C63FF" : COLORES.verde}>{c.tipo_comentario}</Badge></span>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6 }}>{c.comentario}</div>
                </div>
              ))}
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: 16, marginTop: 8 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  {["Interno", "Cliente"].map(t => (
                    <button key={t} onClick={() => setTipoComentario(t)}
                      style={{ padding: "6px 14px", border: `2px solid ${tipoComentario === t ? COLORES.azul : "#E2E8F0"}`, borderRadius: 20, background: tipoComentario === t ? COLORES.azul : "#fff", color: tipoComentario === t ? "#fff" : COLORES.gris, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" }}>
                      {t}
                    </button>
                  ))}
                </div>
                <textarea value={nuevoComentario} onChange={e => setNuevoComentario(e.target.value)} placeholder={tipoComentario === "Interno" ? "Nota interna..." : "Mensaje para el cliente..."} rows={3}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 14, fontFamily: "inherit", resize: "none", boxSizing: "border-box", outline: "none" }} />
                <button onClick={handleComentario} disabled={enviandoComentario}
                  style={{ marginTop: 8, padding: "9px 20px", background: enviandoComentario ? COLORES.gris : COLORES.verde, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: enviandoComentario ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  {enviandoComentario ? "Enviando..." : "Agregar Comentario"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MesaAtencion() {
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pantalla, setPantalla] = useState("dashboard");
  const [filtro, setFiltro] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  const cargarTickets = async () => {
    try {
      const data = await api("tick_header?order=fecha_creacion.desc");
      setTickets(data);
      setUltimaActualizacion(new Date());
    } catch (e) { console.error("Error cargando tickets:", e); }
    setCargando(false);
  };

  useEffect(() => {
    cargarTickets();
    const interval = setInterval(cargarTickets, 30000);
    return () => clearInterval(interval);
  }, []);

  const kpis = useMemo(() => {
    const abiertos = tickets.filter(t => !["Resuelto", "Cerrado"].includes(t.estatus)).length;
    const vencidos = tickets.filter(t => t.sla_vencido).length;
    const nuevos = tickets.filter(t => t.estatus === "Nuevo").length;
    const cerrados = tickets.filter(t => ["Resuelto", "Cerrado"].includes(t.estatus)).length;
    const cumplidos = tickets.filter(t => ["Resuelto", "Cerrado"].includes(t.estatus) && !t.sla_vencido).length;
    const pctSLA = cerrados > 0 ? Math.round((cumplidos / cerrados) * 100) : 100;
    return { abiertos, vencidos, nuevos, cerrados, pctSLA };
  }, [tickets]);

  const ticketsFiltrados = useMemo(() => {
    let base = tickets;
    if (filtro === "Vencidos SLA") base = base.filter(t => t.sla_vencido);
    else if (filtro !== "Todos") base = base.filter(t => t.estatus === filtro || t.prioridad === filtro);
    if (busqueda) base = base.filter(t => t.id?.includes(busqueda) || t.cliente?.toLowerCase().includes(busqueda.toLowerCase()) || t.asunto?.toLowerCase().includes(busqueda.toLowerCase()));
    return base;
  }, [tickets, filtro, busqueda]);

  const updateTicket = (t) => { setTickets(ts => ts.map(x => x.id === t.id ? t : x)); setTicketSeleccionado(t); };

  const navBtn = (label, screen) => (
    <button onClick={() => setPantalla(screen)}
      style={{ padding: "10px 20px", background: pantalla === screen ? "rgba(255,255,255,0.15)" : "transparent", border: "none", color: "#fff", borderRadius: 8, cursor: "pointer", fontWeight: pantalla === screen ? 700 : 400, fontFamily: "inherit", fontSize: 14 }}>
      {label}
    </button>
  );

  const filtros = ["Todos", "Nuevo", "En Proceso", "Vencidos SLA", "Alta", "Media", "Baja"];

  return (
    <div style={{ fontFamily: "'Trebuchet MS', sans-serif", background: COLORES.grisBg, minHeight: "100vh", color: COLORES.texto }}>
      <div style={{ background: COLORES.azul, padding: "0 24px", display: "flex", alignItems: "center", gap: 8, height: 56, boxShadow: "0 2px 12px #00000033" }}>
        <div style={{ marginRight: 24 }}>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 800, color: "#fff" }}>SCHA</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginLeft: 8, textTransform: "uppercase", letterSpacing: 2 }}>Mesa de Atención</span>
        </div>
        {navBtn("📊 Dashboard", "dashboard")}
        {navBtn("🎫 Tickets", "bandeja")}
        {navBtn("📈 KPIs", "kpis")}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          {ultimaActualizacion && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>↻ {ultimaActualizacion.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</span>}
          <button onClick={cargarTickets} style={{ padding: "6px 14px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>↻ Actualizar</button>
        </div>
      </div>

      <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
        {cargando ? <Spinner /> : (
          <>
            {pantalla === "dashboard" && (
              <>
                <div style={{ fontSize: 22, fontWeight: 800, color: COLORES.azul, fontFamily: "Georgia, serif", marginBottom: 20 }}>Dashboard General</div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
                  <KPICard label="Tickets Abiertos" value={kpis.abiertos} color={COLORES.azulClaro} />
                  <KPICard label="Vencidos SLA" value={kpis.vencidos} color={COLORES.acento} />
                  <KPICard label="Tickets Nuevos" value={kpis.nuevos} color="#6C63FF" />
                  <KPICard label="Resueltos/Cerrados" value={kpis.cerrados} color={COLORES.verde} />
                  <KPICard label="% SLA Cumplido" value={`${kpis.pctSLA}%`} color={kpis.pctSLA >= 80 ? COLORES.verde : COLORES.acento} sub="Sobre tickets cerrados" />
                </div>
                {tickets.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 64, background: "#fff", borderRadius: 16, color: COLORES.gris }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Sin tickets aún</div>
                    <div style={{ fontSize: 14 }}>Los tickets del formulario aparecerán aquí automáticamente</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: COLORES.azul, marginBottom: 4 }}>Tickets Recientes</div>
                    {tickets.slice(0, 6).map(t => (
                      <div key={t.id} onClick={() => setTicketSeleccionado(t)}
                        style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 6px #0F346010", cursor: "pointer", border: t.sla_vencido ? `1.5px solid ${COLORES.acento}44` : "1.5px solid transparent" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: COLORES.gris, fontFamily: "monospace" }}>{t.id}</div>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{t.asunto}</div>
                          <div style={{ fontSize: 12, color: COLORES.gris }}>{t.cliente}{t.proyecto ? ` · ${t.proyecto}` : ""}</div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <Badge color={PRIORIDAD_COLORES[t.prioridad]}>{t.prioridad}</Badge>
                          <Badge color={ESTATUS_COLORES[t.estatus]}>{t.estatus}</Badge>
                          {t.sla_vencido && <Badge color={COLORES.acento}>⚠ SLA</Badge>}
                        </div>
                        <div style={{ fontSize: 12, color: COLORES.gris, minWidth: 90, textAlign: "right" }}>
                          <div>{t.responsable || "Sin asignar"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {pantalla === "bandeja" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: COLORES.azul, fontFamily: "Georgia, serif" }}>Bandeja · {ticketsFiltrados.length} tickets</div>
                  <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar..." style={{ padding: "9px 16px", border: "1.5px solid #E2E8F0", borderRadius: 24, fontSize: 14, width: 240, outline: "none", fontFamily: "inherit" }} />
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                  {filtros.map(f => (
                    <button key={f} onClick={() => setFiltro(f)}
                      style={{ padding: "6px 14px", border: `2px solid ${filtro === f ? COLORES.azul : "#E2E8F0"}`, borderRadius: 20, background: filtro === f ? COLORES.azul : "#fff", color: filtro === f ? "#fff" : COLORES.gris, cursor: "pointer", fontWeight: 600, fontSize: 12, fontFamily: "inherit" }}>
                      {f}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {ticketsFiltrados.length === 0 && <div style={{ textAlign: "center", color: COLORES.gris, padding: 48 }}>Sin tickets con ese filtro</div>}
                  {ticketsFiltrados.map(t => (
                    <div key={t.id} onClick={() => setTicketSeleccionado(t)}
                      style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 16, boxShadow: "0 1px 6px #0F346010", cursor: "pointer", border: t.sla_vencido ? `1.5px solid ${COLORES.acento}44` : "1.5px solid transparent" }}>
                      <div>
                        <div style={{ fontSize: 11, color: COLORES.gris, fontFamily: "monospace", marginBottom: 4 }}>{t.id}</div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{t.asunto}</div>
                        <div style={{ fontSize: 12, color: COLORES.gris, marginTop: 2 }}>{t.cliente}{t.empresa ? ` · ${t.empresa}` : ""}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexDirection: "column", alignItems: "flex-end" }}>
                        <Badge color={PRIORIDAD_COLORES[t.prioridad]}>{t.prioridad}</Badge>
                        <Badge color={ESTATUS_COLORES[t.estatus]}>{t.estatus}</Badge>
                        {t.sla_vencido && <Badge color={COLORES.acento}>⚠ SLA</Badge>}
                      </div>
                      <div style={{ fontSize: 12, color: COLORES.gris, textAlign: "right", minWidth: 100 }}>
                        <div style={{ fontWeight: 600, color: t.responsable ? COLORES.texto : COLORES.acento }}>{t.responsable || "Sin asignar"}</div>
                        <div>{t.fecha_creacion?.slice(5,10)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {pantalla === "kpis" && (
              <>
                <div style={{ fontSize: 22, fontWeight: 800, color: COLORES.azul, fontFamily: "Georgia, serif", marginBottom: 20 }}>KPIs & Métricas</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
                  <KPICard label="Tickets Abiertos" value={kpis.abiertos} color={COLORES.azulClaro} />
                  <KPICard label="Tickets Cerrados" value={kpis.cerrados} color={COLORES.verde} />
                  <KPICard label="Vencidos SLA" value={kpis.vencidos} color={COLORES.acento} />
                  <KPICard label="% SLA Cumplido" value={`${kpis.pctSLA}%`} color={kpis.pctSLA >= 80 ? COLORES.verde : COLORES.acento} />
                </div>
                <div style={{ background: "#fff", borderRadius: 14, padding: 24, marginBottom: 16, boxShadow: "0 2px 12px #0F346010" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: COLORES.azul, marginBottom: 14 }}>Tickets por Estatus</div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {ESTATUSES.map(e => {
                      const n = tickets.filter(t => t.estatus === e).length;
                      return (
                        <div key={e} style={{ background: ESTATUS_COLORES[e] + "15", borderRadius: 10, padding: "16px 20px", minWidth: 100, textAlign: "center", border: `1.5px solid ${ESTATUS_COLORES[e]}33` }}>
                          <div style={{ fontSize: 28, fontWeight: 800, color: ESTATUS_COLORES[e], fontFamily: "Georgia, serif" }}>{n}</div>
                          <div style={{ fontSize: 11, color: COLORES.gris, fontWeight: 600, marginTop: 4 }}>{e}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px #0F346010" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: COLORES.azul, marginBottom: 14 }}>Tickets por Responsable</div>
                  {RESPONSABLES.map(r => {
                    const total = tickets.filter(t => t.responsable === r).length;
                    const pct = tickets.length > 0 ? (total / tickets.length) * 100 : 0;
                    return (
                      <div key={r} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{r}</span>
                          <span style={{ fontSize: 12, color: COLORES.gris }}>{total} tickets</span>
                        </div>
                        <div style={{ height: 8, background: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", background: COLORES.azulClaro, borderRadius: 4, width: `${pct}%`, transition: "width .6s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {ticketSeleccionado && (
        <DetalleTicket ticket={ticketSeleccionado} onClose={() => setTicketSeleccionado(null)} onUpdate={updateTicket} />
      )}
    </div>
  );
}
