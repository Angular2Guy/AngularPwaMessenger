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
import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { RTCPeerConnectionContainer, VoiceService } from '../services/voice.service';
import { VoiceMsg, VoiceMsgType} from '../model/voice-msg';
import { environment } from 'src/environments/environment';
import { JwtTokenService } from '../services/jwt-token.service';
import { Contact } from '../model/contact';

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

@Component({
  selector: 'app-voice',
  templateUrl: './voice.component.html',
  styleUrls: ['./voice.component.scss']
})
export class VoiceComponent implements AfterViewInit {
  @ViewChild('local_video') localVideo: ElementRef;
  @ViewChild('remote_video') remoteVideo: ElementRef;

  @Input()
  receiver: Contact;
  @Input()
  sender: Contact;

  localVideoActivated = false;
  remoteMuted = false;
  localMuted = false;

  inCall = false;

  private localStream: MediaStream;

  constructor(private voiceService: VoiceService, private jwttokenService: JwtTokenService) { }

  async call(): Promise<void> {
    const peerConnectionContainer = this.createPeerConnection();
    this.voiceService.peerConnections.set(peerConnectionContainer.senderId, peerConnectionContainer);

    if (!this.localVideoActivated) {
      this.startLocalVideo();
    }

    this.localStream.getTracks().forEach(myTrack => peerConnectionContainer.rtcPeerConnection.addTrack(myTrack, this.localStream));

    try {
      const offer = await this.voiceService.peerConnections.get(peerConnectionContainer.senderId)
         .rtcPeerConnection.createOffer(offerOptions);
      // Establish the offer as the local peer's current description.
      await peerConnectionContainer.rtcPeerConnection.setLocalDescription(new RTCSessionDescription(offer));

      this.inCall = true;

      this.voiceService.sendMessage({type: VoiceMsgType.offer, senderId: peerConnectionContainer.senderId,
         receiverId: this.receiver.name, data: offer});
    } catch (err) {
      this.handleGetUserMediaError(err, peerConnectionContainer.senderId);
    }
  }

  hangUp(): void {
    this.voiceService.sendMessage({type: VoiceMsgType.hangup, senderId: this.sender.name, receiverId: this.receiver.name, data: ''});
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
       this.localVideo.nativeElement.srcObject = null;

       this.localVideoActivated = false;
    }
  }

  private addIncominMessageHandler(): void {
    this.voiceService.connect(this.jwttokenService.jwtToken);
    // this.transactions$.subscribe();
    this.voiceService.messages$.subscribe(
      msg => {
        console.log('Received message: ' + msg.type);
        // console.log(msg);
        switch (msg.type) {
          case VoiceMsgType.offer:
            this.handleOfferMessage(msg);
            break;
          case VoiceMsgType.answer:
            this.handleAnswerMessage(msg);
            break;
          case VoiceMsgType.hangup:
            this.handleHangupMessage(msg);
            break;
          case VoiceMsgType.iceCandidate:
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
    console.log('handle incoming offer sid:: '+msg.senderId);
    const peerConnectionContainer = this.createPeerConnection();
    peerConnectionContainer.receiverId = msg.senderId;
    this.voiceService.peerConnections.set(peerConnectionContainer.senderId, peerConnectionContainer);

    if (!this.localStream) {
      this.startLocalVideo();
    }

    this.localStream.getTracks().forEach(myTrack => peerConnectionContainer.rtcPeerConnection.addTrack(myTrack, this.localStream));

    this.voiceService.peerConnections.get(peerConnectionContainer.senderId).rtcPeerConnection
      .setRemoteDescription(new RTCSessionDescription(msg.data))
      .then(() => {
        this.startLocalVideo();
      }).then(() =>
      // Build SDP for answer message
     this.voiceService.peerConnections.get(peerConnectionContainer.senderId).rtcPeerConnection.createAnswer()
        //.then(answer => {
	    //   console.log(this.voiceService.peerConnections.get(peerConnectionContainer.localId));
	    //   return answer;})
    ).then((answer) =>
      // Set local SDP
      this.voiceService.peerConnections.get(peerConnectionContainer.senderId).rtcPeerConnection
      .setLocalDescription(answer).then(() => answer)
    ).then(answer => {
      // Send local SDP to remote part
      this.voiceService.sendMessage({type: VoiceMsgType.answer, senderId: peerConnectionContainer.senderId,
         receiverId: peerConnectionContainer.receiverId, data: answer});
      this.inCall = true;
    }).catch(e => this.handleGetUserMediaError(e, peerConnectionContainer.senderId));
  }

  private handleAnswerMessage(msg: VoiceMsg): void {
    console.log('handle incoming answer sid: ' +msg.receiverId);
    this.voiceService.peerConnections.get(msg.receiverId).senderId = msg.senderId;
    this.voiceService.peerConnections.get(msg.receiverId).rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(msg.data))
       // .then(() => console.log(msg.data))
       .then(() => console.log('answer handled'));
  }

  private handleHangupMessage(msg: VoiceMsg): void {
    console.log(msg);
    this.closeVideoCall();
  }

  private handleICECandidateMessage(msg: VoiceMsg): void {
	console.log('ICECandidateMessage sid: '+msg.senderId+' remoteId: '+msg.receiverId);
	//console.log(msg);
	//console.log(this.voiceService.peerConnections.get(msg.remoteId));
	if (!!this.voiceService.peerConnections.get(msg.receiverId)) {
	   //console.log(msg.remoteId, this.voiceService.peerConnections.get(msg.remoteId).rtcPeerConnection);
       this.voiceService.peerConnections.get(msg.receiverId).rtcPeerConnection
       .addIceCandidate(new RTCIceCandidate(msg.data)).catch(this.reportError);
    } else {
       if (!this.voiceService.peerConnections.get(msg.receiverId)) {
          this.voiceService.pendingCandidates.set(msg.receiverId, [] as RTCIceCandidateInit[]);
       }
       this.voiceService.pendingCandidates.get(msg.receiverId).push(msg.data);
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
    //const senderId = window.crypto.randomUUID();
    const senderId = this.sender.name;

    peerConnection.onicecandidate = this.handleICECandidateEvent;
    peerConnection.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent;
    peerConnection.onsignalingstatechange = this.handleSignalingStateChangeEvent;
    peerConnection.ontrack = this.handleTrackEvent;
    const container = new RTCPeerConnectionContainer(senderId, null, peerConnection);
    this.voiceService.peerConnections.set(senderId, container);
    return container;
  }

  private closeVideoCall(): void {
    console.log('Closing call');

    this.voiceService.peerConnections.forEach((container, sid) => {
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
    this.voiceService.peerConnections.clear();
    this.voiceService.pendingCandidates.clear();
	this.stopLocalVideo();
	this.remoteMuted = true;
    this.remoteVideo.nativeElement.srcObject = null;
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
    if (event.candidate && this.voiceService.peerConnections.get(this.getEventSid(event)).receiverId) {
      //console.log(event);
      this.voiceService.sendMessage({
        type: VoiceMsgType.iceCandidate,
        senderId: this.getEventSid(event),
        receiverId: this.voiceService.peerConnections.get(this.getEventSid(event)).receiverId,
        data: event.candidate
      });
    }
  };

  private handleICEConnectionStateChangeEvent = (event: Event) => {
    console.log('ICEConnectionStateChangeEvent: ' + ((event.currentTarget) as RTCPeerConnection).connectionState);
    switch (((event.currentTarget) as RTCPeerConnection).iceConnectionState) {
      case 'closed':
      case 'failed':
      case 'disconnected':
        this.closeVideoCallByEvent(event);
        break;
    }
  };

  private getEventSid(event: Event): string {
	 let mySid: string = null;
     this.voiceService.peerConnections
        .forEach((value, key) => value.rtcPeerConnection === event.currentTarget ? mySid = key : mySid = mySid);
     if(!mySid) {
	    this.voiceService.pendingCandidates.forEach((value, key) =>
	       value.filter(myCandidate => myCandidate === event.currentTarget).length > 0 ? mySid = key : mySid = mySid);
     }
     return mySid;
   }

  private closeVideoCallByEvent(event: Event): void {
	 const mySid = this.getEventSid(event);
	 console.log(mySid, event);
     this.closeVideoCall();
  }

  private handleSignalingStateChangeEvent = (event: Event) => {
	console.log('signalingStateChangeEvent: '+ ((event.currentTarget) as RTCPeerConnection).signalingState);
    //console.log(event, ((event.currentTarget) as RTCPeerConnection).signalingState);
    switch (((event.currentTarget) as RTCPeerConnection).signalingState) {
      case 'closed':
        this.closeVideoCallByEvent(event);
        break;
    }
  };

  private handleTrackEvent = (event: RTCTrackEvent) => {
	((event.currentTarget) as RTCPeerConnection).getStats().then(value => console.log('handle track event: '+JSON.stringify(value)));
    // console.log(event);
    const myStream = event.streams.length === 0 ? null :  event.streams[0];
    if(!!myStream) {
       myStream.getTracks().forEach(track => {
          track.enabled = true;
       });
       this.remoteVideo.nativeElement.srcObject = myStream;
       this.remoteMuted = false;
    }
    this.remoteVideo.nativeElement.srcObject = event.streams[0];
  };
}
