/**
 * RESUME PARSER SERVICE
 * ======================
 * WHAT THIS FILE DOES:
 * Takes an uploaded file's raw binary data (a "buffer") and its mimetype,
 * and extracts the plain text content from it — regardless of whether it's
 * a PDF or a DOCX file.
 *
 * WHY WE NEED THIS:
 * A PDF file isn't just "text with a .pdf extension" — it's a complex binary
 * format describing exact pixel positions, fonts, and layout. A .docx file
 * is actually a ZIP archive containing XML files describing the document
 * structure. Neither can be read as plain text directly — we need dedicated
 * libraries that understand each format's internal structure and know how
 * to pull just the text content back out.
 *
 * IF ASKED IN AN INTERVIEW: "I built a format-detection layer that routes
 * PDF buffers to pdf-parse and DOCX buffers to mammoth, normalizing both
 * into plain text before it hits our existing AI scoring pipeline — so the
 * scoring logic itself didn't need to change at all."
 */

// pdf-parse v2 changed its API from a simple function to a class-based one.
// Old (v1): const pdf = require('pdf-parse'); pdf(buffer).then(...)
// New (v2): const { PDFParse } = require('pdf-parse');
//           new PDFParse({ data: buffer }).getText()
const { PDFParse } = require('pdf-parse')
const mammoth = require('mammoth')

const SUPPORTED_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}

/**
 * Extracts plain text from an uploaded resume file buffer.
 * @param {Buffer} fileBuffer - the raw file data from multer
 * @param {string} mimetype - the file's MIME type (tells us PDF vs DOCX)
 * @returns {Promise<string>} - the extracted plain text
 */
async function extractResumeText(fileBuffer, mimetype) {
  const fileType = SUPPORTED_TYPES[mimetype]

  if (!fileType) {
    throw new Error(
      'Unsupported file type. Please upload a PDF or DOCX file.'
    )
  }

  if (fileType === 'pdf') {
    const parser = new PDFParse({ data: fileBuffer })
    const result = await parser.getText()
    return result.text.trim()
  }

  if (fileType === 'docx') {
    const result = await mammoth.extractRawText({ buffer: fileBuffer })
    return result.value.trim()
  }
}

module.exports = { extractResumeText, SUPPORTED_TYPES }
