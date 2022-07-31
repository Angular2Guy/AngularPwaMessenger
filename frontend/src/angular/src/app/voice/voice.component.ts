/**
 *    Copyright 2018 Sven Loesekann
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/liceenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */
 // based on: https://github.com/wliegel/youtube_webrtc_tutorial
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { VoiceService } from '../services/voice.service';
import { VoiceMsg, VoiceMsgType} from '../model/voice-msg';
import { Contact } from '../model/contact';
import { WebrtcService } from '../services/webrtc.service';
import { debounceTime, filter } from 'rxjs';
import { Subscription } from 'dexie';

const offerOptions = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

@Component({
  selector: 'app-voice',
  templateUrl: './voice.component.html',
  styleUrls: ['./voice.component.scss']
})
export class VoiceComponent implements OnInit, OnDestroy, AfterViewInit {
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

  private localhostReceiver = '';
  private componentSubscribtions: Subscription[] = [];

  constructor(private voiceService: VoiceService, private webrtcService: WebrtcService) {
	this.onLocalhost = this.voiceService.localhostCheck();
   }

   public ngAfterViewInit(): void {
      this.componentSubscribtions.push(this.webrtcService.offerMsgSubject
	   .pipe(filter(offerMsg => !!offerMsg.senderId && !!offerMsg.receiverId), debounceTime(500))
	   .subscribe(offerMsg => this.handleOfferMessage(offerMsg)));
  	  this.componentSubscribtions.push(this.webrtcService.hangupMsgSubject.pipe(debounceTime(500))
  	   .subscribe(hangupMsg => this.handleHangupMessage(hangupMsg)));
	  this.componentSubscribtions.push(this.webrtcService.remoteStreamSubject
	   .subscribe(remoteStream => this.handleRemoteStream(remoteStream)));
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

    this.webrtcService.localStream.getTracks().forEach(myTrack =>
       peerConnectionContainer.rtcPeerConnection.addTrack(myTrack, this.webrtcService.localStream));

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
    this.requestMediaDevices();
  }

  public startLocalVideo(): void {
    console.log('starting local stream');
    if(!this.localVideoActivated) {
       this.webrtcService.localStream.getTracks().forEach(track => {
          track.enabled = true;
       });
       this.localVideo.nativeElement.srcObject = this.webrtcService.localStream;

       this.localVideoActivated = true;
    }
  }

  public stopLocalVideo(): void {
    console.log('stop local stream');
    if(this.localVideoActivated) {
       this.webrtcService.localStream.getTracks().forEach(track => {
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

    this.inCall = true;
  }

  private handleRemoteStream(remoteStream: MediaStream): void {
	console.log('remote mediastream handled: ' + remoteStream.id);
	this.remoteVideo.nativeElement.srcObject = remoteStream;
    this.remoteMuted = false;
  }

  private handleHangupMessage(msg: VoiceMsg): void {
    //console.log(msg);
    this.closeVideoCall();
  }

  private requestMediaDevices(): void {
    // pause all tracks
    this.stopLocalVideo();
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
