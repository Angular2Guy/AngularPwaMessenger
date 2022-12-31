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
import { Injectable } from "@angular/core";
import { VoiceMsg, VoiceMsgType } from "../model/voice-msg";
import { RTCPeerConnectionContainer, VoiceService } from "./voice.service";
import { environment } from "src/environments/environment";
import { BehaviorSubject, Subject } from "rxjs";

const mediaConstraints = {
  audio: true,
  video: true,
  // video: {width: 1280, height: 720}
  // video: {width: 1280, height: 720} // 16:9
  // video: {width: 960, height: 540}  // 16:9
  // video: {width: 640, height: 480}  //  4:3
  // video: {width: 160, height: 120}  //  4:3
};

@Injectable({
  providedIn: "root",
})
export class WebrtcService {
  public localhostReceiver = "";
  public senderId = "";
  public receiverId = "";
  public localStream: MediaStream;
  public offerMsgSubject = new BehaviorSubject({
    type: VoiceMsgType.offer,
    senderId: null,
    receiverId: null,
    data: null,
  } as VoiceMsg);
  public hangupMsgSubject = new Subject<VoiceMsg>();
  public remoteStreamSubject = new BehaviorSubject<MediaStream>({
    id: null,
  } as MediaStream);
  private onLocalhost: boolean;

  constructor(private voiceService: VoiceService) {
    this.onLocalhost = this.voiceService.localhostCheck();
  }

  public async addIncomingMessageHandler(): Promise<void> {
    console.log("Message Handler added");
    await this.requestMediaDevices();
    this.voiceService.messages.subscribe(
      (msg) => {
        console.log("Received message: " + msg.type);
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
            console.log("unknown message of type " + msg.type);
        }
      },
      (error) => console.log(error)
    );
  }

  public createPeerConnection(): RTCPeerConnectionContainer {
    console.log("creating PeerConnection...");
    const peerConnection = new RTCPeerConnection(
      environment.RTCPeerConfiguration
    );
    //const senderId = window.crypto.randomUUID();
    const senderId = this.senderId;
    const receiverId = this.onLocalhost
      ? this.localhostReceiver
      : this.receiverId;

    peerConnection.onicecandidate = this.handleICECandidateEvent;
    peerConnection.oniceconnectionstatechange =
      this.handleICEConnectionStateChangeEvent;
    peerConnection.onsignalingstatechange =
      this.handleSignalingStateChangeEvent;
    peerConnection.ontrack = this.handleTrackEvent;
    const container = new RTCPeerConnectionContainer(
      senderId,
      receiverId,
      peerConnection
    );
    return container;
  }

  private async requestMediaDevices(): Promise<void> {
    if (!this.localStream) {
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia(
          mediaConstraints
        );
      } catch (e) {
        console.error(e);
        alert(`getUserMedia() error: ${e.name}`);
      }
    }
  }

  /* ########################  MESSAGE HANDLER  ################################## */
  private handleOfferMessage(msg: VoiceMsg): void {
    console.log("handle incoming offer sid:: " + msg.senderId);
    const peerConnectionContainer = this.createPeerConnection();
    peerConnectionContainer.receiverId = msg.senderId;
    peerConnectionContainer.senderId = this.onLocalhost
      ? this.localhostReceiver
      : peerConnectionContainer.senderId;
    this.voiceService.peerConnections.set(
      peerConnectionContainer.senderId,
      peerConnectionContainer
    );

    this.localStream
      .getTracks()
      .forEach(
        (myTrack) =>
          !!peerConnectionContainer &&
          peerConnectionContainer?.rtcPeerConnection?.addTrack(
            myTrack,
            this.localStream
          )
      );

    this.voiceService.peerConnections
      .get(peerConnectionContainer.senderId)
      .rtcPeerConnection.setRemoteDescription(
        new RTCSessionDescription(msg.data)
      )
      .then(
        () =>
          // Build SDP for answer message
          this.voiceService.peerConnections
            .get(peerConnectionContainer.senderId)
            .rtcPeerConnection.createAnswer()
        //.then(answer => {
        //   console.log(this.voiceService.peerConnections.get(peerConnectionContainer.localId));
        //   return answer;})
      )
      .then((answer) =>
        // Set local SDP
        this.voiceService.peerConnections
          .get(peerConnectionContainer.senderId)
          .rtcPeerConnection.setLocalDescription(answer)
          .then(() => answer)
      )
      .then((answer) => {
        // Send local SDP to remote part
        this.voiceService.sendMessage({
          type: VoiceMsgType.answer,
          senderId: peerConnectionContainer.senderId,
          receiverId: peerConnectionContainer.receiverId,
          data: answer,
        } as VoiceMsg);
        this.offerMsgSubject.next(msg);
      })
      .catch((e) => this.reportError(e));
  }

  private handleAnswerMessage(msg: VoiceMsg): void {
    console.log("handle incoming answer sid: " + msg.receiverId);
    //console.log( this.voiceService.peerConnections.get(msg.receiverId));
    if (
      this.voiceService.peerConnections.get(msg.receiverId).rtcPeerConnection
        .signalingState !== "stable"
    ) {
      this.voiceService.peerConnections
        .get(msg.receiverId)
        .rtcPeerConnection.setRemoteDescription(
          new RTCSessionDescription(msg.data)
        )
        // .then(() => console.log(msg.data))
        .then(() => console.log("answer handled"));
    }
  }

  private handleHangupMessage(msg: VoiceMsg): void {
    console.log(msg);
    this.hangupMsgSubject.next(msg);
  }

  private handleICECandidateMessage(msg: VoiceMsg): void {
    console.log(
      "ICECandidateMessage sid: " +
        msg.senderId +
        " remoteId: " +
        msg.receiverId
    );
    //console.log(msg);
    //console.log(this.voiceService.peerConnections.get(msg.remoteId));
    if (
      !!this.voiceService.peerConnections.get(msg.receiverId).rtcPeerConnection
        ?.currentRemoteDescription
    ) {
      //console.log(msg.remoteId, this.voiceService.peerConnections.get(msg.remoteId).rtcPeerConnection);
      this.voiceService.peerConnections
        .get(msg.receiverId)
        .rtcPeerConnection.addIceCandidate(new RTCIceCandidate(msg.data))
        .catch(this.reportError);
    } else {
      if (!this.voiceService.pendingCandidates.get(msg.receiverId)) {
        this.voiceService.pendingCandidates.set(
          msg.receiverId,
          [] as RTCIceCandidateInit[]
        );
      }
      this.voiceService.pendingCandidates.get(msg.receiverId).push(msg.data);
    }
  }

  private handleICECandidateEvent = (event: RTCPeerConnectionIceEvent) => {
    if (
      event.candidate &&
      this.voiceService.peerConnections.get(this.getEventSid(event))?.receiverId
    ) {
      //console.log(event);
      this.voiceService.sendMessage({
        type: VoiceMsgType.iceCandidate,
        senderId: this.getEventSid(event),
        receiverId: this.voiceService.peerConnections.get(
          this.getEventSid(event)
        ).receiverId,
        data: event.candidate,
      });
    }
  };

  private handleICEConnectionStateChangeEvent = (event: Event) => {
    console.log(
      "ICEConnectionStateChangeEvent: " +
        (event.currentTarget as RTCPeerConnection).connectionState
    );
    switch ((event.currentTarget as RTCPeerConnection).iceConnectionState) {
      case "closed":
      case "failed":
      case "disconnected":
        this.closeVideoCallByEvent(event);
        break;
    }
  };

  private getEventSid(event: Event): string {
    let mySid: string = null;
    this.voiceService.peerConnections.forEach((value, key) =>
      value.rtcPeerConnection === event.currentTarget
        ? (mySid = key)
        : (mySid = mySid)
    );
    if (!mySid) {
      this.voiceService.pendingCandidates.forEach((value, key) =>
        value.filter((myCandidate) => myCandidate === event.currentTarget)
          .length > 0
          ? (mySid = key)
          : (mySid = mySid)
      );
    }
    return mySid;
  }

  private closeVideoCallByEvent(event: Event): void {
    const mySid = this.getEventSid(event);
    //console.log(mySid, event);
    this.hangupMsgSubject.next({
      type: VoiceMsgType.hangup,
      senderId: null,
      receiverId: null,
      data: null,
    } as VoiceMsg);
  }

  private handleSignalingStateChangeEvent = (event: Event) => {
    console.log(
      "signalingStateChangeEvent: " +
        (event.currentTarget as RTCPeerConnection).signalingState
    );
    //console.log(event, ((event.currentTarget) as RTCPeerConnection).signalingState);
    switch ((event.currentTarget as RTCPeerConnection).signalingState) {
      case "closed":
        this.closeVideoCallByEvent(event);
        break;
    }
  };

  private reportError = (e: Error) => {
    console.log("got Error: " + e.name);
    console.log(e);
  };

  private handleTrackEvent = (event: RTCTrackEvent) => {
    console.log("handle track event: " + event);
    // console.log(event);
    const myStream = event?.streams?.length === 0 ? null : event.streams[0];
    if (!!myStream) {
      myStream.getTracks().forEach((track) => {
        track.enabled = true;
      });
      this.remoteStreamSubject.next(myStream);
    }
  };
}
