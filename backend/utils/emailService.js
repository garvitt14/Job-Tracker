const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

const sendStatusEmail = async (to, jobDetails) => {
  const { position, company, status } = jobDetails

  const statusMessages = {
    Interview: {
      subject: `Interview scheduled — ${position} at ${company}`,
      color: '#f59e0b',
      emoji: '🎯',
      message: 'Great news! You have an interview coming up.',
      tip: 'Research the company thoroughly and prepare your answers for common interview questions.'
    },
    Offer: {
      subject: `Offer received — ${position} at ${company}`,
      color: '#10b981',
      emoji: '🎉',
      message: 'Congratulations! You received a job offer!',
      tip: 'Take your time to evaluate the offer. Consider salary, benefits, growth opportunities, and company culture.'
    }
  }

  const template = statusMessages[status]
  if (!template) return

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;">
        <div style="background:${template.color};padding:32px;text-align:center;">
          <div style="font-size:48px;margin-bottom:8px;">${template.emoji}</div>
          <h1 style="color:white;margin:0;font-size:22px;">Job Tracker Update</h1>
        </div>
        <div style="padding:32px;">
          <p style="color:#94a3b8;font-size:15px;margin:0 0 24px 0;">${template.message}</p>
          <div style="background:#0f172a;border-radius:12px;padding:20px;margin-bottom:24px;">
            <div style="margin-bottom:12px;">
              <span style="color:#64748b;font-size:12px;text-transform:uppercase;">Position</span>
              <p style="color:#e2e8f0;font-size:16px;font-weight:600;margin:4px 0 0 0;">${position}</p>
            </div>
            <div style="margin-bottom:12px;">
              <span style="color:#64748b;font-size:12px;text-transform:uppercase;">Company</span>
              <p style="color:#e2e8f0;font-size:16px;font-weight:600;margin:4px 0 0 0;">${company}</p>
            </div>
            <div>
              <span style="color:#64748b;font-size:12px;text-transform:uppercase;">Status</span>
              <p style="color:${template.color};font-size:16px;font-weight:600;margin:4px 0 0 0;">${status}</p>
            </div>
          </div>
          <div style="background:#1e3a5f;border-radius:8px;padding:16px;">
            <p style="color:#93c5fd;font-size:13px;margin:0;"><strong>Tip:</strong> ${template.tip}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  await resend.emails.send({
    from: 'Job Tracker <onboarding@resend.dev>',
    to,
    subject: template.subject,
    html
  })
}

module.exports = { sendStatusEmail }