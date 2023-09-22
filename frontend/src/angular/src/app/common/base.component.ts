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

import { MediaMatcher } from "@angular/cdk/layout";
import { AfterViewInit, Injectable, OnInit } from "@angular/core";
import { MatDrawerMode, MatSidenav } from "@angular/material/sidenav";
import { Contact } from "../model/contact";
import { LocaldbService } from "../services/localdb.service";
import { JwtTokenService } from "../services/jwt-token.service";
import { ContactService } from "../services/contact.service";
import { LocalUser } from "../model/local-user";
import { MyUser } from "../model/my-user";
import { Message } from "../model/message";

export interface MyEventTarget {
  readonly innerHeight: number | null;
}

export interface MyEvent {
  readonly target: MyEventTarget | null;
}

@Injectable()
export class BaseComponent implements OnInit, AfterViewInit {
  protected headerBarHeight = 84;
  protected windowHeight: number;
  protected contactListMode: MatDrawerMode = "side";
  protected myContactList: MatSidenav;
  protected contacts: Contact[] = [];
  protected selectedContact: Contact;
  protected myUser: MyUser = null;

  constructor(
    protected mediaMatcher: MediaMatcher,
    protected localdbService: LocaldbService,
    protected jwttokenService: JwtTokenService,
    protected contactService: ContactService
  ) {}

  ngOnInit(): void {
    this.windowHeight = window.innerHeight - this.headerBarHeight;
    this.initLocalUser();
  }

  ngAfterViewInit(): void {
    const mediaQueryList = this.mediaMatcher.matchMedia(
      "(max-width: 900px) or (max-height: 480px)"
    );
    mediaQueryList.onchange = (event) => this.updateContactListLayout(event);
    //setTimeout(() => this.updateContactListLayout());
  }

  protected selectContact(contact: Contact): void {
    this.selectedContact = contact;
  }

  protected onResize(event: MyEvent): void {
    this.windowHeight = event.target.innerHeight - this.headerBarHeight;
  }

  initLocalUser(): void {
    let myLocalUser: LocalUser = {
      base64Avatar: null,
      createdAt: null,
      email: null,
      hash: null,
      publicKey: null,
      privateKey: null,
      salt: null,
      username: this.contactService?.ownContact?.name,
      userId: null,
    };
    if (!!myLocalUser.username) {
      this.localdbService
        .loadUser(myLocalUser)
        .then((result) => !!result && result.first())
        .then((result) => {
          if (!!result && !!result?.username) {
            this.myUser = {
              ...result,
              token: this.jwttokenService.jwtToken,
              password: null,
            } as MyUser;
            this.initMyUser();
          }
        });
    }
  }

  protected afterContactsLoaded(): Promise<Message[]> {
    return Promise.resolve([]);
  }

  protected afterContactsAdded(): void {}

  protected initMyUser(): void {
    if (!!this.myUser) {
      this.contacts = [];
      this.selectedContact = null;
      this.localdbService
        .loadContacts(this.contactService.ownContact)
        .then((values) => {
          this.contacts = values;
          this.selectContact(values && values.length > 0 ? values[0] : null);
        })
        .then(() => this.afterContactsLoaded())
        .then(() => this.afterContactsAdded);
      this.updateContactListLayout();
      Notification.requestPermission();
    }
  }

  private updateContactListLayout(event: MediaQueryListEvent = null) {
    const mediaQueryList = this.mediaMatcher.matchMedia(
      "(max-width: 900px) or (max-height: 480px)"
    );
    if ((!!event && !!event?.matches) || !!mediaQueryList?.matches) {
      this.myContactList.close();
      this.contactListMode = "over";
      this.headerBarHeight = 178;
      this.windowHeight = window.innerHeight - this.headerBarHeight;
    } else {
      this.myContactList.open();
      this.contactListMode = "side";
      this.headerBarHeight = 84;
      this.windowHeight = window.innerHeight - this.headerBarHeight;
    }
  }
}
