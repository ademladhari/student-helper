import { GEMINI_API_KEY as KEY, GEMINI_MODEL as MODEL } from '@env';

export const GEMINI_API_KEY = typeof KEY === 'string' ? KEY.trim() : '';
export const GEMINI_MODEL = (typeof MODEL === 'string' && MODEL.trim()) || 'gemini-flash-latest';

if (__DEV__) {
	const keyLength = GEMINI_API_KEY ? GEMINI_API_KEY.length : 0;
	console.log('[Env] Gemini config', {
		keyLength,
		hasKey: keyLength > 0,
		model: GEMINI_MODEL,
	});
}
