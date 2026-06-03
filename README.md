# Unstructured.AI - Data Format Converter

A local, privacy-first data conversion tool powered by Google Gemini 2.5, designed to convert and normalize messy JSON, XML, and CSV data into clean, RFC-compliant output.

## Executive Summary

**Unstructured.AI** is a Node.js application that leverages the Vercel AI SDK and Google Gemini to intelligently convert unstructured or malformed data between JSON, XML, and CSV formats. The system enforces strict RFC compliance, automatic data normalization (names, phone numbers, emails, dates), and field consolidation across format conversions.

### Key Features

- 🔄 **Format Conversion**: Convert between JSON, XML, and CSV with automatic format detection
- 🧹 **Smart Normalization**: Automatically normalizes names (title case), phone numbers, email addresses (lowercase), and dates (ISO 8601)
- ✅ **RFC Compliance**: Enforces RFC 4180 (CSV), RFC 8259 (JSON), and XML well-formedness
- 📧 **Email Delivery**: Optional email delivery of conversion results
- 🔐 **Privacy-First**: API keys stay on your local backend; browser never touches credentials
- ⚡ **Real-Time Streaming**: Stream conversion results directly to browser
- 🎯 **Field Consolidation**: Intelligently maps inconsistent field names (e.g., `fname`, `first_name`, `f_name` → standardized `first_name`)

### Architecture

```
User Browser (SPA) ─── POST /api/chat ─── Express Server ─── Gemini API
                                              ↓
                                          Email Service
                                          (Hover SMTP)
```

- **Frontend**: Alpine.js SPA (no build step required)
- **Backend**: Express.js with streaming response
- **AI Model**: Google Gemini 2.5 Flash (default) or Gemini 2.5 Pro
- **Email**: Hover SMTP server (optional)
- **Security**: API keys stored in `.env` on backend only

---

## End User Documentation

### Getting Started

#### Prerequisites

- [Node.js](https://nodejs.org/) 18 or higher
- A [Google AI Studio](https://aistudio.google.com/apikey) API key (free tier available)
- Optional: Email account credentials for result delivery

#### Installation

1. **Clone or download the project**
   ```bash
   cd UnstructuredData
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Create .env file (or edit existing one)
   GOOGLE_GENERATIVE_AI_API_KEY="your-api-key-here"
   
   # Optional: Email configuration
   SMTP_HOST="mail.hover.com"
   SMTP_PORT="465"
   SMTP_SECURE="true"
   SMTP_USER="your-email@domain.com"
   SMTP_PASSWORD="your-password"
   ```

4. **Start the server**
   ```bash
   npm run server
   ```

5. **Open in browser**
   ```
   http://localhost:5000
   ```

### Using the Application

#### Basic Workflow

1. **Enter Conversion Request**
   - Paste your data (CSV, JSON, or XML) into the textarea
   - Describe what you want: e.g., "Convert this CSV to JSON"
   - The AI will auto-detect the source format

2. **Optional: Provide Email**
   - Enter your email address to receive the result
   - Leave blank to skip email delivery

3. **Click Send**
   - Watch the conversion stream in real-time
   - Results appear below as they're generated

4. **Review Results**
   - Scroll through the formatted output
   - Copy to clipboard as needed

#### Example Conversions

**CSV to JSON:**
```
Input Format: CSV
Input Data:
  Name,Email,Phone
  John Doe,john@example.com,555-1234
  
Output: Properly formatted JSON array with normalized fields
```

**XML to CSV:**
```
Input Format: XML (with nested structure)
Input Data:
  <records>
    <person>
      <fname>alice</fname>
      <email>ALICE@EXAMPLE.COM</email>
    </person>
  </records>
  
Output: Flat CSV with consolidated headers (fname → name)
```

**Data Normalization Examples**
- Names: `JOHN` → `John` (title case)
- Emails: `User@Example.COM` → `user@example.com` (lowercase)
- Phones: `(555) 123-4567` → `555-123-4567` (standardized format)
- Dates: `01/15/2024` → `2024-01-15` (ISO 8601)

### Email Results

When you provide an email address:
- Results are sent to your inbox in HTML format
- Professional email template with formatted conversion output
- Includes metadata summary of operations performed

### Health Check

Verify the server is running:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "ok": true,
  "hasApiKey": true,
  "model": "gemini-2.5-flash"
}
```

---

## Developer Setup

### Project Structure

```
UnstructuredData/
├── index.js                 # CLI entry point for batch processing
├── server.js                # Express server with streaming API
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables (not committed)
├── .env.example             # Environment template
│
├── lib/
│   ├── env.js               # dotenv configuration loader
│   ├── prompts.js           # System prompt and model configuration
│   ├── emailService.js      # Email sending via SMTP
│   ├── stripMarkdownFences.js # Markdown code fence stripper
│   └── formatApiError.js    # Error message formatter
│
├── public/
│   └── index.html           # Alpine.js SPA frontend
│
└── test/
    └── fixtures/
        └── sample.xml       # Test data fixture
```

### Dependencies

Core dependencies:
- `express@5.2.1` - HTTP server framework
- `@ai-sdk/google@3.0.80` - Google AI provider for Vercel AI SDK
- `ai@6.0.193` - Vercel AI SDK with streaming support
- `nodemailer@6.x` - Email delivery
- `cors@2.8.6` - Cross-origin resource sharing
- `dotenv@17.4.2` - Environment variable loader

### Development Workflow

#### Run CLI for quick testing:
```bash
npm run cli
```
This runs `index.js` with sample CSV data through the conversion pipeline.

#### Run the server:
```bash
npm run server
```
Starts Express on port 5000 (configurable via `PORT` env var).

#### Test the API directly:

**Data Conversion:**
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Convert this CSV to JSON:\nName,Email\nJohn,john@example.com",
    "email": "optional@example.com"
  }'
```

**Test Email:**
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Convert this CSV to JSON:\nName,Email\nJohn,john@example.com",
    "email": "your-email@example.com"
  }'
```

### Key Files Explained

#### `server.js`
- Express server with `/api/chat` POST endpoint
- Streams Gemini responses in real-time
- Handles email delivery if recipient provided
- `/api/test-email` for testing email configuration
- `/api/health` for health checks

#### `lib/prompts.js`
- `masterSystemPrompt`: 1000+ line instruction set enforcing:
  - RFC-compliant output formatting
  - Data normalization rules
  - Field consolidation strategies
  - Error handling procedures
- Model configuration and sample data

#### `lib/emailService.js`
- Initializes SMTP transporter with Hover credentials
- `sendConversionEmail()`: Sends formatted email with results
- HTML email template with styling
- Error handling and logging

#### `public/index.html`
- Alpine.js SPA (no build step)
- Real-time streaming via `ReadableStream`
- Responsive dark theme UI
- Optional email input field
- Health check status display

### Environment Variables

```bash
# Required
GOOGLE_GENERATIVE_AI_API_KEY="..."  # From aistudio.google.com

# Optional
GEMINI_MODEL="gemini-2.5-flash"     # Default model
PORT="5000"                          # Server port

# Email (optional)
SMTP_HOST="mail.hover.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="your-email@domain.com"
SMTP_PASSWORD="your-password"
```

### Running Tests

Currently, the project uses manual testing via curl or the web UI. To add automated tests:

1. Create test files in `test/` directory
2. Use a test runner like Jest or Mocha
3. Test fixtures are available in `test/fixtures/`

### Common Tasks

**Change the AI Model:**
```bash
# In .env
GEMINI_MODEL="gemini-2.5-pro"
```

**Adjust Server Port:**
```bash
# In .env
PORT="3000"
```

**Test Email Configuration:**
```bash
curl -X POST http://localhost:5000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Debug Streaming Issues:**
- Check browser console for network errors
- Review server logs: `tail -f /tmp/gemini-server.log`
- Verify markdown fence stripping in `lib/stripMarkdownFences.js`

### Troubleshooting

**"API key not found" error:**
- Verify `GOOGLE_GENERATIVE_AI_API_KEY` is set in `.env`
- Restart server after updating `.env`

**"Email delivery failed":**
- Verify SMTP credentials in `.env`
- Check Hover account allows SMTP access
- Review server logs for authentication errors

**"Model returned no output":**
- Check API quota limits
- Verify API key has proper permissions
- Try switching model: `GEMINI_MODEL="gemini-2.5-flash"`

**Conversion seems incomplete:**
- Check browser console for errors
- Verify Gemini response streaming isn't being interrupted
- Try with smaller dataset first

### Performance Considerations

- **Streaming**: Responses stream in real-time; large conversions still appear incremental
- **Backend Processing**: Uses Google's servers; latency depends on internet connection
- **Email Delivery**: Async; non-blocking to user experience
- **Browser Memory**: Large outputs (>10MB) may cause browser slowdown; consider chunking

### Security Notes

- ✅ API keys never sent to browser
- ✅ Email credentials stored locally in `.env`
- ✅ CORS enabled for development; configure for production
- ⚠️ Use HTTPS in production
- ⚠️ Validate and sanitize user input in production deployment
- ⚠️ Never commit `.env` file with real credentials

### Deployment

For production:
1. Use environment variable management (AWS Secrets, Vercel Env, etc.)
2. Enable HTTPS/SSL
3. Configure CORS appropriately
4. Add authentication/authorization layer
5. Implement rate limiting
6. Monitor API usage and costs
7. Set up error tracking (Sentry, etc.)

### Contributing

To add features:
1. Update system prompt in `lib/prompts.js` for AI behavior changes
2. Add routes to `server.js` for new endpoints
3. Update `public/index.html` for UI changes
4. Test email delivery with `/api/test-email`
5. Verify markdown fence stripping handles edge cases

---

## Support

For issues or questions:
1. Check server logs: `tail -f /tmp/gemini-server.log`
2. Verify `.env` configuration
3. Test with `/api/health` endpoint
4. Review example requests above

---

**Version**: 1.0.0  
**Last Updated**: June 2026  
**License**: MIT
