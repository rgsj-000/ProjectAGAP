const prohibited = [
 /\b(?:issue|give|create|send)\s+(?:an?\s+)?evacuation orders?\b/i,
 /\b(?:provide|create|suggest|recommend|give)\s+(?:an?\s+)?evacuation routes?\b/i,
 /\b(?:this|the)\s+area is safe\b/i,
 /\ballocate relief\b/i,
 /\brisk\s*(?:is|=)\s*\d+\b/i,
];

function isNegated(text: string, start: number) {
 const prefix = text.slice(Math.max(0, start - 32), start);
 return /\b(?:do not|don't|never|cannot|can't|must not|should not|not)\s+(?:\w+\s+){0,2}$/i.test(prefix);
}

export function assertSafeAiWording(text: string) {
 if (prohibited.some(rule => {
  const match = rule.exec(text);
  return match && !isNegated(text, match.index);
 })) throw new Error("Prohibited AI content detected.");
 return text;
}
