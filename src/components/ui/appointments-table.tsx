"use client";

import { useState, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Download, ChevronDown, X, Clock, User, Stethoscope, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type AppointmentRow = {
  id: string;
  scheduled_at: string;
  status: "pendiente" | "confirmado" | "cancelado" | "ausente" | "atendido";
  reason: string | null;
  specialty: string | null;
  patient_name: string;
  doctor_name?: string;
};

const SPECIALTY_LABELS: Record<string, string> = {
  oftalmologia:      "Oftalmología",
  gastroenterologia: "Gastroenterología",
  diabetologia:      "Diabetología",
  clinica_medica:    "Clínica Médica",
};

const STATUS_CONFIG: Record<AppointmentRow["status"], { label: string; bg: string; text: string; dot: string; bgDark: string; textDark: string; dotDark: string }> = {
  pendiente:  { label: "Pendiente",  bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500", bgDark: "bg-yellow-500/10", textDark: "text-yellow-400", dotDark: "bg-yellow-400" },
  confirmado: { label: "Confirmado", bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  bgDark: "bg-green-500/10",  textDark: "text-green-400",  dotDark: "bg-green-400"  },
  cancelado:  { label: "Cancelado",  bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500",    bgDark: "bg-red-500/10",    textDark: "text-red-400",    dotDark: "bg-red-400"    },
  ausente:    { label: "Ausente",    bg: "bg-gray-100",  text: "text-gray-600",   dot: "bg-gray-400",   bgDark: "bg-gray-500/10",   textDark: "text-gray-400",   dotDark: "bg-gray-400"   },
  atendido:   { label: "Atendido",   bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500",   bgDark: "bg-blue-500/10",   textDark: "text-blue-400",   dotDark: "bg-blue-400"   },
};

type SortField = "time" | "patient" | "status";
type SortOrder = "asc" | "desc";

const containerVariants = { visible: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } } };
const rowVariants = {
  hidden:  { opacity: 0, y: 20, scale: 0.98, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0,  scale: 1,    filter: "blur(0px)", transition: { type: "spring" as const, stiffness: 400, damping: 25, mass: 0.7 } },
};

export function AppointmentsTable({
  appointments,
  showDoctor = true,
}: {
  appointments: AppointmentRow[];
  showDoctor?: boolean;
}) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const shouldReduceMotion = useReducedMotion();

  const [selected, setSelected]           = useState<string[]>([]);
  const [currentPage, setCurrentPage]     = useState(1);
  const [sortField, setSortField]         = useState<SortField>("time");
  const [sortOrder, setSortOrder]         = useState<SortOrder>("asc");
  const [showSortMenu, setShowSortMenu]   = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [filterStatus, setFilterStatus]   = useState<string | null>(null);
  const [detail, setDetail]               = useState<AppointmentRow | null>(null);

  const ITEMS_PER_PAGE = 10;

  const toggleSelect = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortOrder("asc"); }
    setShowSortMenu(false);
    setCurrentPage(1);
  };

  const processed = useMemo(() => {
    let rows = [...appointments];
    if (filterStatus) rows = rows.filter(r => r.status === filterStatus);
    rows.sort((a, b) => {
      let diff = 0;
      if (sortField === "time")    diff = new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
      if (sortField === "patient") diff = a.patient_name.localeCompare(b.patient_name);
      if (sortField === "status")  diff = a.status.localeCompare(b.status);
      return sortOrder === "asc" ? diff : -diff;
    });
    return rows;
  }, [appointments, filterStatus, sortField, sortOrder]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processed.slice(start, start + ITEMS_PER_PAGE);
  }, [processed, currentPage]);

  const totalPages = Math.ceil(processed.length / ITEMS_PER_PAGE);

  function statusPill(status: AppointmentRow["status"]) {
    const s = STATUS_CONFIG[status];
    const bg   = isDark ? s.bgDark   : s.bg;
    const text = isDark ? s.textDark : s.text;
    const dot  = isDark ? s.dotDark  : s.dot;
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium ${bg} ${text} rounded-md`}>
        <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {s.label}
      </div>
    );
  }

  function exportCSV() {
    const headers = ["Hora", "Paciente", "Médico", "Especialidad", "Estado", "Motivo"];
    const rows = processed.map(a => [
      new Date(a.scheduled_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      a.patient_name,
      a.doctor_name ?? "",
      SPECIALTY_LABELS[a.specialty ?? ""] ?? a.specialty ?? "",
      STATUS_CONFIG[a.status].label,
      a.reason ?? "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    link.download = `turnos-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-14 text-muted-foreground">
        <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No hay turnos para hoy</p>
        <Link href="/agenda/nuevo" className="text-sm text-[#0891B2] hover:underline mt-2 inline-block">Agregar turno</Link>
      </div>
    );
  }

  const cols = showDoctor
    ? "40px 1fr 160px 150px 140px 140px 40px"
    : "40px 1fr 160px 140px 140px 40px";

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="mb-3 flex items-center justify-end gap-2">
        {/* Filter */}
        <div className="relative">
          <button
            onClick={() => { setShowFilterMenu(v => !v); setShowSortMenu(false); setShowExportMenu(false); }}
            className={`px-3 py-1.5 bg-background border border-border/50 text-foreground text-sm hover:bg-muted/30 transition-colors flex items-center gap-2 rounded-md ${filterStatus ? "ring-2 ring-primary/30" : ""}`}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 3H14M4 8H12M6 13H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Filtrar
            {filterStatus && <span className="text-xs bg-primary text-primary-foreground rounded-sm px-1.5 py-0.5">1</span>}
          </button>
          {showFilterMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
              <div className="absolute right-0 mt-1 w-44 bg-background border border-border/50 shadow-lg rounded-md z-20 py-1">
                <button onClick={() => { setFilterStatus(null); setShowFilterMenu(false); setCurrentPage(1); }} className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors ${!filterStatus ? "bg-muted/30" : ""}`}>Todos los estados</button>
                <div className="h-px bg-border/30 my-1" />
                {(["pendiente","confirmado","atendido","ausente","cancelado"] as const).map(s => (
                  <button key={s} onClick={() => { setFilterStatus(s); setShowFilterMenu(false); setCurrentPage(1); }} className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors ${filterStatus === s ? "bg-muted/30" : ""}`}>
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sort */}
        <div className="relative">
          <button
            onClick={() => { setShowSortMenu(v => !v); setShowFilterMenu(false); setShowExportMenu(false); }}
            className="px-3 py-1.5 bg-background border border-border/50 text-foreground text-sm hover:bg-muted/30 transition-colors flex items-center gap-2 rounded-md"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 6L6 3L9 6M6 3V13M13 10L10 13L7 10M10 13V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Ordenar
            {sortField && <span className="text-xs bg-primary text-primary-foreground rounded-sm px-1.5 py-0.5">1</span>}
            <ChevronDown size={14} className="opacity-50" />
          </button>
          {showSortMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
              <div className="absolute right-0 mt-1 w-44 bg-background border border-border/50 shadow-lg rounded-md z-20 py-1">
                {([["time","Hora"],["patient","Paciente"],["status","Estado"]] as [SortField, string][]).map(([field, label]) => (
                  <button key={field} onClick={() => handleSort(field)} className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors ${sortField === field ? "bg-muted/30" : ""}`}>
                    {label} {sortField === field && `(${sortOrder === "asc" ? "↑" : "↓"})`}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Export */}
        <div className="relative">
          <button
            onClick={() => { setShowExportMenu(v => !v); setShowSortMenu(false); setShowFilterMenu(false); }}
            className="px-3 py-1.5 bg-background border border-border/50 text-foreground text-sm hover:bg-muted/30 transition-colors flex items-center gap-2 rounded-md"
          >
            <Download size={14} />
            Exportar
            <ChevronDown size={14} className="opacity-50" />
          </button>
          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
              <div className="absolute right-0 mt-1 w-28 bg-background border border-border/50 shadow-lg rounded-md z-20 py-1">
                <button onClick={() => { exportCSV(); setShowExportMenu(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors">CSV</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-background border border-border/50 overflow-hidden rounded-lg relative">
        <div className="overflow-x-auto">
          <div style={{ minWidth: showDoctor ? "900px" : "750px" }}>
            {/* Header */}
            <div className="px-3 py-3 text-xs font-medium text-muted-foreground/60 bg-muted/5 border-b border-border/30" style={{ display: "grid", gridTemplateColumns: cols, alignItems: "center" }}>
              <div className="flex items-center justify-center pr-3 border-r border-border/20">
                <input type="checkbox" className="w-4 h-4 rounded cursor-pointer" checked={paginated.length > 0 && selected.length === paginated.length} onChange={() => setSelected(selected.length === paginated.length ? [] : paginated.map(r => r.id))} />
              </div>
              <div className="flex items-center gap-1.5 px-3 border-r border-border/20"><User className="w-3.5 h-3.5 opacity-40" />Paciente</div>
              <div className="flex items-center gap-1.5 px-3 border-r border-border/20"><Clock className="w-3.5 h-3.5 opacity-40" />Hora</div>
              {showDoctor && <div className="flex items-center px-3 border-r border-border/20">Médico</div>}
              <div className="flex items-center gap-1.5 px-3 border-r border-border/20"><Stethoscope className="w-3.5 h-3.5 opacity-40" />Especialidad</div>
              <div className="flex items-center px-3 border-r border-border/20">Estado</div>
              <div />
            </div>

            {/* Rows */}
            <AnimatePresence mode="wait">
              <motion.div key={`page-${currentPage}-${filterStatus}`} variants={shouldReduceMotion ? {} : containerVariants} initial={shouldReduceMotion ? "visible" : "hidden"} animate="visible">
                {paginated.map((appt, index) => {
                  const time = new Date(appt.scheduled_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
                  const isLast = index === paginated.length - 1;
                  return (
                    <motion.div key={appt.id} variants={shouldReduceMotion ? {} : rowVariants}>
                      <div
                        className={`px-3 py-3.5 group transition-colors cursor-pointer ${selected.includes(appt.id) ? "bg-muted/30" : "bg-muted/5 hover:bg-muted/20"} ${!isLast ? "border-b border-border/20" : ""}`}
                        style={{ display: "grid", gridTemplateColumns: cols, alignItems: "center" }}
                        onClick={() => router.push(`/agenda/${appt.id}`)}
                      >
                        <div className="flex items-center justify-center pr-3 border-r border-border/20" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" className="w-4 h-4 rounded cursor-pointer" checked={selected.includes(appt.id)} onChange={() => toggleSelect(appt.id)} />
                        </div>

                        {/* Paciente */}
                        <div className="flex items-center gap-2 px-3 border-r border-border/20 min-w-0">
                          <div className="inline-flex items-center gap-2 px-2 py-1 bg-muted/30 rounded-full min-w-0">
                            <div className="w-5 h-5 rounded-full bg-[#EFF6FF] dark:bg-sky-900/40 border border-[#BFDBFE] dark:border-sky-800/50 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-[#1B3A6B] dark:text-sky-400">{appt.patient_name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm text-foreground truncate">{appt.patient_name}</p>
                              {appt.reason && <p className="text-xs text-muted-foreground truncate">{appt.reason}</p>}
                            </div>
                          </div>
                        </div>

                        {/* Hora */}
                        <div className="flex items-center px-3 border-r border-border/20">
                          <span className="text-sm font-bold text-[#1B3A6B] dark:text-sky-400">{time}</span>
                        </div>

                        {/* Médico */}
                        {showDoctor && (
                          <div className="flex items-center px-3 border-r border-border/20 min-w-0">
                            <span className="text-sm text-muted-foreground truncate">{appt.doctor_name ?? "—"}</span>
                          </div>
                        )}

                        {/* Especialidad */}
                        <div className="flex items-center px-3 border-r border-border/20 min-w-0">
                          <span className="text-sm text-muted-foreground truncate">
                            {SPECIALTY_LABELS[appt.specialty ?? ""] ?? appt.specialty ?? "—"}
                          </span>
                        </div>

                        {/* Estado */}
                        <div className="flex items-center px-3 border-r border-border/20">
                          {statusPill(appt.status)}
                        </div>

                        {/* Acción */}
                        <div className="flex items-center justify-center px-3" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setDetail(appt)} className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="13" r="1.5" fill="currentColor"/></svg>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Detail modal */}
        <AnimatePresence>
          {detail && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10" onClick={() => setDetail(null)}>
              <motion.div initial={{ scale: 0.85, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0, y: 16 }} transition={{ type: "spring", stiffness: 300, damping: 28 }} className="bg-card border border-border rounded-xl p-6 mx-6 shadow-xl relative max-w-sm w-full" onClick={e => e.stopPropagation()}>
                <button onClick={() => setDetail(null)} className="absolute top-3 right-3 w-6 h-6 rounded-full bg-muted/50 hover:bg-muted/70 flex items-center justify-center transition-colors">
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#EFF6FF] dark:bg-sky-900/30 border border-[#BFDBFE] dark:border-sky-800/50 flex items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-[#1B3A6B] dark:text-sky-400">{detail.patient_name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{detail.patient_name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(detail.scheduled_at).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Row icon={<Clock className="w-3.5 h-3.5" />} label="Hora" value={new Date(detail.scheduled_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) + " hs"} />
                    {showDoctor && detail.doctor_name && <Row icon={<User className="w-3.5 h-3.5" />} label="Médico" value={detail.doctor_name} />}
                    <Row icon={<Stethoscope className="w-3.5 h-3.5" />} label="Especialidad" value={SPECIALTY_LABELS[detail.specialty ?? ""] ?? detail.specialty ?? "—"} />
                    {detail.reason && <Row icon={<ClipboardList className="w-3.5 h-3.5" />} label="Motivo" value={detail.reason} />}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide w-24">Estado</span>
                      {statusPill(detail.status)}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/50">
                    <Link href={`/agenda/${detail.id}`} onClick={() => setDetail(null)} className="block w-full text-center px-4 py-2 bg-[#1B3A6B] hover:bg-[#2D5AA0] text-white rounded-md text-sm font-medium transition-colors">
                      Ver turno completo →
                    </Link>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground/70">Página {currentPage} de {totalPages} · {processed.length} turno{processed.length !== 1 ? "s" : ""}</span>
          <div className="flex gap-1.5">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 bg-background border border-border/50 text-foreground text-xs hover:bg-muted/30 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors">Anterior</button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-background border border-border/50 text-foreground text-xs hover:bg-muted/30 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors">Siguiente</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <span className="text-xs text-muted-foreground uppercase tracking-wide w-24 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}
