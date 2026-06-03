import "./lib/env.js";
import { streamText } from "ai";
import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatApiError } from "./lib/formatApiError.js";
import { createFenceStripper } from "./lib/stripMarkdownFences.js";
import { sendConversionEmail } from "./lib/emailService.js";
import {
  conversionModel,
  conversionOptions,
  masterSystemPrompt,
} from "./lib/prompts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 5000;

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  const { prompt, messages, email } = req.body ?? {};

  let userPrompt = typeof prompt === "string" ? prompt.trim() : "";
  if (!userPrompt && Array.isArray(messages) && messages.length > 0) {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    userPrompt =
      typeof lastUser?.content === "string"
        ? lastUser.content
        : String(lastUser?.content ?? "");
  }

  if (!userPrompt) {
    res.status(400).json({ error: "A non-empty prompt is required." });
    return;
  }

  const recipientEmail = typeof email === "string" ? email.trim() : "";

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");

  let wroteBytes = false;

  try {
    const result = streamText({
      model: conversionModel,
      system: masterSystemPrompt,
      prompt: userPrompt,
      ...conversionOptions,
    });

    const stripFences = createFenceStripper();
    let fullResponse = "";

    for await (const chunk of result.textStream) {
      const cleaned = stripFences(chunk);
      if (cleaned) {
        wroteBytes = true;
        fullResponse += cleaned;
        res.write(cleaned);
      }
    }

    // Forces completion and surfaces API errors (quota, auth, etc.)
    await result.text;

    if (!wroteBytes) {
      throw new Error("Model returned no output");
    }

    // Send email if recipient provided
    if (recipientEmail) {
      const emailSent = await sendConversionEmail(recipientEmail, fullResponse);
      if (!emailSent) {
        res.write(
          `\n\n[Email delivery skipped - service not configured or invalid address]`,
        );
      }
    }
  } catch (error) {
    console.error("Chat stream error:", error);
    const message = formatApiError(error);

    if (!wroteBytes) {
      res.status(502).json({ error: message });
      return;
    }

    res.write(`\n\nERROR: ${message}`);
  } finally {
    if (!res.writableEnded) {
      res.end();
    }
  }
});

app.post("/api/test-email", async (req, res) => {
  const { email } = req.body ?? {};

  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email address is required" });
    return;
  }

  try {
    const testContent = `This is a test email from Unstructured.AI\n\n===== TEST CONVERSION RESULT =====\nFirst_Name,LASTname,Date Of Birth,Email Addr.,phone NUM\nDavid,Garcia,1967-11-26,david.garcia@example.com,(344) 101-6480\nMallory,Doe,1961-09-05,mallory.doe@example.com,527-8727\n===== END TEST =====\n\nIf you received this email, the email service is working correctly!`;

    const emailSent = await sendConversionEmail(email, testContent);

    if (emailSent) {
      res.json({ success: true, message: `Test email sent to ${email}` });
    } else {
      res.status(500).json({
        error: "Failed to send email. Check server logs for details.",
      });
    }
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    hasApiKey: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  });
});

app.listen(PORT, () => {
  console.log(`Local Gemini server: http://localhost:${PORT}`);
  console.log(`Chat API: http://localhost:${PORT}/api/chat`);
  console.log(`Model: ${process.env.GEMINI_MODEL ?? "gemini-2.5-flash"}`);
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.warn(
      "Warning: GOOGLE_GENERATIVE_AI_API_KEY is not set. Copy .env.example to .env and add your key.",
    );
  }
});
