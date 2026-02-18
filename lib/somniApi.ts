const BASE = process.env.NEXT_PUBLIC_SOMNI_API_BASE || 'https://somni-peach.vercel.app';

async function post(path: string, body: any) {
  const res = await fetch(BASE.replace(/\/$/, '') + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || res.statusText || 'API error');
  return data;
}

export async function extractSetting(rawText: string, existingSettings?: any) {
  return post('/extract', { raw_text: rawText, existing_settings: existingSettings || null });
}

export async function checkConsistency(rawText: string, settingData: any) {
  return post('/consistency', { raw_text: rawText, setting_data: settingData });
}

export async function extractTimeline(rawText: string, settingData?: any) {
  return post('/timeline', { raw_text: rawText, setting_data: settingData || null });
}

export default { extractSetting, checkConsistency, extractTimeline };
