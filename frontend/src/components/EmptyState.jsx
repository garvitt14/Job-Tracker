import { motion } from 'framer-motion'
import Icon from './Icons'

export default function EmptyState({
  icon = 'briefcase',
  title = 'Your next opportunity starts here',
  description = 'Add your first application and move it through your pipeline as you make progress.',
  actionLabel = 'Add your first application',
  onAction,
}) {
  return (
    <motion.section
      className="empty-state"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="empty-illustration" aria-hidden="true">
        <span className="empty-orbit empty-orbit-one" />
        <span className="empty-orbit empty-orbit-two" />
        <div className="empty-icon"><Icon name={icon} size={32} /></div>
        <span className="empty-dot empty-dot-one" />
        <span className="empty-dot empty-dot-two" />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {onAction && (
        <button className="btn-primary" onClick={onAction}>
          <Icon name="plus" size={17} />
          {actionLabel}
        </button>
      )}
    </motion.section>
  )
}
