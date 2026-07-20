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
    <body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacS