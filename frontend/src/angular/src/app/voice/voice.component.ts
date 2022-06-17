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
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { VoiceService } from '../services/voice.service';

@Component({
  selector: 'app-voice',
  templateUrl: './voice.component.html',
  styleUrls: ['./voice.component.scss']
})
export class VoiceComponent implements OnInit {
  @ViewChild('caller_video') callerVideo: ElementRef;
  @ViewChild('called_video') calledVideo: ElementRef;
  
  callerVideoActivated = false;
  calledVideoActivated = false;
  callerMuted = false;
  calledMuted = false;
  
  private peerConnection: RTCPeerConnection;
  private localStream: MediaStream;
  
  constructor(private voiceService: VoiceService) { }

  ngOnInit(): void {
  }

}
