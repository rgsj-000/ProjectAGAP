const prohibited=/(evacuation order|evacuation route|area is safe|allocate relief|risk (?:is|=) \d+)/i;
export function assertSafeAiWording(text:string){if(prohibited.test(text))throw new Error("Prohibited AI content detected.");return text}
