import { useMemo, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateSelectArg, DatesSetArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import { useCalendar } from '../hooks/useCalendar'
import { ActivityModal } from '../components/calendar/ActivityModal'
import { DayModal } from '../components/calendar/DayModal'
import type { CalendarActivity, CalendarActivityUpdate } from '../supabase/types'
import '../styles/calendar.css'

// Rango visible por defecto: mes actual ± 1 (cubre lo que pinta la vista mensual)
function defaultRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0)
  return { start: start.toLocaleDateString('en-CA'), end: end.toLocaleDateString('en-CA') }
}

function toISODate(d: Date) {
  return d.toLocaleDateString('en-CA')
}

export function CalendarPage() {
  const calRef = useRef<FullCalendar>(null)
  const [range, setRange] = useState(defaultRange)
  const { activities, addActivity, updateActivity, deleteActivity, toggleDone } = useCalendar(range.start, range.end)

  // Estado de modales
  const [dayModal, setDayModal] = useState<string | null>(null) // fecha del día abierto
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CalendarActivity | null>(null)
  const [formSeed, setFormSeed] = useState<{ date: string; time?: string }>({ date: toISODate(new Date()) })

  const events = useMemo(
    () =>
      activities.map((a) => {
        const startIso = a.start_time ? `${a.activity_date}T${a.start_time}:00` : a.activity_date
        let endIso: string | undefined
        if (a.start_time) {
          const start = new Date(`${a.activity_date}T${a.start_time}:00`)
          const end = new Date(start.getTime() + (a.duration_minutes || 30) * 60000)
          const pad = (n: number) => String(n).padStart(2, '0')
          endIso = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}:00`
        }
        return {
          id: a.id,
          title: a.title,
          start: startIso,
          end: endIso,
          allDay: !a.start_time,
          backgroundColor: a.color,
          borderColor: a.color,
          classNames: a.done ? ['is-done'] : [],
          extendedProps: { objective: a.objective },
        }
      }),
    [activities]
  )

  const dayActivities = useMemo(
    () => (dayModal ? activities.filter((a) => a.activity_date === dayModal) : []),
    [activities, dayModal]
  )

  const handleDatesSet = (arg: DatesSetArg) => {
    setRange({ start: toISODate(arg.start), end: toISODate(arg.end) })
  }

  // Clic en una franja/día vacío -> crear
  const handleSelect = (sel: DateSelectArg) => {
    const date = toISODate(sel.start)
    const time = sel.allDay ? undefined : sel.start.toTimeString().slice(0, 5)
    setEditing(null)
    setFormSeed({ date, time })
    setFormOpen(true)
    calRef.current?.getApi().unselect()
  }

  // Clic en evento -> editar directo
  const handleEventClick = (arg: EventClickArg) => {
    const a = activities.find((x) => x.id === arg.event.id)
    if (a) openEdit(a)
  }

  const openEdit = (a: CalendarActivity) => {
    setEditing(a)
    setFormSeed({ date: a.activity_date, time: a.start_time || undefined })
    setFormOpen(true)
  }

  // Guarda el nuevo día/hora/duración tras arrastrar o redimensionar un evento.
  const persistMove = async (
    eventId: string,
    newStart: Date | null,
    newEnd: Date | null,
    allDay: boolean
  ) => {
    if (!newStart) return
    const activity_date = toISODate(newStart)
    const patch: CalendarActivityUpdate = { activity_date }
    if (allDay) {
      patch.start_time = null
    } else {
      const pad = (n: number) => String(n).padStart(2, '0')
      patch.start_time = `${pad(newStart.getHours())}:${pad(newStart.getMinutes())}`
      if (newEnd) {
        patch.duration_minutes = Math.max(5, Math.round((newEnd.getTime() - newStart.getTime()) / 60000))
      }
    }
    await updateActivity(eventId, patch)
  }

  const handleEventDrop = (arg: EventDropArg) => {
    persistMove(arg.event.id, arg.event.start, arg.event.end, arg.event.allDay)
  }

  const handleEventResize = (arg: EventResizeDoneArg) => {
    persistMove(arg.event.id, arg.event.start, arg.event.end, arg.event.allDay)
  }

  const openNewToday = () => {
    setEditing(null)
    setFormSeed({ date: toISODate(new Date()) })
    setFormOpen(true)
  }

  const handleSave = async (data: Parameters<typeof addActivity>[0]) => {
    if (editing) await updateActivity(editing.id, data)
    else await addActivity(data)
    setFormOpen(false)
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    await deleteActivity(id)
    setFormOpen(false)
    setEditing(null)
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-accent">📅</span> Calendario
        </h1>
        <button onClick={openNewToday} className="bg-accent hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg text-sm transition-colors">
          + Nueva actividad
        </button>
      </div>

      <div className="bg-secondary rounded-2xl p-4 ferreo-calendar">
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={esLocale}
          firstDay={1}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día' }}
          height="auto"
          selectable
          selectMirror
          editable
          eventStartEditable
          eventDurationEditable
          dayMaxEvents={3}
          nowIndicator
          events={events}
          datesSet={handleDatesSet}
          select={handleSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          dateClick={(arg) => setDayModal(arg.dateStr.slice(0, 10))}
          moreLinkClick={(arg) => { setDayModal(toISODate(arg.date)); return 'none' }}
        />
      </div>

      {/* Modal detalle del día */}
      <DayModal
        open={dayModal !== null}
        date={dayModal ?? toISODate(new Date())}
        activities={dayActivities}
        onToggle={toggleDone}
        onEdit={(a) => { setDayModal(null); openEdit(a) }}
        onDelete={deleteActivity}
        onAdd={() => {
          const d = dayModal ?? toISODate(new Date())
          setDayModal(null)
          setEditing(null)
          setFormSeed({ date: d })
          setFormOpen(true)
        }}
        onClose={() => setDayModal(null)}
      />

      {/* Modal crear/editar */}
      <ActivityModal
        open={formOpen}
        date={formSeed.date}
        time={formSeed.time}
        activity={editing}
        onSave={handleSave}
        onDelete={handleDelete}
        onToggleDone={async (id, done) => { await toggleDone(id, done); setEditing((e) => (e ? { ...e, done } : e)) }}
        onClose={() => { setFormOpen(false); setEditing(null) }}
      />
    </div>
  )
}
