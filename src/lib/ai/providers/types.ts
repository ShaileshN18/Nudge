export interface AiProvider { generateJson<T>(prompt: string, options?: { temperature?: number; maxOutputTokens?: number }): Promise<T>; }
