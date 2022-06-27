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
 // based on: https://github.com/wliegel/youtube_webrtc_tutorial
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { VoiceService } from '../services/voice.service';
import { VoiceMsg} from '../model/voice-msg';
import { environment } from 'src/environments/environment';

const offerOptions = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

const mediaConstraints = {
  audio: true,
  video: {width: 1280, height: 720}
  // video: {width: 1280, height: 720} // 16:9
  // video: {width: 960, height: 540}  // 16:9
  // video: {width: 640, height: 480}  //  4:3
  // video: {width: 160, height: 120}  //  4:3
};

class RTCPeerConnectionContainer{
	constructor(public localId: string, public remoteId: string, public rtcPeerConnection: RTCPeerConnection){}
}

@Component({
  selector: 'app-voice',
  templateUrl: './voice.component.html',
  styleUrls: ['./voice.component.scss']
})
export class VoiceComponent implements AfterViewInit {
  @ViewChild('local_video') localVideo: ElementRef;
  @ViewChild('remote_video') remoteVideo: ElementRef;

  localVideoActivated = false;
  remoteMuted = false;
  localMuted = false;

  inCall = false;

  private peerConnections = new Map<string, RTCPeerConnectionContainer>();
  private pendingCandidates = new Map<string, RTCIceCandidateInit[]>();
  private localStream: MediaStream;

  constructor(private voiceService: VoiceService) { }

  async call(): Promise<void> {
    const peerConnectionContainer = this.createPeerConnection();
    this.peerConnections.set(peerConnectionContainer.localId, peerConnectionContainer);

    try {
      const offer = await this.peerConnections.get(peerConnectionContainer.localId).rtcPeerConnection.createOffer(offerOptions);
      // Establish the offer as the local peer's current description.
      await peerConnectionContainer.rtcPeerConnection.setLocalDescription(new RTCSessionDescription(offer));

      this.inCall = true;

      this.voiceService.sendMessage({type: 'offer', sid: peerConnectionContainer.localId, remoteId: null, data: offer});
    } catch (err) {
      this.handleGetUserMediaError(err, peerConnectionContainer.localId);
    }
  }

  hangUp(): void {
    this.voiceService.sendMessage({type: 'hangup', sid: null, remoteId: null, data: ''});
    this.closeVideoCall();
  }

  ngAfterViewInit(): void {
    this.addIncominMessageHandler();
    this.requestMediaDevices();
  }

  startLocalVideo(): void {
    console.log('starting local stream');
    if(!this.localVideoActivated) {
       this.localStream.getTracks().forEach(track => {
          track.enabled = true;
       });
       this.localVideo.nativeElement.srcObject = this.localStream;

       this.localVideoActivated = true;
    }
  }

  stopLocalVideo(): void {
    console.log('stop local stream');
    if(this.localVideoActivated) {
       this.localStream.getTracks().forEach(track => {
          track.enabled = false;
       });
       this.localVideo.nativeElement.srcObject = undefined;

       this.localVideoActivated = false;
    }
  }

  private addIncominMessageHandler(): void {
    this.voiceService.connect();
	const self = this;
    // this.transactions$.subscribe();
    this.voiceService.messages$.subscribe(
      msg => {
        console.log('Received message: ' + msg.type);
        // console.log(msg);
        switch (msg.type) {
          case 'offer':
            this.handleOfferMessage(msg, self);
            break;
          case 'answer':
            this.handleAnswerMessage(msg, self);
            break;
          case 'hangup':
            this.handleHangupMessage(msg, self);
            break;
          case 'ice-candidate':
            this.handleICECandidateMessage(msg, self);
            break;
          default:
            console.log('unknown message of type ' + msg.type);
        }
      },
      error => console.log(error)
    );
  }

  /* ########################  MESSAGE HANDLER  ################################## */

  private handleOfferMessage(msg: VoiceMsg, self: VoiceComponent): void {
    console.log('handle incoming offer sid:: '+msg.sid);
    const peerConnectionContainer = self.createPeerConnection();
    peerConnectionContainer.remoteId = msg.sid;
    self.peerConnections.set(peerConnectionContainer.localId, peerConnectionContainer);

    if (!self.localStream) {
      this.startLocalVideo();
    }

    self.peerConnections.get(peerConnectionContainer.localId).rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(msg.data))
      .then(() => {
        self.startLocalVideo();
      }).then(() =>
      // Build SDP for answer message
     this.peerConnections.get(peerConnectionContainer.localId).rtcPeerConnection.createAnswer()
        .then(answer => {console.log(self.peerConnections.get(peerConnectionContainer.localId)); return answer;})
    ).then((answer) =>
      // Set local SDP
      self.peerConnections.get(peerConnectionContainer.localId).rtcPeerConnection.setLocalDescription(answer).then(() => answer)
    ).then(answer => {
      // Send local SDP to remote part
      self.voiceService.sendMessage({type: 'answer', sid: msg.sid, remoteId: peerConnectionContainer.localId,
         data: answer});
      this.inCall = true;
    }).catch(e => self.handleGetUserMediaError(e, peerConnectionContainer.localId));
  }

  private handleAnswerMessage(msg: VoiceMsg, self: VoiceComponent): void {
    console.log('handle incoming answer sid: ' +msg.sid);
    self.peerConnections.get(msg.sid).remoteId = msg.remoteId;
    self.peerConnections.get(msg.sid).rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(msg.data))
       .then(() => console.log('answer handled'));
  }

  private handleHangupMessage(msg: VoiceMsg, self: VoiceComponent): void {
    console.log(msg);
    self.closeVideoCall();
  }

  private handleICECandidateMessage(msg: VoiceMsg, self: VoiceComponent): void {
	console.log(msg);
	if (msg.remoteId in self.peerConnections.keys) {
	   console.log(msg.remoteId, this.peerConnections.get(msg.remoteId).rtcPeerConnection);
       self.peerConnections.get(msg.remoteId).rtcPeerConnection.addIceCandidate(new RTCIceCandidate(msg.data)).catch(self.reportError);
    } else {
       if (!(msg.remoteId in self.pendingCandidates.keys)) {
          self.pendingCandidates.set(msg.remoteId, [] as RTCIceCandidateInit[]);
       }
       self.pendingCandidates.get(msg.remoteId).push(msg.data);
    }
  }

  private async requestMediaDevices(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      // pause all tracks
      this.stopLocalVideo();
    } catch (e) {
      console.error(e);
      alert(`getUserMedia() error: ${e.name}`);
    }
  }

  private createPeerConnection(): RTCPeerConnectionContainer {
    console.log('creating PeerConnection...');
    const peerConnection = new RTCPeerConnection(environment.RTCPeerConfiguration);
    const sid = window.crypto.randomUUID();
    const self = this;

    peerConnection.onicecandidate = this.handleICECandidateEvent;//.bind(self);
    peerConnection.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent;//.bind(self);
    peerConnection.onsignalingstatechange = this.handleSignalingStateChangeEvent;//.bind(self);
    peerConnection.ontrack = this.handleTrackEvent;//.bind(self);
    const container = new RTCPeerConnectionContainer(sid, null, peerConnection);
    this.peerConnections.set(sid, container);
    return container;
  }

  private closeVideoCall(): void {
    console.log('Closing call');

    this.peerConnections.forEach((container, sid) => {
      console.log('--> Closing the peer connection');

      container.rtcPeerConnection.ontrack = null;
      container.rtcPeerConnection.onicecandidate = null;
      container.rtcPeerConnection.oniceconnectionstatechange = null;
      container.rtcPeerConnection.onsignalingstatechange = null;

      // Stop all transceivers on the connection
      container.rtcPeerConnection.getTransceivers().forEach(transceiver => {
        transceiver.stop();
      });

      // Close the peer connection
      container.rtcPeerConnection.close();
    });
    this.peerConnections.clear();
    this.pendingCandidates.clear();
	this.stopLocalVideo();
    this.inCall = false;
  }

  /* ########################  ERROR HANDLER  ################################## */
  private handleGetUserMediaError(e: Error, sid: string): void {
	console.log(e);
    switch (e.name) {
      case 'NotFoundError':
        alert('Unable to open your call because no camera and/or microphone were found.');
        break;
      case 'SecurityError':
      case 'PermissionDeniedError':
        // Do nothing; this is the same as the user canceling the call.
        break;
      default:
        console.log(e);
        alert('Error opening your camera and/or microphone: ' + e.message);
        break;
    }

    this.closeVideoCall();
  }

  private reportError = (e: Error) => {
    console.log('got Error: ' + e.name);
    console.log(e);
  };

  /* ########################  EVENT HANDLER  ################################## */
  private handleICECandidateEvent = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate && this.peerConnections.get(this.getEventSid(event)).remoteId) {
      console.log(event);
      this.voiceService.sendMessage({
        type: 'ice-candidate',
        sid: this.getEventSid(event),
        remoteId: this.peerConnections.get(this.getEventSid(event)).remoteId,
        data: event.candidate
      });
    }
  };

  private handleICEConnectionStateChangeEvent = (event: Event) => {
    console.log(event);
    switch (((event.currentTarget) as RTCPeerConnection).iceConnectionState) {
      case 'closed':
      case 'failed':
      case 'disconnected':
        this.closeVideoCallByEvent(event);
        break;
      console.log(event);
    }
  };

  private getEventSid(event: Event): string {
	 let mySid: string = null;
     this.peerConnections.forEach((value, key) => value.rtcPeerConnection === event.currentTarget ? mySid = key : mySid = mySid);
     if(!mySid) {
	    this.pendingCandidates.forEach((value, key) => value.filter(myCandidate => myCandidate === event.currentTarget).length > 0
	       ? mySid = key : mySid = mySid);
     }
     return mySid;
   }

  private closeVideoCallByEvent(event: Event): void {
	 const mySid = this.getEventSid(event);
	 console.log(mySid, event);
     this.closeVideoCall();
  }

  private handleSignalingStateChangeEvent = (event: Event) => {
    console.log(event, ((event.currentTarget) as RTCPeerConnection).signalingState);
    switch (((event.currentTarget) as RTCPeerConnection).signalingState) {
      case 'closed':
        this.closeVideoCallByEvent(event);
        break;
    }
  };

  private handleTrackEvent = (event: RTCTrackEvent) => {
    console.log(event);
    this.remoteVideo.nativeElement.srcObject = event.streams[0];
  };

}
