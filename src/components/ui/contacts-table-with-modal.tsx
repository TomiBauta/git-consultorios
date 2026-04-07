"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Download, ChevronDown, X, Mail, User } from "lucide-react";

export interface Contact {
  id: string;
  name: string;
  email: string;
  connectionStrength: "Very weak" | "Weak" | "Good" | "Very strong";
  twitterFollowers: number;
  description?: string;
}

interface ContactsTableProps {
  title?: string;
  contacts?: Contact[];
  onContactSelect?: (contactId: string) => void;
  className?: string;
  enableAnimations?: boolean;
}

const defaultContacts: Contact[] = [
  { id: "1", name: "Pierre from Claap", email: "pierre@claap.io", connectionStrength: "Weak", twitterFollowers: 2400, description: "Tech entrepreneur" },
  { id: "2", name: "HardwareSavvy", email: "hardwaresavvy@gmail.com", connectionStrength: "Very strong", twitterFollowers: 8900, description: "Hardware specialist" },
  { id: "3", name: "Voiceform", email: "harrison@voiceform.com", connectionStrength: "Good", twitterFollowers: 5200, description: "Voice technology expert" },
];

type SortField = "name" | "connectionStrength" | "twitterFollowers";
type SortOrder = "asc" | "desc";

export function ContactsTable({
  title = "Person",
  contacts: initialContacts = defaultContacts,
  onContactSelect,
  className = "",
  enableAnimations = true,
}: ContactsTableProps = {}) {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [filterStrength, setFilterStrength] = useState<string | null>(null);
  const [selectedContactDetail, setSelectedContactDetail] = useState<Contact | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const ITEMS_PER_PAGE = 10;

  useEffect(() => { setMounted(true); }, []);

  const handleContactSelect = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
    );
    onContactSelect?.(contactId);
  };

  const handleSelectAll = () => {
    setSelectedContacts(
      selectedContacts.length === paginatedContacts.length ? [] : paginatedContacts.map(c => c.id)
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortOrder("asc"); }
    setShowSortMenu(false);
    setCurrentPage(1);
  };

  const sortedAndFilteredContacts = useMemo(() => {
    let filtered = [...initialContacts];
    if (filterStrength) filtered = filtered.filter(c => c.connectionStrength === filterStrength);
    if (!sortField) return filtered;
    const strengthMap = { "Very weak": 0, "Weak": 1, "Good": 2, "Very strong": 3 };
    return filtered.sort((a, b) => {
      const aVal = sortField === "connectionStrength" ? strengthMap[a.connectionStrength] : a[sortField];
      const bVal = sortField === "connectionStrength" ? strengthMap[b.connectionStrength] : b[sortField];
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [initialContacts, sortField, sortOrder, filterStrength]);

  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredContacts.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedAndFilteredContacts, currentPage]);

  const totalPages = Math.ceil(sortedAndFilteredContacts.length / ITEMS_PER_PAGE);

  const getStrengthStyle = (strength: string) => {
    const map: Record<string, { bg: string; text: string; dot: string }> = {
      "Very weak":   { bg: isDark ? "bg-red-500/10"    : "bg-red-50",    text: isDark ? "text-red-400"    : "text-red-600",    dot: isDark ? "bg-red-400"    : "bg-red-600"    },
      "Weak":        { bg: isDark ? "bg-orange-500/10" : "bg-orange-50", text: isDark ? "text-orange-400" : "text-orange-600", dot: isDark ? "bg-orange-400" : "bg-orange-600" },
      "Good":        { bg: isDark ? "bg-blue-500/10"   : "bg-blue-50",   text: isDark ? "text-blue-400"   : "text-blue-600",   dot: isDark ? "bg-blue-400"   : "bg-blue-600"   },
      "Very strong": { bg: isDark ? "bg-green-500/10"  : "bg-green-50",  text: isDark ? "text-green-400"  : "text-green-600",  dot: isDark ? "bg-green-400"  : "bg-green-600"  },
    };
    return map[strength] ?? map["Weak"];
  };

  const containerVariants = { visible: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } } };
  const rowVariants = {
    hidden:  { opacity: 0, y: 20, scale: 0.98, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0,  scale: 1,    filter: "blur(0px)", transition: { type: "spring" as const, stiffness: 400, damping: 25, mass: 0.7 } },
  };
  const shouldAnimate = enableAnimations && !shouldReduceMotion;

  return (
    <div className={`w-full max-w-7xl mx-auto ${className}`}>
      <div className="bg-background border border-border/50 overflow-hidden rounded-lg relative">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[40px_1fr_160px_140px_200px_40px] gap-0 px-3 py-3 text-xs font-medium text-muted-foreground/60 bg-muted/5 border-b border-border/30">
              <div className="flex items-center justify-center pr-3 border-r border-border/20">
                <input type="checkbox" className="w-4 h-4 rounded cursor-pointer" checked={paginatedContacts.length > 0 && selectedContacts.length === paginatedContacts.length} onChange={handleSelectAll} />
              </div>
              <div className="flex items-center gap-1.5 px-3 border-r border-border/20"><User className="w-3.5 h-3.5 opacity-40" />{title}</div>
              <div className="flex items-center px-3 border-r border-border/20">Connection</div>
              <div className="flex items-center px-3 border-r border-border/20">Followers</div>
              <div className="flex items-center gap-1.5 px-3 border-r border-border/20"><Mail className="w-3.5 h-3.5 opacity-40" />Email</div>
              <div />
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={`page-${currentPage}`} variants={shouldAnimate ? containerVariants : {}} initial={shouldAnimate ? "hidden" : "visible"} animate="visible">
                {paginatedContacts.map(contact => (
                  <motion.div key={contact.id} variants={shouldAnimate ? rowVariants : {}}>
                    <div
                      className={`grid grid-cols-[40px_1fr_160px_140px_200px_40px] gap-0 px-3 py-3.5 border-b border-border/20 group transition-colors ${selectedContacts.includes(contact.id) ? "bg-muted/30" : "bg-muted/5 hover:bg-muted/20"}`}
                      style={{ alignItems: "center" }}
                    >
                      <div className="flex items-center justify-center pr-3 border-r border-border/20">
                        <input type="checkbox" className="w-4 h-4 rounded cursor-pointer" checked={selectedContacts.includes(contact.id)} onChange={() => handleContactSelect(contact.id)} />
                      </div>
                      <div className="flex items-center gap-2 px-3 border-r border-border/20 min-w-0">
                        <div className="inline-flex items-center gap-2 px-2 py-1 bg-muted/30 rounded-full">
                          <User className="w-3.5 h-3.5 opacity-50 shrink-0" />
                          <span className="text-sm text-foreground truncate">{contact.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center px-3 border-r border-border/20">
                        {(() => { const s = getStrengthStyle(contact.connectionStrength); return (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text} rounded-md`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {contact.connectionStrength}
                          </div>
                        ); })()}
                      </div>
                      <div className="flex items-center px-3 border-r border-border/20">
                        <span className="text-sm text-foreground/80">{contact.twitterFollowers.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center px-3 border-r border-border/20 min-w-0">
                        <a href={`mailto:${contact.email}`} className="text-sm text-blue-500 hover:text-blue-600 truncate" onClick={e => e.stopPropagation()}>{contact.email}</a>
                      </div>
                      <div className="flex items-center justify-center px-3">
                        <button onClick={() => setSelectedContactDetail(contact)} className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="13" r="1.5" fill="currentColor"/></svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {selectedContactDetail && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10" onClick={() => setSelectedContactDetail(null)}>
              <motion.div initial={{ scale: 0.8, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="bg-card border border-border rounded p-6 mx-6 shadow-lg relative max-w-md w-full" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelectedContactDetail(null)} className="absolute top-3 right-3 w-6 h-6 rounded-full bg-muted/50 hover:bg-muted/70 flex items-center justify-center transition-colors">
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{selectedContactDetail.name}</h3>
                      {(() => { const s = getStrengthStyle(selectedContactDetail.connectionStrength); return (
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium ${s.bg} ${s.text} rounded-md mt-1`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{selectedContactDetail.connectionStrength}
                        </div>
                      ); })()}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1"><Mail className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground uppercase tracking-wide">Email</span></div>
                      <a href={`mailto:${selectedContactDetail.email}`} className="text-sm text-blue-500 hover:text-blue-600">{selectedContactDetail.email}</a>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1"><span className="text-xs text-muted-foreground uppercase tracking-wide">Followers</span></div>
                      <p className="text-sm font-medium text-foreground">{selectedContactDetail.twitterFollowers.toLocaleString()}</p>
                    </div>
                    {selectedContactDetail.description && (
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Description</span>
                        <p className="text-sm text-muted-foreground mt-1">{selectedContactDetail.description}</p>
                      </div>
                    )}
                  </div>
                  <div className="pt-3 border-t border-border/50">
                    <button className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-sm font-medium transition-colors" onClick={() => { window.location.href = `mailto:${selectedContactDetail.email}`; }}>
                      Send Email
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground/70">Página {currentPage} de {totalPages} · {sortedAndFilteredContacts.length} registros</span>
          <div className="flex gap-1.5">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 bg-background border border-border/50 text-foreground text-xs hover:bg-muted/30 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors">Anterior</button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-background border border-border/50 text-foreground text-xs hover:bg-muted/30 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors">Siguiente</button>
          </div>
        </div>
      )}
    </div>
  );
}
