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
import { Injectable } from '@angular/core';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';
import {environment} from '../../environments/environment';
import {Subject} from 'rxjs';
import {VoiceMsg} from '../model/voice-msg';

export const WS_ENDPOINT = environment.wsPath;

export class RTCPeerConnectionContainer{
	constructor(public localId: string, public remoteId: string, public rtcPeerConnection: RTCPeerConnection){}
}

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  public peerConnections = new Map<string, RTCPeerConnectionContainer>();
  public pendingCandidates = new Map<string, RTCIceCandidateInit[]>();
  private socket$: WebSocketSubject<any>;
  private messagesSubject = new Subject<VoiceMsg>();
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public messages$ = this.messagesSubject.asObservable();

  public connect(): void {

    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = this.getNewWebSocket();

      this.socket$.subscribe(
        // Called whenever there is a message from the server
        msg => {
          console.log('Received message of type: ' + msg.type);
          this.messagesSubject.next(msg);
        }
      );
    }
  }

  sendMessage(msg: VoiceMsg): void {
    console.log('sending message: ' + msg.type + ' sid: '+msg.sid +' remoteId: '+msg.remoteId);
    this.socket$.next(msg);
  }

  private getNewWebSocket(): WebSocketSubject<any> {
    return webSocket({
      url: WS_ENDPOINT,
      openObserver: {
        next: () => {
          console.log('[DataService]: connection ok');
        }
      },
      closeObserver: {
        next: () => {
          console.log('[DataService]: connection closed');
          this.socket$ = undefined;
          this.connect();
        }
      }
    });
  }
}
