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
  DestroyRef,
  inject,
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { MediaMatcher } from "@angular/cdk/layout";
import { Contact } from "../model/contact";
import { Message } from "../model/message";
import { LocaldbService } from "../services/localdb.service";
import { MatDialog } from "@angular/material/dialog";
import { LoginComponent } from "../login/login.component";
import { SyncMsgs } from "../model/sync-msgs";
import { JwtTokenService } from "../services/jwt-token.service";
import { NetConnectionService } from "../services/net-connection.service";
import { MessageService } from "../services/message.service";
import { CryptoService } from "../services/crypto.service";
import { TranslationsService } from "../services/translations.service";
import { filter, Subscription, tap } from "rxjs";
import { CameraComponent } from "../camera/camera.component";
import { FileuploadComponent } from "../fileupload/fileupload.component";
import { VoiceService } from "../services/voice.service";
import { MatDrawerMode, MatSidenav } from "@angular/material/sidenav";
import { WebrtcService } from "../services/webrtc.service";
import { Router } from "@angular/router";
import { ContactService } from "../services/contact.service";
import { BaseComponent } from "../common/base.component";
import { GamesService } from "../services/games/games.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ContactUpdate } from "../model/contact-update";
import { LocalContact } from "../model/local-contact";
import { AiName, AiUserId } from "../model/aiFriend/ai-config";
import { AiFriendService } from "../services/aiFriend/ai-friend.service";
import { AiMessage, MessageType } from "../model/aiFriend/ai-message";

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
export class MainComponent
  extends BaseComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  protected windowHeight: number;
  protected contacts: Contact[] = [];
  protected messages: Message[] = [];
  protected myFeature = MyFeature;
  protected selFeature = MyFeature.chat;
  protected contactListMode: MatDrawerMode = "side";
  protected samIsThinking = false;
  private readonly componentKey = TranslationsService.MAIN_COMPONENT;
  private interval: any;
  private readonly destroy: DestroyRef = inject(DestroyRef);

  constructor(
    localdbService: LocaldbService,
    jwttokenService: JwtTokenService,
    private netConnectionService: NetConnectionService,
    private messageService: MessageService,
    private translationsService: TranslationsService,
    protected dialog: MatDialog,
    private cryptoService: CryptoService,
    private voiceService: VoiceService,
    private webrtcService: WebrtcService,
    contactService: ContactService,
    gamesService: GamesService,
    private aiService: AiFriendService,
    mediaMatcher: MediaMatcher,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {
    super(
      mediaMatcher,
      localdbService,
      jwttokenService,
      contactService,
      gamesService
    );
  }

  get ownContact() {
    return this.contactService.ownContact;
  }

  @HostListener("window:resize", ["$event"])
  onResize(event: any): void {
    this.windowHeight = event.target.innerHeight - this.headerBarHeight;
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.netConnectionService.connectionMonitor
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((online) => this.onlineAgain(online));
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
  }

  ngOnDestroy(): void {
    if (!!this.interval) {
      clearInterval(this.interval);
    }
  }

  get contactList() {
    return this.myContactList;
  }

  @ViewChild("contact_list")
  set contactList(myContactList: MatSidenav) {
    this.myContactList = myContactList;
  }

  switchContent(): void {
    this.selFeature =
      this.selFeature === this.myFeature.chat
        ? this.myFeature.phone
        : this.myFeature.chat;
    console.log("New feature " + this.selFeature);
  }

  showGames(): void {
    this.router.navigate(["games"]);
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
      this.myUser = !result ? null : result;
      if (!!this.myUser) {
        this.contactService.ownContact = {
          name: this.myUser.username,
          base64Avatar: this.myUser.base64Avatar,
          publicKey: this.myUser.publicKey,
          userId: this.myUser.userId,
        };
        this.gamesService.myUser = this.myUser;
        this.initMyUser();
      }
    });
  }

  logout(): void {
    this.myUser = null;
    this.contactService.ownContact = null;
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
    if (!!contact) {
      this.webrtcService.receiverId = this.selectedContact.name;
      this.addMessages().then(() => this.syncMsgs());
    }
  }

  sendMessage(msg: Message): void {
    msg.fromId = this.ownContact.userId;
    this.cryptoService
      .encryptTextAes(this.myUser.password, this.myUser.salt, msg.text)
      .then((value) => {
        const encMsg = JSON.parse(JSON.stringify(msg));
        encMsg.text = value;
        return encMsg;
      })
      .then((encMsg) => this.localdbService.storeMessage(encMsg))
      .then((encMsgId) =>
        this.localdbService
          .loadMessages(this.ownContact)
          .then(
            (myMsgs) => myMsgs.filter((myMsg) => myMsg.localId === encMsgId)[0]
          )
      )
      .then((myEncMsg) => {
        if (msg.toId !== AiUserId) {
          this.addMessages().then(() => {
            this.syncMsgs();
            this.updateMessageInterval();
          });
        } else {
          this.sendMessageToSam(msg, myEncMsg);
        }
      });
  }

  sendMessageToSam(msg: Message, encMsg: Message): void {
    const aiMessage = {
      content: msg.text,
      messageType: MessageType.USER,
      properties: new Map<string, object>(),
    } as AiMessage;
    encMsg.send = true;
    encMsg.timestamp = msg.timestamp;
    const myEncMsg = JSON.parse(JSON.stringify(encMsg));
    //console.log(myEncMsg);
    const myPromise = this.localdbService
      .updateMessage(encMsg)
      .then(() => this.addMessages())
      .then((x) => {
        this.samIsThinking = true;
        return x;
      });
    this.aiService
      .postTalkToSam(aiMessage)
      .pipe(
        tap(() => this.markMsgAsReceived(myEncMsg, myPromise)),
        takeUntilDestroyed(this.destroy)
      )
      .subscribe((result) => {
        //console.log(result);
        let myResult = result
          .map((value) => {
          //console.log(value);
          //console.log(value.result.metadata?.finishReason);
          return value?.result?.output?.content;
          })
          .join("")
          .trim();
          //console.log(myResult);
          myResult = !!myResult ? myResult : $localize `:@@IdontKnow:I am sorry. I do not have an answer.`;
        //console.log(myResult);
        const response = {
          fromId: AiUserId,
          received: true,
          send: true,
          toId: this.myUser.userId,
          text: myResult,
        } as Message;
        this.storeAndShowMsg([response]);
        this.samIsThinking = false;
      });
  }

  private markMsgAsReceived(
    encMsg: Message,
    myPromise: PromiseLike<Message[]>
  ): void {
    myPromise
      .then(() => {
        encMsg.received = true;
        encMsg.send = true;
        //console.log(encMsg);
        return this.localdbService.updateMessage(encMsg);
      })
      .then((myId) => this.addMessages());
  }

  addNewContact(contact: Contact): void {
    this.contacts.push(contact);
    this.contactService
      .updateContacts({
        userId: this.myUser.userId,
        contacts: this.contacts,
      } as ContactUpdate)
      .subscribe((result) => console.log(result));
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

  private receiveRemoteMsgs(syncMsgs1: SyncMsgs) {
    this.messageService
      .findMessages(syncMsgs1)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(
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
          Promise.all(promises).then(
            (myMsgs) => this.storeAndShowMsg(myMsgs)
            /*{
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
        }*/
          );
        },
        (error) => console.log("findMessages failed." + error)
      );
  }

  private storeAndShowMsg(messages: Message[]): void {
    const promises2: PromiseLike<number>[] = [];
    messages.forEach((msg) =>
      promises2.push(
        this.cryptoService
          .encryptTextAes(this.myUser.password, this.myUser.salt, msg.text)
          .then((value) => {
            msg.text = value;
            return msg;
          })
          .then((myValue) => this.localdbService.storeMessage(myValue))
          .then()
      )
    );

    Promise.all(promises2).then((values) =>
      Promise.all(values).then(() => this.addMessages())
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
          this.messageService
            .sendMessages(syncMsgs2)
            .pipe(takeUntilDestroyed(this.destroy))
            .subscribe(
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
    this.messageService
      .findReceivedMessages(this.ownContact)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (msgs) => {
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
        error: (error) => console.log("storeReceivedMessages failed." + error),
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
      this.webrtcService.offerMsgSubject
        .pipe(
          filter((offerMsg) => !!offerMsg.receiverId && !!offerMsg.senderId),
          takeUntilDestroyed(this.destroy)
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

  protected afterContactsLoaded(): Promise<Message[]> {
    //console.log(this.gamesService.myUser);
    this.myUser = this.gamesService.myUser;
    const myPromise = this.aiService
      .getAiConfig()
      .toPromise()
      .then((result) => {
        if (!!result.enabled) {
          this.contacts.push({
            base64Avatar: null,
            name: AiName.AiSam,
            publicKey: this.myUser.publicKey,
            userId: AiUserId,
          } as Contact);
        }
      })
      .then(() => {
        if (
          this.myUser?.contacts?.length > 0 &&
          !!this.netConnectionService.connetionStatus
        ) {
          let contactMap = new Map<string, Contact>();
          const myPromise2 = this.contactService
            .loadContactsByIds(this.myUser.contacts)
            .pipe(takeUntilDestroyed(this.destroy))
            .toPromise()
            .then((result) => {
              this.contacts.forEach((myContact) =>
                contactMap.set(myContact.userId, myContact)
              );
              result
                .filter(
                  (myContact) =>
                    this.contacts.filter(
                      (myContact1) => myContact.userId === myContact1.userId
                    ).length === 0
                )
                .map(
                  (myContact) =>
                    ({
                      base64Avatar: myContact.base64Avatar,
                      name: myContact.name,
                      ownerId: myContact.userId,
                      publicKey: myContact.publicKey,
                      userId: myContact.userId,
                    } as LocalContact)
                )
                .forEach((myContact) =>
                  this.localdbService.storeContact(myContact)
                );
              result.forEach((myContact) =>
                contactMap.set(myContact.userId, myContact)
              );
              this.contacts = [];
              contactMap.forEach((value, _) => this.contacts.push(value));
              if (this.contacts.length > 0) {
                this.selectContact(this.contacts[0]);
              }
              return result;
            });
          return myPromise2;
        } else {
          return Promise.resolve([]);
        }
      });
    return myPromise.then(() => this.addMessages());
  }

  protected afterContactsAdded(): void {
    this.updateMessageInterval();
  }

  private async addMessages(): Promise<Message[]> {
    const msgs = await this.localdbService.loadMessages(this.selectedContact);
    const values = await this.decryptLocalMsgs(msgs);
    while (this.messages.length > 0) {
      this.messages.pop();
    }
    this.messages = values.map((msg) => {
      if (
        msg.fromId !== AiUserId &&
        msg.toId !== AiUserId &&
        Notification.permission === "granted"
      ) {
        new Notification(`Msg from: ${msg.fromId}`, { vibrate: 400 });
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
