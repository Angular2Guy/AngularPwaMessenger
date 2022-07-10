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
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RTCPeerConnectionContainer, VoiceService } from '../services/voice.service';
import { VoiceMsg, VoiceMsgType} from '../model/voice-msg';
import { Contact } from '../model/contact';
import { WebrtcService } from '../services/webrtc.service';
import { filter } from 'rxjs';
import { Subscription } from 'dexie';

const offerOptions = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

const mediaConstraints = {
  audio: true,
  video: true,
  // video: {width: 1280, height: 720}
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
export class VoiceComponent implements OnInit, OnDestroy {
  @ViewChild('local_video') localVideo: ElementRef;
  @ViewChild('remote_video') remoteVideo: ElementRef;

  @Input()
  receiver: Contact;
  @Input()
  sender: Contact;

  localVideoActivated = false;
  remoteMuted = false;
  localMuted = false;
  onLocalhost: boolean;
  inCall = false;

  private localStream: MediaStream;
  private localhostReceiver = '';
  private componentSubscribtions: Subscription[] = [];

  constructor(private voiceService: VoiceService, private webrtcService: WebrtcService) {
	this.onLocalhost = this.voiceService.localhostCheck();
   }

   public ngOnDestroy(): void {
   	  this.componentSubscribtions.forEach(mySub => mySub.unsubscribe());
   }

  public async call(): Promise<void> {
    const peerConnectionContainer = this.webrtcService.createPeerConnection();
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
         receiverId: peerConnectionContainer.receiverId, data: offer});
    } catch (err) {
      this.handleGetUserMediaError(err, peerConnectionContainer.senderId);
    }
  }

  public hangUp(): void {
    this.voiceService.sendMessage({type: VoiceMsgType.hangup,
       senderId: this.sender.name, receiverId: this.onLocalhost ? this.localhostReceiver : this.receiver.name, data: ''});
    this.closeVideoCall();
  }

  public ngOnInit(): void {
	this.localhostReceiver = this.sender.name + this.voiceService.localHostToken;
    this.requestMediaDevices().then(() => {
	   this.componentSubscribtions.push(this.webrtcService.offerMsgSubject
	      .pipe(filter(offerMsg => !!offerMsg.senderId && !!offerMsg.receiverId)).subscribe(offerMsg => this.handleOfferMessage(offerMsg)));
  	   this.componentSubscribtions.push(this.webrtcService.hangupMsgSubject.subscribe(hangupMsg => this.handleHangupMessage(hangupMsg)));
	   this.componentSubscribtions.push(this.webrtcService.remoteStreamSubject
	      .subscribe(remoteStream => this.handleRemoteStream(remoteStream)));
    });
  }

  public startLocalVideo(): void {
    console.log('starting local stream');
    if(!this.localVideoActivated) {
	   
       this.localStream.getTracks().forEach(track => {
          track.enabled = true;
       });
       this.localVideo.nativeElement.srcObject = this.localStream;

       this.localVideoActivated = true;
    }
  }

  public stopLocalVideo(): void {
    console.log('stop local stream');
    if(this.localVideoActivated) {
       this.localStream.getTracks().forEach(track => {
          track.enabled = false;
       });
       this.localVideo.nativeElement.srcObject = null;

       this.localVideoActivated = false;
    }
  }

  /* ########################  MESSAGE HANDLER  ################################## */
  private handleOfferMessage(msg: VoiceMsg): void {
	console.log('offer msg senderId: '+msg.senderId+' receiverId: '+msg.receiverId);
    if (!this.localVideoActivated) {
      this.startLocalVideo();
    }

    const peerConnectionContainer = this.voiceService.peerConnections.get(msg.senderId);
    this.localStream.getTracks().forEach(myTrack => !!peerConnectionContainer
       && peerConnectionContainer?.rtcPeerConnection?.addTrack(myTrack, this.localStream));
    this.inCall = true;
  }

  private handleRemoteStream(remoteStream: MediaStream): void {
	this.remoteVideo.nativeElement.srcObject = remoteStream;
    this.remoteMuted = false;
  }

  private handleHangupMessage(msg: VoiceMsg): void {
    console.log(msg);
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
}
