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
import {
  Component,
  OnInit,
  HostListener,
  OnDestroy,
  AfterViewInit,
  ViewChild,
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { MediaMatcher } from "@angular/cdk/layout";
import { Contact } from "../model/contact";
import { Message } from "../model/message";
import { LocaldbService } from "../services/localdb.service";
import { MatDialog } from "@angular/material/dialog";
import { LoginComponent } from "../login/login.component";
import { MyUser } from "../model/my-user";
import { SyncMsgs } from "../model/sync-msgs";
import { JwtTokenService } from "../services/jwt-token.service";
import { NetConnectionService } from "../services/net-connection.service";
import { MessageService } from "../services/message.service";
import { CryptoService } from "../services/crypto.service";
import { TranslationsService } from "../services/translations.service";
import { filter, Subscription } from "rxjs";
import { CameraComponent } from "../camera/camera.component";
import { FileuploadComponent } from "../fileupload/fileupload.component";
import { VoiceService } from "../services/voice.service";
import { MatDrawerMode, MatSidenav } from "@angular/material/sidenav";
import { WebrtcService } from "../services/webrtc.service";
import { Router } from "@angular/router";

// eslint-disable-next-line no-shadow
enum MyFeature {
  chat,
  phone,
}

@Component({
  selector: "app-main",
  templateUrl: "./main.component.html",
  styleUrls: ["./main.component.scss"],
})
export class MainComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild("contact_list") contactList: MatSidenav;
  protected windowHeight: number;
  protected ownContact: Contact;
  protected contacts: Contact[] = [];
  protected selectedContact: Contact;
  protected messages: Message[] = [];
  protected myUser: MyUser = null;
  protected myFeature = MyFeature;
  protected selFeature = MyFeature.chat;
  protected contactListMode: MatDrawerMode = "side";
  private readonly componentKey = TranslationsService.MAIN_COMPONENT;
  private interval: any;
  private conMonSub: Subscription;
  private offerMsgSub: Subscription;
  private headerBarHeight = 84;

  constructor(
    private localdbService: LocaldbService,
    private jwttokenService: JwtTokenService,
    private netConnectionService: NetConnectionService,
    private messageService: MessageService,
    private translationsService: TranslationsService,
    protected dialog: MatDialog,
    private cryptoService: CryptoService,
    private voiceService: VoiceService,
    private webrtcService: WebrtcService,
    private mediaMatcher: MediaMatcher,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  @HostListener("window:resize", ["$event"])
  onResize(event: any): void {
    this.windowHeight = event.target.innerHeight - this.headerBarHeight;
  }

  ngOnInit(): void {
    this.windowHeight = window.innerHeight - this.headerBarHeight;
    this.conMonSub = this.netConnectionService.connectionMonitor.subscribe(
      (online) => this.onlineAgain(online)
    );
  }

  ngAfterViewInit(): void {
    const mediaQueryList = this.mediaMatcher.matchMedia(
      "(max-width: 900px) or (max-height: 480px)"
    );
    mediaQueryList.onchange = (event) => this.updateContactListLayout(event);
  }

  ngOnDestroy(): void {
    if (!!this.interval) {
      clearInterval(this.interval);
    }
    this.conMonSub.unsubscribe();
    if(!!this.offerMsgSub) {
      this.offerMsgSub.unsubscribe();
    }
  }

  switchContent(): void {
    this.selFeature =
      this.selFeature === this.myFeature.chat
        ? this.myFeature.phone
        : this.myFeature.chat;
    console.log("New feature " + this.selFeature);
  }

  showGames(): void {
	  this.router.navigate(['games/bingo']);
  }

  openFileuploadDialog(): void {
    const dialogRef = this.dialog.open(FileuploadComponent, {
      width: "500px",
      data: { receiver: this.selectedContact },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.sendMessage(result);
      }
    });
  }

  openCameraDialog(): void {
    const dialogRef = this.dialog.open(CameraComponent, {
      width: "500px",
      data: { receiver: this.selectedContact },
    });
    dialogRef.afterClosed().subscribe((result) => {
      // console.log( result );
      if (result) {
        this.sendMessage(result);
      }
    });
  }

  openLoginDialog(): void {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: "600px",
      data: { myUser: this.myUser },
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.myUser =
        typeof result === 'undefined' || result === null ? null : result;
      if (this.myUser !== null) {
        this.ownContact = {
          name: this.myUser.username,
          base64Avatar: this.myUser.base64Avatar,
          publicKey: this.myUser.publicKey,
          userId: this.myUser.userId,
        };
        this.contacts = [];
        this.selectedContact = null;
        this.localdbService
          .loadContacts(this.ownContact)
          .then((values) => {
            this.contacts = values;
            this.selectContact(values && values.length > 0 ? values[0] : null);
          })
          .then(() => this.addMessages())
          .then(() => this.updateMessageInterval());
        this.updateContactListLayout();
        Notification.requestPermission();
      }
    });
  }

  logout(): void {
    this.myUser = null;
    this.ownContact = null;
    this.jwttokenService.jwtToken = null;
    this.contacts = [];
    this.messages = [];
    this.selFeature = MyFeature.chat;
    this.voiceService.disconnect();
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  selectContact(contact: Contact): void {
    this.selectedContact = contact;
    this.webrtcService.receiverId = this.selectedContact.name;
    this.addMessages().then(() => this.syncMsgs());
  }

  sendMessage(msg: Message): void {
    msg.fromId = this.ownContact.userId;
    this.cryptoService
      .encryptTextAes(this.myUser.password, this.myUser.salt, msg.text)
      .then((value) => {
        msg.text = value;
        return msg;
      })
      .then((myMsg) => this.localdbService.storeMessage(myMsg))
      .then(() =>
        this.addMessages().then(() => {
          this.syncMsgs();
          this.updateMessageInterval();
        })
      );
  }

  addNewContact(contact: Contact): void {
    this.contacts.push(contact);
    if (!this.selectedContact) {
      this.selectContact(contact);
    }
  }

  private updateMessageInterval() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(() => this.syncMsgs(), 15000);
  }

  private updateContactListLayout(event: MediaQueryListEvent = null) {
    const mediaQueryList = this.mediaMatcher.matchMedia(
      "(max-width: 900px) or (max-height: 480px)"
    );
    if ((!!event && !!event?.matches) || !!mediaQueryList?.matches) {
      this.contactList.close();
      this.contactListMode = "over";
      this.headerBarHeight = 178;
      this.windowHeight = window.innerHeight - this.headerBarHeight;
    } else {
      this.contactList.open();
      this.contactListMode = "side";
      this.headerBarHeight = 84;
      this.windowHeight = window.innerHeight - this.headerBarHeight;
    }
  }

  private receiveRemoteMsgs(syncMsgs1: SyncMsgs) {
    this.messageService.findMessages(syncMsgs1).subscribe(
      (msgs) => {
        const promises: PromiseLike<Message>[] = [];
        msgs = msgs.filter(
          (msg) =>
            syncMsgs1.lastUpdate.getTime() < new Date(msg.timestamp).getTime()
        );
        msgs.forEach((msg) => {
          promises.push(
            this.cryptoService
              .decryptLargeText(
                msg.text,
                this.myUser.privateKey,
                this.myUser.password
              )
              .then((value) => {
                msg.text = value;
                return msg;
              })
          );
        });
        Promise.all(promises).then((myMsgs) => {
          const promises2: PromiseLike<number>[] = [];
          myMsgs.forEach((msg) =>
            promises2.push(
              this.cryptoService
                .encryptTextAes(
                  this.myUser.password,
                  this.myUser.salt,
                  msg.text
                )
                .then((value) => {
                  msg.text = value;
                  return msg;
                })
                .then((myValue) => this.localdbService.storeMessage(myValue))
                .then()
            )
          );

          Promise.all(promises2).then((values) =>
            Promise.all(values).then(() => {
              if (promises.length > 0) {
                this.addMessages();
              }
            })
          );
        });
      },
      (error) => console.log("findMessages failed." + error)
    );
  }

  private sendRemoteMsgs(syncMsgs1: SyncMsgs): void {
    this.localdbService.toSyncMessages(this.ownContact).then((msgs) => {
      const oriMsgs: Message[] = JSON.parse(JSON.stringify(msgs));
      this.decryptLocalMsgs(msgs).then((value) => {
        this.encryptLocalMessages(value).then((myMsgs) => {
          const syncMsgs2: SyncMsgs = {
            ownId: this.ownContact.userId,
            msgs: myMsgs,
          };
          this.messageService.sendMessages(syncMsgs2).subscribe(
            (myMsgs2) => {
              this.sendMessages(msgs, oriMsgs, myMsgs2).then(() =>
                this.addMessages()
              );
            },
            (error) => console.log("sendRemoteMsgs failed." + error)
          );
        });
      });
    });
  }

  private sendMessages(
    messages: Message[],
    oriMsgs: Message[],
    myMsgs2: Message[]
  ): Promise<number[]> {
    const promises2: PromiseLike<number>[] = [];
    messages.forEach((msg) => {
      const newMsg = oriMsgs.filter(
        (oriMsg) => oriMsg.localId === msg.localId
      )[0];
      const myMsg = myMsgs2.filter(
        (myMsg2) => myMsg2.localId === msg.localId
      )[0];
      newMsg.send = true;
      newMsg.timestamp = myMsg.timestamp;
      promises2.push(this.localdbService.updateMessage(newMsg));
      //.then(result => console.log(msg), reject => console.log(reject));
    });
    return Promise.all(promises2);
  }

  private encryptLocalMessages(messages: Message[]): Promise<Message[]> {
    const promises: PromiseLike<Message>[] = [];
    messages.forEach((msg) => {
      const fromCon = !this.contacts.filter((con) => (con.userId = msg.toId))
        ? null
        : this.contacts.filter((con) => (con.userId = msg.toId))[0];
      if (!fromCon) {
        console.log(fromCon);
      } else {
        promises.push(
          this.cryptoService
            .encryptLargeText(msg.text, fromCon.publicKey)
            .then((result) => {
              msg.text = result;
              return msg;
            })
        );
      }
    });
    return Promise.all(promises);
  }

  private storeReceivedMessages(): void {
    this.messageService.findReceivedMessages(this.ownContact).subscribe({next:
      (msgs) => {
        if (msgs.length > 0) {
          this.localdbService
            .loadMessages(this.ownContact)
            .then((localMsgs) => {
              const msgsToStore: Message[] = [];
              msgs.forEach((msg) =>
                msgsToStore.push(
                  localMsgs.filter(
                    (localMsg) => localMsg.timestamp === msg.timestamp
                  )[0]
                )
              );
              msgsToStore.forEach((msg) => (msg.received = true));
              return msgsToStore;
            })
            .then((msgsToStore) => {
              const promises: PromiseLike<number>[] = [];
              msgsToStore.forEach((msgToStore) =>
                promises.push(this.localdbService.updateMessage(msgToStore))
              );
              return Promise.all(promises);
            })
            .then(() => this.addMessages());
        }
      },
      error: (error) => console.log("storeReceivedMessages failed." + error)
    });
  }

  private async syncMsgs(): Promise<void> {
    if (
      this.ownContact &&
      this.netConnectionService.connetionStatus &&
      !this.jwttokenService.localLogin
    ) {
      const contactIds = this.contacts.map((con) => con.userId);
      const syncMsgs1: SyncMsgs = {
        ownId: this.ownContact.userId,
        contactIds,
        lastUpdate: this.getLastSyncDate(),
      };
      this.receiveRemoteMsgs(syncMsgs1);
      this.sendRemoteMsgs(syncMsgs1);
      this.storeReceivedMessages();
      this.initWebrtcConnection();
    }
  }

  private async initWebrtcConnection(): Promise<void> {
    const result = await this.voiceService.connect(
      this.jwttokenService.jwtToken
    );
    if (!!result) {
      this.webrtcService.addIncomingMessageHandler();
      this.webrtcService.senderId = this.ownContact.name;
      this.webrtcService.receiverId = this?.selectedContact?.name;
      this.offerMsgSub = this.webrtcService.offerMsgSubject
        .pipe(
          filter((offerMsg) => !!offerMsg.receiverId && !!offerMsg.senderId)
        )
        .subscribe((offerMsg) => {
          // console.log(offerMsg);
          this.selFeature = MyFeature.phone;
        });
    }
  }

  private async decryptLocalMsgs(msgs: Message[]): Promise<Message[]> {
    const promises: PromiseLike<Message>[] = [];
    msgs.forEach((msg) => {
      promises.push(
        this.cryptoService
          .decryptTextAes(this.myUser.password, this.myUser.salt, msg.text)
          .then((value) => {
            msg.text = value;
            return msg;
          })
      );
    });
    const msgs2 = await Promise.all(promises);
    return msgs2;
  }

  private getLastSyncDate(): Date {
    const sortedMsg = this.messages
      .filter(
        (i) => !(typeof i.timestamp === "undefined") && !(i.timestamp === null)
      )
      .sort(
        (i1, i2) =>
          new Date(i1.timestamp).getTime() - new Date(i2.timestamp).getTime()
      );
    return sortedMsg.length === 0
      ? new Date("2000-01-01")
      : new Date(sortedMsg[sortedMsg.length - 1].timestamp);
  }

  private async addMessages(): Promise<Message[]> {
    const msgs = await this.localdbService.loadMessages(this.selectedContact);
    const values = await this.decryptLocalMsgs(msgs);
    while (this.messages.length > 0) {
      this.messages.pop();
    }
    this.messages = values.map((msg) => {
	  if(Notification.permission === "granted") {
		  new Notification(`Msg from: ${msg.fromId}`, {vibrate: 400});
	  }
      if (msg.filename) {
        msg.text = atob(msg.text.split("base64,")[1]);
        msg.url = this.sanitizer.bypassSecurityTrustUrl(
          URL.createObjectURL(new Blob([msg.text]))
        );
      }
      return msg;
    });
    return this.messages;
  }

  private onlineAgain(online: boolean): void {
    if (
      online &&
      this.jwttokenService.getExpiryDate().getTime() < new Date().getTime()
    ) {
      alert(
        this.translationsService.getTranslation(
          this.componentKey,
          TranslationsService.ONLINE_AGAIN_MSG
        )
      );
    }
  }
}
