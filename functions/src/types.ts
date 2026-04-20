export type AiType = 'clinical_case' | 'educational' | 'vision';

export interface AskAiRequest {
  type: AiType;
  prompt: string;
  systemPrompt?: string;
  imageBase64?: string;
  model?: string;
}

export interface AskAiResponse {
  provider: string;
  model: string;
  text: string;
  cached: boolean;
  latencyMs: number;
  tokensIn?: number;
  tokensOut?: number;
}

export interface ProviderResult {
  text: string;
  model: string;
  tokensIn?: number;
  tokensOut?: number;
}

export interface ProviderCall {
  name: string;
  model: string;
  execute: () => Promise<ProviderResult>;
}

export interface QuotaDoc {
  count: number;
  limit: number;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface AiRequestLog {
  uid: string;
  type: AiType;
  provider: string;
  model: string;
  latencyMs: number;
  cacheHit: boolean;
  tokensIn: number;
  tokensOut: number;
  costEstimateEur: number;
  promptHash: string;
  createdAt: FirebaseFirestore.Timestamp;
}
