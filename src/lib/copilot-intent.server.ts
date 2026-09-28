/** Only routes to actions the Copilot backend currently supports. */
export type CopilotIntent = {
  action: "text" | "text-to-image" | "image-to-video" | "image-analyse" | "text-to-audio";
  cleanPrompt: string;
  displayCaption?: string;
  activity: string;
};

export function classifyCopilotRequest(prompt: string, hasAttachment: boolean): CopilotIntent {
  const text = prompt.trim();
  const image = text.match(/^\/(?:image|img|draw|art)\s*(.*)$/i) ??
    text.match(/^(?:please\s+)?(?:generate|create|render|paint|produce|make)\s+(?:a|an)?\s*(?:image|picture|photo|illustration|artwork|wallpaper)\s+(?:of|for|showing|depicting)\s+(.+)$/i);
  if (image) {
    const subject = image[1]?.trim() || text;
    return { action: "text-to-image", cleanPrompt: subject, displayCaption: `Generated image for "${subject}"`, activity: "Generating image" };
  }

  const video = text.match(/^\/(?:video|clip)\s*(.*)$/i) ??
    text.match(/^(?:please\s+)?(?:generate|create|render|produce|make)\s+(?:a|an)?\s*(?:video|animation|cinematic video|motion video)\s+(?:of|for|showing|depicting)\s+(.+)$/i);
  if (video) {
    const subject = video[1]?.trim() || text;
    return { action: "image-to-video", cleanPrompt: subject, displayCaption: `Rendered video for "${subject}"`, activity: "Generating video" };
  }

  const audio = text.match(/^\/(?:audio|tts|voice|speech)\s*(.*)$/i) ??
    text.match(/^(?:please\s+)?(?:generate|create|synthesize|produce)\s+(?:a|an)?\s*(?:audio|speech|voiceover|voice clip|spoken audio)\s+(?:of|for|reading|saying)\s+(.+)$/i);
  if (audio) {
    const subject = audio[1]?.trim() || text;
    return { action: "text-to-audio", cleanPrompt: subject, displayCaption: `Generated audio for "${subject}"`, activity: "Generating audio" };
  }

  if (hasAttachment) return { action: "image-analyse", cleanPrompt: text, activity: "Analyzing image" };

  return { action: "text", cleanPrompt: text.replace(/^\/(?:chat|ask)\s*/i, "").trim(), activity: "Thinking" };
}