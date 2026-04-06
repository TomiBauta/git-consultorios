"use client";

import { useState, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Download, ChevronDown, User, Phone, CreditCard, Mail, Users, ClipboardList, Calendar, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type PatientRow = {
  id: string;
  first_name: string;
  last_name: string;
  dni: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  obra_social: string | null;
};

function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

type SortField = "name" | "age";
type SortOrder = "asc" | "desc";

const containerVariants = { visible: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } } };
const rowVariants = {
  hidden:  { opacity: 0, y: 20, scale: 0.98, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0,  scale: 1,    filter: "blur(0px)", transition: { type: "spring" as const, stiffness: 400, damping: 25, mass: 0.7 } },
};

// checkbox | nombre | DNI | edad | obra social | teléfono | email | Ver HC
const COLS = "40px minmax(160px,1.8fr) minmax(90px,0.8fr) 64px minmax(120px,1.2fr) minmax(110px,1fr) minmax(150px,1.2fr) 90px";

export function PatientsTable({
  patients,
  searchQuery,
}: {
  patients: PatientRow[];
  searchQuery?: string;
}) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [selected, setSelected]             = useState<string[]>([]);
  const [currentPage, setCurrentPage]       = useState(1);
  const [sortField, setSortField]           = useState<SortField>("name");
  const [sortOrder, setSortOrder]           = useState<SortOrder>("asc");
  const [showSortMenu, setShowSortMenu]     = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [filterOS, setFilterOS]             = useState<string | null>(null);

  const ITEMS_PER_PAGE = 10;

  const uniqueOS = useMemo(() => {
    const set = new Set(patients.map(p => p.obra_social).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [patients]);

  const toggleSelect = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortOrder("asc"); }
    setShowSortMenu(false);
    setCurrentPage(1);
  };

  const processed = useMemo(() => {
    let rows = [...patients];
    if (filterOS) rows = rows.filter(p => p.obra_social === filterOS);
    rows.sort((a, b) => {
      let diff = 0;
      if (sortField === "name") diff = a.last_name.localeCompare(b.last_name);
      if (sortField === "age")  diff = (calcAge(a.birth_date) ?? 999) - (calcAge(b.birth_date) ?? 999);
      return sortOrder === "asc" ? diff : -diff;
    });
    return rows;
  }, [patients, filterOS, sortField, sortOrder]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processed.slice(start, start + ITEMS_PER_PAGE);
  }, [processed, currentPage]);

  const totalPages = Math.ceil(processed.length / ITEMS_PER_PAGE);

  function exportCSV() {
    const headers = ["Apellido", "Nombre", "DNI", "Edad", "Obra Social", "Teléfono", "Email"];
    const rows = processed.map(p => [
      p.last_name, p.first_name, p.dni ?? "",
      calcAge(p.birth_date) ?? "", p.obra_social ?? "", p.phone ?? "", p.email ?? "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    link.download = `pacientes-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  }

  if (patients.length === 0) {
    return (
      <div className="bg-background border border-border/50 rounded-lg text-center py-14 text-muted-foreground">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">{searchQuery ? "No se encontraron pacientes" : "No hay pacientes cargados"}</p>
        {!searchQuery && <Link href="/pacientes/nuevo" className="text-sm text-[#0891B2] hover:underline mt-2 inline-block">Agregar el primero</Link>}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground/70">
          {processed.length} paciente{processed.length !== 1 ? "s" : ""}
          {searchQuery ? ` · "${searchQuery}"` : ""}
          {filterOS ? ` · ${filterOS}` : ""}
        </span>
        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => { setShowFilterMenu(v => !v); setShowSortMenu(false); setShowExportMenu(false); }}
              className={`px-3 py-1.5 bg-background border border-border/50 text-foreground text-sm hover:bg-muted/30 transition-colors flex items-center gap-2 rounded-md ${filterOS ? "ring-2 ring-primary/30" : ""}`}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 3H14M4 8H12M6 13H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Filtrar
              {filterOS && <span className="text-xs bg-primary text-primary-foreground rounded-sm px-1.5 py-0.5">1</span>}
            </button>
            {showFilterMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                <div className="absolute right-0 mt-1 w-56 bg-background border border-border/50 shadow-lg rounded-md z-20 py-1 max-h-64 overflow-y-auto">
                  <button onClick={() => { setFilterOS(null); setShowFilterMenu(false); setCurrentPage(1); }} className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors ${!filterOS ? "bg-muted/30" : ""}`}>Todas las obras sociales</button>
                  <div className="h-px bg-border/30 my-1" />
                  {uniqueOS.map(os => (
                    <button key={os} onClick={() => { setFilterOS(os); setShowFilterMenu(false); setCurrentPage(1); }} className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors ${filterOS === os ? "bg-muted/30" : ""}`}>{os}</button>
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
              <ChevronDown size={14} className="opacity-50" />
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 mt-1 w-40 bg-background border border-border/50 shadow-lg rounded-md z-20 py-1">
                  {([["name", "Apellido"], ["age", "Edad"]] as [SortField, string][]).map(([field, label]) => (
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
      </div>

      {/* Table */}
      <div className="bg-background border border-border/50 overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <div style={{ minWidth: "900px" }}>
            {/* Header */}
            <div
              className="px-3 py-3 text-xs font-medium text-muted-foreground/60 bg-muted/5 border-b border-border/30"
              style={{ display: "grid", gridTemplateColumns: COLS, alignItems: "center" }}
            >
              <div className="flex items-center justify-center pr-3 border-r border-border/20">
                <input type="checkbox" className="w-4 h-4 rounded cursor-pointer"
                  checked={paginated.length > 0 && selected.length === paginated.length}
                  onChange={() => setSelected(selected.length === paginated.length ? [] : paginated.map(p => p.id))}
                />
              </div>
              <div className="flex items-center gap-1.5 px-3 border-r border-border/20"><User className="w-3.5 h-3.5 opacity-40" />Paciente</div>
              <div className="flex items-center gap-1.5 px-3 border-r border-border/20"><CreditCard className="w-3.5 h-3.5 opacity-40" />DNI</div>
              <div className="flex items-center gap-1.5 px-3 border-r border-border/20"><Calendar className="w-3.5 h-3.5 opacity-40" />Edad</div>
              <div className="flex items-center gap-1.5 px-3 border-r border-border/20"><Shield className="w-3.5 h-3.5 opacity-40" />Obra Social</div>
              <div className="flex items-center gap-1.5 px-3 border-r border-border/20"><Phone className="w-3.5 h-3.5 opacity-40" />Teléfono</div>
              <div className="flex items-center gap-1.5 px-3 border-r border-border/20"><Mail className="w-3.5 h-3.5 opacity-40" />Email</div>
              <div className="px-3" />
            </div>

            {/* Rows */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`page-${currentPage}-${filterOS}`}
                variants={shouldReduceMotion ? {} : containerVariants}
                initial={shouldReduceMotion ? "visible" : "hidden"}
                animate="visible"
              >
                {paginated.map((p, index) => {
                  const age = calcAge(p.birth_date);
                  const initials = `${p.first_name.charAt(0)}${p.last_name.charAt(0)}`.toUpperCase();
                  const isLast = index === paginated.length - 1;

                  return (
                    <motion.div key={p.id} variants={shouldReduceMotion ? {} : rowVariants}>
                      <div
                        className={`px-3 py-3 group transition-colors cursor-pointer ${selected.includes(p.id) ? "bg-muted/30" : "bg-muted/5 hover:bg-muted/20"} ${!isLast ? "border-b border-border/20" : ""}`}
                        style={{ display: "grid", gridTemplateColumns: COLS, alignItems: "center" }}
                        onClick={() => router.push(`/pacientes/${p.id}/historia`)}
                      >
                        {/* Checkbox */}
                        <div className="flex items-center justify-center pr-3 border-r border-border/20" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" className="w-4 h-4 rounded cursor-pointer" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} />
                        </div>

                        {/* Nombre */}
                        <div className="flex items-center gap-2 px-3 border-r border-border/20 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-[#EFF6FF] dark:bg-sky-900/40 border border-[#BFDBFE] dark:border-sky-800/50 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-[#1B3A6B] dark:text-sky-400">{initials}</span>
                          </div>
                          <span className="text-sm font-medium text-foreground truncate">{p.last_name}, {p.first_name}</span>
                        </div>

                        {/* DNI */}
                        <div className="flex items-center px-3 border-r border-border/20">
                          <span className="text-sm text-muted-foreground tabular-nums">{p.dni ?? "—"}</span>
                        </div>

                        {/* Edad */}
                        <div className="flex items-center px-3 border-r border-border/20">
                          {age !== null
                            ? <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted/40 text-xs font-medium text-foreground/80 tabular-nums">{age}</span>
                            : <span className="text-muted-foreground/30">—</span>}
                        </div>

                        {/* Obra social */}
                        <div className="flex items-center px-3 border-r border-border/20 min-w-0">
                          {p.obra_social
                            ? <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#EFF6FF] dark:bg-sky-900/20 border border-[#BFDBFE] dark:border-sky-800/30 text-xs font-medium text-[#1B3A6B] dark:text-sky-400 truncate max-w-full">{p.obra_social}</span>
                            : <span className="text-muted-foreground/30">—</span>}
                        </div>

                        {/* Teléfono */}
                        <div className="flex items-center px-3 border-r border-border/20" onClick={e => e.stopPropagation()}>
                          {p.phone
                            ? <a href={`tel:${p.phone}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors tabular-nums">{p.phone}</a>
                            : <span className="text-muted-foreground/30">—</span>}
                        </div>

                        {/* Email */}
                        <div className="flex items-center px-3 border-r border-border/20 min-w-0" onClick={e => e.stopPropagation()}>
                          {p.email
                            ? <a href={`mailto:${p.email}`} className="text-sm text-blue-500 hover:text-blue-600 truncate transition-colors">{p.email}</a>
                            : <span className="text-muted-foreground/30">—</span>}
                        </div>

                        {/* Ver HC */}
                        <div className="flex items-center justify-center px-3">
                          <Link
                            href={`/pacientes/${p.id}/historia`}
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-[#1B3A6B] dark:text-sky-400 bg-[#EFF6FF] dark:bg-sky-900/20 border border-[#BFDBFE] dark:border-sky-800/30 opacity-0 group-hover:opacity-100 hover:bg-[#DBEAFE] dark:hover:bg-sky-900/40 transition-all"
                          >
                            <ClipboardList className="w-3 h-3" />
                            HC
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground/70">Página {currentPage} de {totalPages} · {processed.length} paciente{processed.length !== 1 ? "s" : ""}</span>
          <div className="flex gap-1.5">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 bg-background border border-border/50 text-foreground text-xs hover:bg-muted/30 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors">Anterior</button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-background border border-border/50 text-foreground text-xs hover:bg-muted/30 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors">Siguiente</button>
          </div>
        </div>
      )}
    </div>
  );
}
