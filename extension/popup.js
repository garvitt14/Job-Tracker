const elements = {
  settingsButton: document.querySelector('#settingsButton'),
  settingsPanel: document.querySelector('#settingsPanel'),
  apiUrl: document.querySelector('#apiUrl'),
  saveSettings: document.querySelector('#saveSettings'),
  loginView: document.querySelector('#loginView'),
  jobView: document.querySelector('#jobView'),
  loginForm: document.querySelector('#loginForm'),
  email: document.querySelector('#email'),
  password: document.querySelector('#password'),
  jobForm: document.querySelector('#jobForm'),
  position: document.querySelector('#position'),
  company: document.querySelector('#company'),
  jobDescription: document.querySelector('#jobDescription'),
  saveJob: document.querySelector('#saveJob'),
  sourceBadge: document.querySelector('#sourceBadge'),
  extractionNotice: document.querySelector('#extractionNotice'),
  accountLabel: document.querySelector('#accountLabel'),
  logoutButton: document.querySelector('#logoutButton'),
  status: document.querySelector('#status')
}

let session = { apiUrl: '', token: '', user: null }
let source = { sourceUrl: '', sourcePlatform: 'Extension' }

const normalizeApiUrl = (value) => {
  const clean = String(value || '').trim().replace(/\/+$/, '')
  if (!clean) return ''
  return clean.endsWith('/api') ? clean : `${clean}/api`
}

const showStatus = (message, type = 'success') => {
  elements.status.textContent = message
  elements.status.className = `status status-${type}`
  window.setTimeout(() => { elements.status.className = 'status hidden' }, 4200)
}

const setBusy = (button, busy, label) => {
  button.disabled = busy
  if (!button.dataset.label) button.dataset.label = button.textContent.trim()
  button.textContent = busy ? label : button.dataset.label
}

const saveSession = (values) => new Promise((resolve) => chrome.storage.local.set(values, resolve))

const renderSession = () => {
  const connected = Boolean(session.token)
  elements.loginView.classList.toggle('hidden', connected)
  elements.jobView.classList.toggle('hidden', !connected)
  elements.accountLabel.textContent = connected ? `Connected as ${session.user?.email || 'tracker user'}` : ''
  elements.apiUrl.value = session.apiUrl
  if (connected) extractCurrentPage()
}

const apiFetch = async (path, options = {}) => {
  if (!session.apiUrl) throw new Error('Add your tracker API URL in settings first.')
  const response = await fetch(`${session.apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...options.headers
    }
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || data.errors?.[0]?.msg || `Request failed (${response.status})`)
  return data
}

const extractCurrentPage = async () => {
  elements.sourceBadge.textContent = 'Reading this page…'
  elements.extractionNotice.classList.add('hidden')
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) throw new Error('No active tab found.')
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_CURRENT_JOB' })
    if (!response?.ok) throw new Error(response?.error || 'This page is not supported.')
    const data = response.data
    elements.position.value = data.position || ''
    elements.company.value = data.company || ''
    elements.jobDescription.value = data.jobDescription || ''
    source = { sourceUrl: data.sourceUrl, sourcePlatform: data.sourcePlatform }
    elements.sourceBadge.textContent = `${data.sourcePlatform} · Ready to review`
    if (!response.complete) {
      elements.extractionNotice.textContent = 'Some fields could not be detected. Review and complete them manually before saving.'
      elements.extractionNotice.classList.remove('hidden')
    }
  } catch (error) {
    elements.sourceBadge.textContent = 'Manual entry'
    elements.extractionNotice.textContent = 'Open a supported LinkedIn or Naukri job detail page, or enter the details manually.'
    elements.extractionNotice.classList.remove('hidden')
  }
}

elements.settingsButton.addEventListener('click', () => elements.settingsPanel.classList.toggle('hidden'))

elements.saveSettings.addEventListener('click', async () => {
  const apiUrl = normalizeApiUrl(elements.apiUrl.value)
  if (!apiUrl || !/^https?:\/\//.test(apiUrl)) return showStatus('Enter a valid http(s) API URL.', 'error')
  session.apiUrl = apiUrl
  await saveSession({ apiUrl })
  elements.settingsPanel.classList.add('hidden')
  showStatus('API settings saved.')
})

elements.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  session.apiUrl = normalizeApiUrl(elements.apiUrl.value || session.apiUrl)
  if (!session.apiUrl) {
    elements.settingsPanel.classList.remove('hidden')
    return showStatus('Add your tracker API URL first.', 'error')
  }
  setBusy(event.submitter, true, 'Connecting…')
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: elements.email.value, password: elements.password.value })
    })
    session.token = data.token
    session.user = data.user
    await saveSession({ apiUrl: session.apiUrl, token: data.token, user: data.user })
    elements.password.value = ''
    renderSession()
    showStatus('Tracker connected.')
  } catch (error) {
    showStatus(error.message, 'error')
  } finally {
    setBusy(event.submitter, false)
  }
})

elements.jobForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  setBusy(elements.saveJob, true, 'Saving…')
  try {
    await apiFetch('/jobs', {
      method: 'POST',
      body: JSON.stringify({
        position: elements.position.value.trim(),
        company: elements.company.value.trim(),
        jobDescription: elements.jobDescription.value.trim(),
        status: 'Applied',
        sourceUrl: source.sourceUrl,
        sourcePlatform: source.sourcePlatform
      })
    })
    showStatus('Saved to your Applied column. You can close this popup.')
    elements.saveJob.dataset.label = 'Saved ✓'
    elements.saveJob.textContent = 'Saved ✓'
  } catch (error) {
    if (/token|access denied/i.test(error.message)) {
      session.token = ''
      await saveSession({ token: '' })
      renderSession()
    }
    showStatus(error.message, 'error')
  } finally {
    setBusy(elements.saveJob, false)
  }
})

elements.logoutButton.addEventListener('click', async () => {
  session.token = ''
  session.user = null
  await saveSession({ token: '', user: null })
  renderSession()
  showStatus('Tracker disconnected.')
})

chrome.storage.local.get(['apiUrl', 'token', 'user'], (stored) => {
  session = { apiUrl: stored.apiUrl || '', token: stored.token || '', user: stored.user || null }
  const missingUrl = !session.apiUrl
  elements.settingsPanel.classList.toggle('hidden', !missingUrl)
  renderSession()
})
