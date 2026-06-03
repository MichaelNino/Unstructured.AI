/**
 * Removes markdown code fences from model output while preserving plain text.
 * Handles streamed chunks where fences can be split across writes.
 */
export function createFenceStripper() {
  let buffer = '';
  let inFence = false;

  return function strip(chunk) {
    buffer += chunk;
    let output = '';

    while (buffer.length > 0) {
      if (inFence) {
        const closeIndex = buffer.indexOf('```');
        if (closeIndex === -1) {
          // Emit all content inside the fence except leave a few chars
          // in case the closing fence is split across chunks.
          if (buffer.length > 3) {
            output += buffer.slice(0, -3);
            buffer = buffer.slice(-3);
          }
          return output;
        }

        output += buffer.slice(0, closeIndex);
        buffer = buffer.slice(closeIndex + 3);
        inFence = false;
        continue;
      }

      const openMatch = buffer.match(/```[^\r\n]*\r?\n/);
      if (!openMatch) {
        if (buffer.length <= 3) {
          return output;
        }
        output += buffer.slice(0, -3);
        buffer = buffer.slice(-3);
        return output;
      }

      const openIndex = openMatch.index ?? 0;
      output += buffer.slice(0, openIndex);
      buffer = buffer.slice(openIndex + openMatch[0].length);
      inFence = true;
    }

    return output;
  };
}
