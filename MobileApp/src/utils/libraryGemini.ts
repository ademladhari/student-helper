import { GEMINI_API_KEY, GEMINI_MODEL } from '../config/gemini';

export type LibraryFolderForAi = {
  name: string;
  files: Array<{ title: string; kindHint?: string }>;
};

function parseInsightsJson(raw: string): { summary: string; explanation: string } {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI response did not include a JSON object.');
  }
  const jsonSlice = raw.slice(start, end + 1);
  const parsed = JSON.parse(jsonSlice) as { summary?: string; explanation?: string };
  const summary = String(parsed.summary ?? '').trim();
  const explanation = String(parsed.explanation ?? '').trim();
  if (!summary && !explanation) {
    throw new Error('AI returned empty summary and explanation.');
  }
  return { summary, explanation };
}

export function buildLibraryContextForAi(folders: LibraryFolderForAi[]): string {
  if (folders.length === 0) {
    return '(No folders)';
  }

  const lines: string[] = [];
  for (const folder of folders) {
    if (folder.files.length === 0) {
      lines.push(`- Folder "${folder.name}": (empty)`);
      continue;
    }
    const items = folder.files.map(f =>
      f.kindHint ? `${f.title} (${f.kindHint})` : f.title,
    );
    lines.push(`- Folder "${folder.name}": ${items.join('; ')}`);
  }
  return lines.join('\n');
}

export async function fetchLibraryAiInsights(context: string): Promise<{ summary: string; explanation: string }> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('REPLACE_WITH')) {
    throw new Error('Add your Gemini API key in src/config/gemini.ts.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const prompt = `You are a supportive study assistant. The student's document library is described below ONLY by folder names and file titles (there is NO access to file contents—do not pretend you read inside files).

Produce helpful, encouraging text based only on what is listed.

Respond with ONLY valid JSON (no markdown code fences): {"summary":"...","explanation":"..."}.
- summary: 2–4 concise sentences describing what kinds of materials they appear to have and how full their library feels.
- explanation: one short paragraph of practical study advice: suggested order to tackle materials, how to combine reading with revision, reminders to pace themselves—all inferred only from filenames and folder names.

Library:
${context}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    let detail = '';
    try {
      const errBody = await response.json();
      detail = typeof errBody?.error?.message === 'string' ? errBody.error.message : JSON.stringify(errBody);
    } catch {
      detail = await response.text();
    }
    throw new Error(detail || `Gemini request failed (${response.status})`);
  }

  const payload = await response.json();
  const aiText = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!aiText || typeof aiText !== 'string') {
    throw new Error('Gemini returned an empty response.');
  }

  return parseInsightsJson(aiText);
}
