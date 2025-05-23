/**
 *    Copyright 2018 Sven Loesekann
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */
export interface AiResultDto {
  result: AiResult;
  results: Array<AiResult>;
  metadata: AiMetadata;
}

export interface AiResults {
	metadata: ResultsMetadata;
	output: AiOutput;
}

export interface AiResult {
  metadata: AiMetadata;
  output: AiOutput;
}

export interface AiOutput {
  messageType: string;
  text: string;
  metadata: OutputMetadata;
  toolCalls: string[];
  media: string[];  
}

export interface OutputMetadata {
	messageType: string;
}

export interface ResultsMetadata {
	finishReason: string;
	contentFilters: string[];
	empty: boolean;
}

export interface ResultMetadata {
  contentFilterMetadata: unknown;
  finishReason: unknown;
}

export interface AiMetadata {
  id: string;
  model: string;
  rateLimit: RateLimit;
  usage: Usage;
  promptMetadata: string[];    
  empty: boolean;
}

export interface RateLimit {
  requestsLimit: number;
  requestsRemaining: number;
  requestsReset: string;
  tokensLimit: number;
  tokensRemaining: number;
  tokensReset: string;
}

export interface Usage {
  completionTokens: number;
  promptTokens: number;
  totalTokens: number;
}
