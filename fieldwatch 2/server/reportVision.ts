export type HostType =
  | 'CATTLE'
  | 'SHEEP_GOAT'
  | 'SWINE'
  | 'POULTRY'
  | 'MAIZE'
  | 'CASSAVA'
  | 'WHEAT_GRAIN';

const HOSTS: HostType[] = ['CATTLE', 'SHEEP_GOAT', 'SWINE', 'POULTRY', 'MAIZE', 'CASSAVA', 'WHEAT_GRAIN'];

export interface SymptomOption {
  id: string;
  name: string;
  hosts: string[];
}

export interface PhotoAnalysis {
  hostType: HostType | null;
  symptomIds: string[];
  totalAnimalsOrAcres: number | null;
  affectedCount: number | null;
  mortalityCount: number | null;
  notes: string;
  confidence: 'low' | 'medium' | 'high';
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super('AI photo analysis is not configured (OPENAI_API_KEY is missing).');
  }
}

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

function isConfigured(key: string | undefined): key is string {
  return Boolean(key && key.trim() !== '' && key !== 'MY_OPENAI_API_KEY');
}

const toCount = (value: unknown, min: number): number | null => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n >= min && n < 1_000_000 ? Math.round(n) : null;
};

/**
 * Ask a vision model to describe what a photo shows in FieldWatch's own terms
 * (species/crop and a subset of the known symptoms). The result is only a suggestion:
 * the farmer reviews and approves it before anything is submitted.
 */
export async function analyzeIncidentPhoto(
  image: string,
  symptoms: SymptomOption[]
): Promise<PhotoAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!isConfigured(apiKey)) throw new AiNotConfiguredError();

  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(image);
  if (!match) throw new Error('Please upload a JPEG, PNG or WebP image.');
  if (Buffer.byteLength(match[2], 'base64') > MAX_IMAGE_BYTES) {
    throw new Error('That image is too large. Please use one under 6 MB.');
  }

  const symptomList = symptoms
    .map((s) => `- ${s.id}: ${s.name} (applies to: ${s.hosts.join(', ')})`)
    .join('\n');

  const system = `You help smallholder farmers report livestock and crop health problems. Look at the photo and describe only what is actually visible.

Return a JSON object with exactly these keys:
- "hostType": one of ${HOSTS.join(', ')}, or null if the photo does not clearly show one of these animals or crops
- "symptomIds": array of symptom ids that are clearly visible, chosen ONLY from the list below and only ones that apply to the chosen hostType. Use [] if none are visible.
- "totalAnimalsOrAcres": integer, only if the number of animals or plants in the photo can be counted, otherwise null
- "affectedCount": integer, the number of animals or plants visibly affected, or null if unclear
- "mortalityCount": integer, the number of dead animals or plants visible, or null if unclear
- "notes": one or two plain sentences describing what you see, written for a veterinary officer
- "confidence": "low", "medium" or "high"

Never guess counts, and prefer null or an empty list over speculation. Do not diagnose a disease by name.

Known symptoms:
${symptomList}`;

  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey.trim()}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this photo for a FieldWatch incident report.' },
            { type: 'image_url', image_url: { url: image, detail: 'low' } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error('Photo analysis API error:', response.status, await response.text());
    throw new Error('The AI service could not analyze the photo. Please try again or fill in the form manually.');
  }

  const data = await response.json();
  let parsed: any;
  try {
    parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
  } catch {
    throw new Error('The AI returned an unreadable answer. Please try again or fill in the form manually.');
  }

  // Never trust the model's output: keep only values FieldWatch understands
  const hostType: HostType | null = HOSTS.includes(parsed.hostType) ? parsed.hostType : null;
  const allowed = new Set(symptoms.filter((s) => hostType && s.hosts.includes(hostType)).map((s) => s.id));
  const symptomIds: string[] = Array.isArray(parsed.symptomIds)
    ? Array.from(new Set(parsed.symptomIds.filter((id: unknown) => typeof id === 'string' && allowed.has(id))))
    : [];

  return {
    hostType,
    symptomIds,
    totalAnimalsOrAcres: toCount(parsed.totalAnimalsOrAcres, 1),
    affectedCount: toCount(parsed.affectedCount, 0),
    mortalityCount: toCount(parsed.mortalityCount, 0),
    notes: typeof parsed.notes === 'string' ? parsed.notes.trim().slice(0, 500) : '',
    confidence: ['low', 'medium', 'high'].includes(parsed.confidence) ? parsed.confidence : 'low',
  };
}
