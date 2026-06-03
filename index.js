import './lib/env.js';
import { streamText } from 'ai';
import {
  conversionModel,
  conversionOptions,
  masterSystemPrompt,
  sampleInputData,
} from './lib/prompts.js';
import { createFenceStripper } from './lib/stripMarkdownFences.js';

async function runLocalPipeline() {
  const rawInputData = sampleInputData;

  try {
    const result = await streamText({
      model: conversionModel,
      system: masterSystemPrompt,
      prompt: `Please convert this CSV data to valid JSON: \n\n${rawInputData}`,
      ...conversionOptions,
    });

    const stripFences = createFenceStripper();
    for await (const textChunk of result.textStream) {
      const cleaned = stripFences(textChunk);
      if (cleaned) process.stdout.write(cleaned);
    }
    console.log('\n');
  } catch (error) {
    console.error('Local pipeline error:', error);
    process.exit(1);
  }
}

runLocalPipeline();
