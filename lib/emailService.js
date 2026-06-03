import nodemailer from "nodemailer";

let transporter = null;

/**
 * Initialize the email transporter with Hover SMTP credentials
 */
function initializeTransporter() {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpSecure = process.env.SMTP_SECURE === "true";

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
    console.warn(
      "Warning: Email credentials not configured. Email functionality disabled.",
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort, 10),
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });

  return transporter;
}

/**
 * Send conversion result via email
 * @param {string} recipientEmail - Recipient email address
 * @param {string} content - The conversion result content
 * @returns {Promise<boolean>} - True if sent successfully, false otherwise
 */
export async function sendConversionEmail(recipientEmail, content) {
  if (!recipientEmail || !recipientEmail.trim()) {
    return false;
  }

  const transport = initializeTransporter();
  if (!transport) {
    console.log(
      "Email service not configured. Skipping email for:",
      recipientEmail,
    );
    return false;
  }

  try {
    const senderEmail = process.env.SMTP_USER;
    const mailOptions = {
      from: senderEmail,
      to: recipientEmail.trim(),
      subject: "Your Data Conversion Result - Unstructured.AI",
      text: `Hello,\n\nHere is your data conversion result:\n\n${content}\n\nBest regards,\nUnstructured.AI`,
      html: `
        <html>
          <head>
            <style>
              body { font-family: system-ui, sans-serif; line-height: 1.5; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
              .result { background-color: #1a2330; color: #e7ecf3; padding: 15px; border-radius: 6px; font-family: monospace; white-space: pre-wrap; overflow-x: auto; }
              .footer { margin-top: 20px; font-size: 0.9em; color: #6b7c90; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0;">🤖 Unstructured.AI - Data Conversion Result</h2>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p>Your data has been successfully converted. Here is the result:</p>
                <div class="result">${escapeHtml(content)}</div>
                <div class="footer">
                  <p>This email was sent from Unstructured.AI Data Format Converter.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    await transport.sendMail(mailOptions);
    console.log(`Email sent successfully to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error.message);
    return false;
  }
}

/**
 * Escape HTML special characters for safe email rendering
 */
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
