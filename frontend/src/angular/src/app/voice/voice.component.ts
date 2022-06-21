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
import { VoiceMsg} from '../model/voiceMsg';
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
	constructor(public sid: string, public rtcPeerConnection: RTCPeerConnection){}
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

  private peerConnections = new Map<string, RTCPeerConnection>();
  private pendingCandidates = new Map<string, RTCPeerConnection>();
  private localStream: MediaStream;

  constructor(private voiceService: VoiceService) { }

  async call(): Promise<void> {
    const peerConnectionContainer = this.createPeerConnection();

    // Add the tracks from the local stream to the RTCPeerConnection
//    this.localStream.getTracks().forEach(
//      track => this.peerConnection.addTrack(track, this.localStream)
//    );

    try {
      const offer: RTCSessionDescriptionInit = await peerConnectionContainer.rtcPeerConnection.createOffer(offerOptions);
      // Establish the offer as the local peer's current description.
      await peerConnectionContainer.rtcPeerConnection.setLocalDescription(offer);

      this.inCall = true;

      this.voiceService.sendMessage({type: 'offer', sid: peerConnectionContainer.sid,  data: offer});
    } catch (err) {
      this.handleGetUserMediaError(err, peerConnectionContainer.sid);
    }
  }

  hangUp(mySid: string): void {
    this.voiceService.sendMessage({type: 'hangup', sid: mySid, data: ''});
    this.closeVideoCall(mySid);
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

    // this.transactions$.subscribe();
    this.voiceService.messages$.subscribe(
      msg => {
        console.log('Received message: ' + msg.type);
        console.log(msg);
        switch (msg.type) {
          case 'offer':
            this.handleOfferMessage(msg);
            break;
          case 'answer':
            this.handleAnswerMessage(msg);
            break;
          case 'hangup':
            this.handleHangupMessage(msg);
            break;
          case 'ice-candidate':
            this.handleICECandidateMessage(msg);
            break;
          default:
            console.log('unknown message of type ' + msg.type);
        }
      },
      error => console.log(error)
    );
  }

  /* ########################  MESSAGE HANDLER  ################################## */

  private handleOfferMessage(msg: VoiceMsg): void {
    console.log('handle incoming offer');
    const peerConnectionContainer = this.createPeerConnection();

    if (!this.localStream) {
      this.startLocalVideo();
    }

    peerConnectionContainer.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(msg.data))
      .then(() => {
        this.startLocalVideo();
      }).then(() =>
      // Build SDP for answer message
     peerConnectionContainer.rtcPeerConnection.createAnswer()
    ).then((answer) =>
      // Set local SDP
      peerConnectionContainer.rtcPeerConnection.setLocalDescription(answer)
    ).then(() => {
      // Send local SDP to remote party
      this.voiceService.sendMessage({type: 'answer', sid: peerConnectionContainer.sid,
         data: peerConnectionContainer.rtcPeerConnection.localDescription});
      this.inCall = true;
    }).catch(e => this.handleGetUserMediaError(e, msg.sid));
  }

  private handleAnswerMessage(msg: VoiceMsg): void {
    console.log('handle incoming answer');
    this.peerConnections[msg.sid].setRemoteDescription(msg.data);
  }

  private handleHangupMessage(msg: VoiceMsg): void {
    console.log(msg);
    this.closeVideoCall(msg.sid);
  }

  private handleICECandidateMessage(msg: VoiceMsg): void {
	console.log(msg);
    const candidate = new RTCIceCandidate(msg.data);
    this.peerConnections[msg.sid].addIceCandidate(candidate).catch(this.reportError);
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

    peerConnection.onicecandidate = this.handleICECandidateEvent;
    peerConnection.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent;
    peerConnection.onsignalingstatechange = this.handleSignalingStateChangeEvent;
    peerConnection.ontrack = this.handleTrackEvent;
    this.peerConnections[sid] = peerConnection;
    return new RTCPeerConnectionContainer(sid, peerConnection);
  }

  private closeVideoCall(sid: string): void {
    console.log('Closing call');

    if (this.peerConnections[sid]) {
      console.log('--> Closing the peer connection');

      this.peerConnections[sid].ontrack = null;
      this.peerConnections[sid].onicecandidate = null;
      this.peerConnections[sid].oniceconnectionstatechange = null;
      this.peerConnections[sid].onsignalingstatechange = null;

      // Stop all transceivers on the connection
      this.peerConnections[sid].getTransceivers().forEach(transceiver => {
        transceiver.stop();
      });

      // Close the peer connection
      this.peerConnections[sid].close();
      this.peerConnections.delete(sid);
	  this.stopLocalVideo();
      this.inCall = false;
    }
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

    this.closeVideoCall(sid);
  }

  private reportError = (e: Error) => {
    console.log('got Error: ' + e.name);
    console.log(e);
  };

  /* ########################  EVENT HANDLER  ################################## */
  private handleICECandidateEvent = (event: RTCPeerConnectionIceEvent) => {
    // console.log(event);
    if (event.candidate) {
      this.voiceService.sendMessage({
        type: 'ice-candidate',
        sid: null,
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
    }
  };

  private closeVideoCallByEvent(event: Event): void {
	 let mySid: string = null;
     this.peerConnections.forEach((value, key) => value === event.currentTarget ? mySid = key : mySid = mySid);
     this.closeVideoCall(mySid);
  }

  private handleSignalingStateChangeEvent = (event: Event) => {
    console.log(event);
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
