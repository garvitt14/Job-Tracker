const firstText = (selectors) => {
  for (const selector of selectors) {
    const element = document.querySelector(selector)
    const value = element?.innerText?.replace(/\s+/g, ' ').trim()
    if (value) return value
  }
  return ''
}

const extractLinkedIn = () => ({
  company: firstText([
    '.job-details-jobs-unified-top-card__company-name a',
    '.job-details-jobs-unified-top-card__company-name',
    '.topcard__org-name-link',
    '.topcard__flavor a'
  ]),
  position: firstText([
    '.job-details-jobs-unified-top-card__job-title h1',
    '.job-details-jobs-unified-top-card__job-title',
    '.top-card-layout__title',
    'main h1'
  ]),
  jobDescription: firstText([
    '.jobs-description__content',
    '.jobs-box__html-content',
    '.show-more-less-html__markup',
    '#job-details'
  ]),
  sourcePlatform: 'LinkedIn'
})

const extractNaukri = () => ({
  company: firstText([
    '[class*="jd-header-comp-name"]',
    '[class*="company-name"]',
    '.jd-header-comp-name',
    'header a[title]'
  ]),
  position: firstText([
    '[class*="jd-header-title"]',
    '.jd-header-title',
    'main h1',
    'h1'
  ]),
  jobDescription: firstText([
    '[class*="dang-inner-html"]',
    '[class*="job-desc-container"]',
    '.job-desc',
    '[class*="job-description"]'
  ]),
  sourcePlatform: 'Naukri'
})

const extractJob = () => {
  const isLinkedIn = location.hostname.endsWith('linkedin.com')
  const data = isLinkedIn ? extractLinkedIn() : extractNaukri()
  return {
    ...data,
    jobDescription: data.jobDescription.slice(0, 30000),
    sourceUrl: location.href
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'EXTRACT_CURRENT_JOB') return false
  try {
    const data = extractJob()
    sendResponse({ ok: true, data, complete: Boolean(data.company && data.position && data.jobDescription) })
  } catch (error) {
    sendResponse({ ok: false, error: error.message || 'Could not read this job page.' })
  }
  return true
})
