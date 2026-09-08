import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { STATUSES, STATUS_META } from '../constants'
import Icon from './Icons'

function formatDate(value) {
  if (!value) return 'Date not set'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function JobCard({ job, onDelete, onStatusChange, overlay = false }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job._id,
    disabled: overlay,
    data: { status: job.status },
  })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  const card = (
    <motion.article
      className={`job-card ${overlay ? 'job-card-overlay' : ''}`}
      layoutId={overlay ? undefined : `job-card-${job._id}`}
      layout
      initial={overlay ? false : { opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: isDragging ? 0.28 : 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -8 }}
      whileHover={overlay || isDragging ? undefined : { y: -3, scale: 1.012 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
    >
      <div className="card-top">
        <div className="company-mark" aria-hidden="true">{job.company?.charAt(0)?.toUpperCase() || '?'}</div>
        <div className="card-title-wrap">
          <h3>{job.position}</h3>
          <p className="company"><Icon name="building" size={13} />{job.company}</p>
        </div>
        {!overlay && (
          <button
            className="drag-handle"
            type="button"
            aria-label={`Drag ${job.position}`}
            title="Drag to update status"
            {...attributes}
            {...listeners}
          >
            <Icon name="grip" size={19} />
          </button>
        )}
      </div>

      <div className="card-meta">
        <span><Icon name="calendar" size={13} /> Added {formatDate(job.appliedDate)}</span>
        {job.followUpSentAt
          ? <span className="followup-sent"><Icon name="mail" size={12} /> Follow-up sent</span>
          : job.resumeScore > 0 && <span className="ai-score"><Icon name="sparkles" size={12} /> {job.resumeScore}% match</span>}
      </div>

      <div className="card-footer">
        <label className={`status-select status-${job.status.toLowerCase()}`}>
          <span className="status-dot" style={{ backgroundColor: STATUS_META[job.status]?.color }} />
          <span className="sr-only">Status for {job.position}</span>
          <select value={job.status} onChange={(event) => onStatusChange(job._id, event.target.value)}>
            {STATUSES.map((status) => <option value={status} key={status}>{status}</option>)}
          </select>
        </label>
        <button
          className="icon-button delete-btn"
          type="button"
          aria-label={`Delete ${job.position} at ${job.company}`}
          onClick={() => onDelete(job)}
        >
          <Icon name="trash" size={15} />
        </button>
      </div>
    </motion.article>
  )

  if (overlay) return card

  return (
    <div ref={setNodeRef} style={style} className="draggable-card">
      {card}
    </div>
  )
}

function KanbanColumn({ status, jobs, onDelete, onStatusChange }) {
  const { isOver, setNodeRef } = useDroppable({ id: status })
  const meta = STATUS_META[status]

  return (
    <motion.section
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'column-is-over' : ''}`}
      style={{ '--status-color': meta.color }}
      layout
    >
      <header className="column-header">
        <div className="column-title">
          <span className="column-accent" />
          <span>{meta.label}</span>
        </div>
        <span className="count" aria-label={`${jobs.length} applications`}>{jobs.length}</span>
      </header>
      <div className="column-cards">
        <AnimatePresence mode="popLayout" initial={false}>
          {jobs.map((job) => (
            <JobCard
              job={job}
              key={job._id}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))}
        </AnimatePresence>
        {jobs.length === 0 && (
          <motion.div className="column-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="column-empty-icon"><Icon name="briefcase" size={17} /></span>
            <span>Drop an application here</span>
          </motion.div>
        )}
      </div>
    </motion.section>
  )
}

export default function KanbanBoard({ jobs, onDelete, onStatusChange }) {
  const [activeId, setActiveId] = useState(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  )
  const groupedJobs = useMemo(() => Object.fromEntries(
    STATUSES.map((status) => [status, jobs.filter((job) => job.status === status)]),
  ), [jobs])
  const activeJob = jobs.find((job) => job._id === activeId)

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null)
    if (!over) return
    const nextStatus = over.id
    const currentStatus = active.data.current?.status
    if (STATUSES.includes(nextStatus) && nextStatus !== currentStatus) {
      onStatusChange(active.id, nextStatus)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
      <LayoutGroup>
        <div className="kanban-scroll" role="region" aria-label="Application status board" tabIndex="0">
          <div className="kanban-board">
            {STATUSES.map((status) => (
              <KanbanColumn
                status={status}
                jobs={groupedJobs[status]}
                key={status}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        </div>
        <DragOverlay dropAnimation={{ duration: 220, easing: 'ease-out' }}>
          {activeJob ? <JobCard job={activeJob} overlay /> : null}
        </DragOverlay>
      </LayoutGroup>
    </DndContext>
  )
}
