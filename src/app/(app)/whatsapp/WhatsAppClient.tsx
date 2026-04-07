'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  MessageCircle, Filter, Search, Phone, Video, MoreVertical,
  Paperclip, Smile, Send, FileText, Image, Download, Calendar,
  Droplets, AlertTriangle,
} from 'lucide-react'

type Conversation = {
  id: string
  phone_number: string
  status: string
  updated_at: string
  patients: { first_name: string; last_name: string; dni: string | null } | null
}

type Message = {
  id: string
  direction: 'inbound' | 'outbound'
  content: string
  created_at: string
  tokens_used?: number | null
}

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  active:    { label: 'Activa',     bg: 'rgba(12,103,128,0.12)', text: '#0c6780' },
  escalated: { label: 'Urgente',    bg: '#ffdad6', text: '#93000a' },
  closed:    { label: 'Finalizado', bg: '#e2e5e9', text: '#747780' },
  pending:   { label: 'Pendiente',  bg: '#e2e5e9', text: '#3d4a5c' },
}

function initials(conv: Conversation) {
  if (conv.patients) {
    return `${conv.patients.first_name[0]}${conv.patients.last_name[0]}`.toUpperCase()
  }
  return conv.phone_number.slice(-2)
}

function displayName(conv: Conversation) {
  if (conv.patients) return `${conv.patients.first_name} ${conv.patients.last_name}`
  return conv.phone_number
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }
  return 'Ayer'
}

const TEMPLATES = [
  { emoji: '📅', label: 'Recordatorio Cita' },
  { emoji: '💊', label: 'Receta Digital' },
  { emoji: '🧪', label: 'Prep. Análisis' },
  { emoji: '✅', label: 'Confirmación' },
]

const FILTER_TABS = ['Todos', 'Pendientes', 'Activos', 'Cerrados']

export default function WhatsAppClient({ conversations: initial }: { conversations: Conversation[] }) {
  const supabase = createClient()

  const [conversations, setConversations] = useState<Conversation[]>(initial)
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [selected, setSelected]         = useState<Conversation | null>(initial[0] ?? null)
  const [messages, setMessages]         = useState<Message[]>([])
  const [loadingMsgs, setLoadingMsgs]   = useState(false)
  const [draft, setDraft]               = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load messages when conversation selected
  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true)
    const { data } = await supabase
      .from('whatsapp_messages')
      .select('id, direction, content, created_at, tokens_used')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    setMessages((data ?? []) as Message[])
    setLoadingMsgs(false)
  }, [supabase])

  useEffect(() => {
    if (selected) loadMessages(selected.id)
  }, [selected?.id])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime for messages in selected conversation
  useEffect(() => {
    if (!selected) return
    const ch = supabase
      .channel(`wa-msgs-${selected.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'whatsapp_messages',
        filter: `conversation_id=eq.${selected.id}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [selected?.id])

  const filteredConvs = conversations.filter(c => {
    if (activeFilter === 'Todos') return true
    if (activeFilter === 'Pendientes') return c.status === 'pending' || c.status === 'escalated'
    if (activeFilter === 'Activos')   return c.status === 'active'
    if (activeFilter === 'Cerrados')  return c.status === 'closed'
    return true
  })

  const st = selected ? (STATUS_MAP[selected.status] ?? STATUS_MAP.pending) : null

  return (
    <div className="flex h-full -m-8 overflow-hidden">

      {/* ── Left: Conversation list ── */}
      <section
        className="w-80 flex flex-col shrink-0 overflow-hidden"
        style={{ background: '#f2f4f6', borderRight: '1px solid rgba(196,198,208,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-3">
          <h2 className="text-lg font-extrabold" style={{ color: '#00113a', letterSpacing: '-0.02em' }}>
            Mensajes
          </h2>
          <button
            className="p-2 rounded transition-all hover:opacity-70"
            style={{ background: '#ffffff', color: '#3d4a5c' }}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 px-4 pb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className="px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all"
              style={activeFilter === tab
                ? { background: '#00113a', color: '#ffffff' }
                : { background: '#e2e5e9', color: '#3d4a5c' }
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageCircle className="w-10 h-10 mb-3" style={{ color: '#c4c6d0' }} />
              <p className="text-xs font-medium" style={{ color: '#3d4a5c' }}>Sin conversaciones</p>
            </div>
          ) : filteredConvs.map(conv => {
            const isActive = selected?.id === conv.id
            const badge = STATUS_MAP[conv.status] ?? STATUS_MAP.pending
            return (
              <button
                key={conv.id}
                onClick={() => setSelected(conv)}
                className="w-full text-left p-4 rounded transition-all"
                style={isActive
                  ? { background: '#ffffff', borderLeft: '4px solid #00113a' }
                  : { background: 'transparent', borderLeft: '4px solid transparent' }
                }
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm truncate pr-2" style={{ color: '#1a1b1f' }}>
                    {displayName(conv)}
                  </span>
                  <span className="text-[10px] shrink-0" style={{ color: '#747780' }}>
                    {fmtTime(conv.updated_at)}
                  </span>
                </div>
                <p className="text-[11px] mb-2.5 truncate" style={{ color: '#3d4a5c' }}>
                  {conv.phone_number}
                </p>
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: badge.bg, color: badge.text }}
                >
                  {badge.label}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Center: Chat window ── */}
      <section className="flex-1 flex flex-col min-w-0" style={{ background: '#f7f9fb' }}>
        {selected ? (
          <>
            {/* Chat header */}
            <div
              className="h-16 px-6 flex items-center justify-between shrink-0"
              style={{
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(196,198,208,0.08)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white"
                  style={{ background: '#00113a' }}
                >
                  {initials(selected)}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#1a1b1f' }}>{displayName(selected)}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#0c6780' }} />
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: '#3d4a5c' }}>
                      {st?.label}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[Phone, Video, MoreVertical].map((Icon, i) => (
                  <button
                    key={i}
                    className="p-2 rounded-full transition-all hover:opacity-70"
                    style={{ color: '#3d4a5c', background: 'transparent' }}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ background: 'rgba(244,243,248,0.2)' }}>
              {/* Date separator */}
              <div className="flex justify-center">
                <span
                  className="px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                  style={{ background: '#e2e5e9', color: '#3d4a5c' }}
                >
                  Hoy
                </span>
              </div>

              {loadingMsgs ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 rounded-full border-2 border-[#00113a] border-t-transparent animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <MessageCircle className="w-12 h-12 mb-3" style={{ color: '#c4c6d0' }} />
                  <p className="text-sm font-medium" style={{ color: '#3d4a5c' }}>Sin mensajes aún</p>
                  <p className="text-xs mt-1" style={{ color: '#747780' }}>
                    Los mensajes de WhatsApp aparecerán aquí
                  </p>
                </div>
              ) : messages.map(msg => {
                const isOut = msg.direction === 'outbound'
                const time = new Date(msg.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-3 max-w-[70%] ${isOut ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={isOut
                        ? { background: '#002366', color: '#ffffff' }
                        : { background: '#d8e2ff', color: '#00113a' }
                      }
                    >
                      {isOut ? 'DR' : initials(selected)}
                    </div>
                    <div
                      className={`p-4 shadow-sm ${isOut ? 'rounded rounded-br-none' : 'rounded rounded-bl-none'}`}
                      style={isOut
                        ? { background: '#002366', color: '#ffffff' }
                        : { background: '#ffffff', color: '#1a1b1f' }
                      }
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className="text-[10px] mt-2 text-right"
                        style={{ color: isOut ? 'rgba(255,255,255,0.55)' : '#747780' }}
                      >
                        {time}{msg.tokens_used ? ` · ${msg.tokens_used} tk` : ''}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div
              className="p-5 shrink-0"
              style={{
                background: '#ffffff',
                borderTop: '1px solid rgba(196,198,208,0.08)',
              }}
            >
              {/* Templates */}
              <div className="flex items-center gap-2 mb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                <span className="text-[11px] font-bold shrink-0" style={{ color: '#3d4a5c' }}>Plantillas:</span>
                {TEMPLATES.map(t => (
                  <button
                    key={t.label}
                    className="px-3 py-1.5 rounded text-[11px] font-semibold whitespace-nowrap transition-all hover:opacity-80"
                    style={{
                      border: '1px solid rgba(196,198,208,0.3)',
                      color: '#00113a',
                      background: 'rgba(216,226,255,0.2)',
                    }}
                    onClick={() => setDraft(prev => prev + (prev ? ' ' : '') + t.label)}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>

              {/* Compose row */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[Paperclip, Smile].map((Icon, i) => (
                    <button key={i} className="p-2 rounded-full transition-all hover:opacity-60" style={{ color: '#3d4a5c' }}>
                      <Icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Escribe un mensaje aquí..."
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && draft.trim()) setDraft('') }}
                  className="flex-1 px-4 py-3 rounded text-sm focus:outline-none transition-all"
                  style={{
                    background: '#f2f4f6',
                    color: '#1a1b1f',
                    border: '2px solid transparent',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#00113a'; e.currentTarget.style.background = '#fff' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = '#f2f4f6' }}
                />
                <button
                  className="w-12 h-12 rounded flex items-center justify-center transition-all active:scale-95 hover:opacity-80"
                  style={{ background: '#00113a', color: '#ffffff', boxShadow: '0px 4px 12px rgba(0,26,65,0.2)' }}
                  onClick={() => setDraft('')}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div
              className="w-16 h-16 rounded flex items-center justify-center mb-4"
              style={{ background: '#f2f4f6' }}
            >
              <MessageCircle className="w-8 h-8" style={{ color: '#c4c6d0' }} />
            </div>
            <p className="text-base font-bold mb-1" style={{ color: '#1a1b1f' }}>
              Seleccioná una conversación
            </p>
            <p className="text-sm" style={{ color: '#3d4a5c' }}>
              Las conversaciones de WhatsApp de tus pacientes aparecerán aquí.
            </p>
          </div>
        )}
      </section>

      {/* ── Right: Patient info panel ── */}
      {selected && (
        <aside
          className="w-64 shrink-0 hidden xl:flex flex-col p-5 overflow-y-auto"
          style={{
            background: '#ffffff',
            borderLeft: '1px solid rgba(196,198,208,0.08)',
          }}
        >
          {/* Avatar + name */}
          <div className="text-center mb-6">
            <div
              className="w-20 h-20 rounded mx-auto mb-3 flex items-center justify-center text-2xl font-extrabold text-white"
              style={{ background: '#00113a' }}
            >
              {initials(selected)}
            </div>
            <h3 className="text-sm font-extrabold" style={{ color: '#1a1b1f' }}>
              {displayName(selected)}
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: '#3d4a5c' }}>
              {selected.phone_number}
            </p>
          </div>

          <div className="space-y-5">
            {/* Medical info */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: '#00113a' }}>
                Información Médica
              </p>
              <div className="space-y-3">
                {[
                  { icon: Droplets,      label: 'Grupo Sanguíneo', value: '—',        color: '#002366' },
                  { icon: AlertTriangle, label: 'Alergias',         value: '—',        color: '#ba1a1a' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg shrink-0"
                      style={{ background: '#f2f4f6', color: item.color }}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[9px]" style={{ color: '#3d4a5c' }}>{item.label}</p>
                      <p className="text-xs font-bold" style={{ color: item.color }}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(196,198,208,0.12)' }} />

            {/* Next appointment */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: '#00113a' }}>
                Próxima Cita
              </p>
              <div
                className="p-3 rounded"
                style={{ background: 'rgba(216,226,255,0.25)', border: '1px solid rgba(216,226,255,0.4)' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-3.5 h-3.5" style={{ color: '#00113a' }} />
                  <p className="text-[11px] font-bold" style={{ color: '#00113a' }}>Sin turno registrado</p>
                </div>
                <p className="text-[10px]" style={{ color: '#3d4a5c' }}>Revisar agenda del paciente</p>
                <button
                  className="mt-3 w-full py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-80"
                  style={{ background: '#ffffff', color: '#00113a', border: '1px solid rgba(216,226,255,0.6)' }}
                >
                  Ver en agenda
                </button>
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(196,198,208,0.12)' }} />

            {/* Recent docs */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: '#00113a' }}>
                Documentos
              </p>
              <div className="space-y-1">
                {[
                  { icon: FileText, name: 'Análisis recientes' },
                  { icon: Image,    name: 'Imágenes médicas' },
                ].map(doc => (
                  <div
                    key={doc.name}
                    className="flex items-center justify-between p-2 rounded-lg transition-all hover:opacity-80 cursor-pointer"
                    style={{ background: '#f2f4f6' }}
                  >
                    <div className="flex items-center gap-2">
                      <doc.icon className="w-3.5 h-3.5" style={{ color: '#3d4a5c' }} />
                      <span className="text-[10px] font-medium" style={{ color: '#3d4a5c' }}>{doc.name}</span>
                    </div>
                    <Download className="w-3 h-3" style={{ color: '#747780' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}
