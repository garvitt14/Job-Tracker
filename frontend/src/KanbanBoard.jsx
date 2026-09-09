import { useState } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor,
  useSensor, useSensors, useDraggable, useDroppable
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

function Card({ job, status, statusColors, statuses, onStatusChange, onDelete, dragging }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job._id,
    data: { status },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="card" {...attributes}>
      <div className="card-top">
        {/* Drag handle: keeps the delete button and status <select> independently clickable */}
        <div className="card-drag-handle" {...listeners}>
          <h3>{job.position}</h3>
          <p className="company">{job.company}</p>
        </div>
        <button className="delete-btn" onClick={() => onDelete(job._id)}>×</button>
      </div>
      <p className="date">{new Date(job.appliedDate).toLocaleDateString()}</p>
      <select
        value={job.status}
        onChange={e => onStatusChange(job._id, e.target.value)}
        style={{ borderColor: statusColors[job.status] }}
      >
        {statuses.map(s => <option key={s}>{s}</option>)}
      </select>
    </div>
  )
}

function Column({ status, statusColors, jobs, statuses, onStatusChange, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="column">
      <div className="column-header" style={{ borderColor: statusColors[status] }}>
        <span>{status}</span>
        <span className="count">{jobs.length}</span>
      </div>
      <div ref={setNodeRef} className={isOver ? 'cards cards-drop-target' : 'cards'}>
        {jobs.map(job => (
          <Card
            key={job._id}
            job={job}
            status={status}
            statusColors={statusColors}
            statuses={statuses}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        ))}
        {jobs.length === 0 && <div className="column-empty">Drop here</div>}
      </div>
    </div>
  )
}

export default function KanbanBoard({ jobs, statuses, statusColors, onStatusChange, onDelete }) {
  const [activeJob, setActiveJob] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  )

  const handleDragStart = (event) => {
    const job = jobs.find(j => j._id === event.active.id)
    setActiveJob(job || null)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveJob(null)
    if (!over) return
    const newStatus = over.id
    const job = jobs.find(j => j._id === active.id)
    if (job && job.status !== newStatus) {
      onStatusChange(job._id, newStatus)
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="board">
        {statuses.map(status => (
          <Column
            key={status}
            status={status}
            statusColors={statusColors}
            jobs={jobs.filter(j => j.status === status)}
            statuses={statuses}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        ))}
      </div>
      <DragOverlay>
        {activeJob && (
          <div className="card card-overlay">
            <div className="card-top">
              <h3>{activeJob.position}</h3>
            </div>
            <p className="company">{activeJob.company}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
