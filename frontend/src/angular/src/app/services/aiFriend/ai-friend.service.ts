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
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AiConfig } from 'src/app/model/aiFriend/ai-config';
import { AiMessage } from 'src/app/model/aiFriend/ai-message';

@Injectable({
  providedIn: 'root'
})
export class AiFriendService {

  constructor(private http: HttpClient) { }
  
  public getAiConfig(): Observable<AiConfig> {
	  return this.http.get<AiConfig>('/rest/aifriend/config');
  }
  
  public postTalkToSam(aiMessage: AiMessage): Observable<string> {
	  return this.http.post<string>('/rest/aifriend/talk', aiMessage);
  }
}
