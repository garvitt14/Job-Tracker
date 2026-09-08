import Icon from './Icons'

export default function ResumeUpload({ file, onChange, id = 'resume-file', compact = false, onError }) {
  const handleChange = (event) => {
    const selected = event.target.files?.[0] || null
    if (selected && selected.size > 5 * 1024 * 1024) {
      event.target.value = ''
      onError?.('Resume must be 5 MB or smaller.')
      return
    }
    onChange(selected)
  }

  return (
    <div className={`resume-upload ${compact ? 'resume-upload-compact' : ''}`}>
      <input type="file" id={id} accept=".pdf,.docx" onChange={handleChange} />
      <label htmlFor={id} className={file ? 'resume-upload-label has-file' : 'resume-upload-label'}>
        <span className="upload-icon"><Icon name={file ? 'file' : 'upload'} size={compact ? 20 : 25} /></span>
        {file ? (
          <><strong>{file.name}</strong><span>Ready · Click to replace</span></>
        ) : (
          <><strong>Choose your resume</strong><span>PDF or DOCX · Maximum 5 MB</span></>
        )}
      </label>
    </div>
  )
}
