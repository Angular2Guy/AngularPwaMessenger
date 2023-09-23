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
  AfterViewInit,
  Component,
  HostListener,
  OnInit,
  ViewChild,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatSidenav, MatSidenavModule } from "@angular/material/sidenav";
import { Router,RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { ContactsComponent } from "../contacts/contacts.component";
import { MediaMatcher } from "@angular/cdk/layout";
import { BaseComponent, MyEvent } from "src/app/common/base.component";
import { LocaldbService } from "src/app/services/localdb.service";
import { JwtTokenService } from "src/app/services/jwt-token.service";
import { ContactService } from "src/app/services/contact.service";
import { Message } from "src/app/model/message";
import { GamesService } from "../services/games/games.service";

@Component({
    standalone: true,
    selector: 'app-games',
    templateUrl: './games.component.html',
    styleUrls: ['./games.component.scss'],
    imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    ContactsComponent,
  ],
})
export class GamesComponent 
  extends BaseComponent
  implements OnInit, AfterViewInit
{
  constructor(
    private router: Router,
    mediaMatcher: MediaMatcher,
    localdbService: LocaldbService,
    jwttokenService: JwtTokenService,
    contactService: ContactService,
    private gamesService: GamesService
  ) {
    super(mediaMatcher, localdbService, jwttokenService, contactService);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
  }

  @HostListener("window:resize", ["$event"])
  myResize(event: MyEvent): void {
    super.onResize(event);
  }

  get contactList() {
    return this.myContactList;
  }

  protected afterContactsLoaded(): Promise<Message[]> {
    return Promise.resolve([]);
  }

  protected afterContactsAdded(): void {
	  this.gamesService.contacts = this.contacts;
	  this.gamesService.myUser = this.myUser;
	  this.gamesService.selectedContact = this.selectedContact;
	  this.gamesService.windowHeight = this.windowHeight;
  }

  @ViewChild("contact_list1")
  set contactList(myContactList: MatSidenav) {
    this.myContactList = myContactList;
  }

  protected updateContactListLayout(event: MediaQueryListEvent = null): void {
	super.updateContactListLayout(event);
	this.gamesService.windowHeight = this.windowHeight;  
  }

  back(): void {
    this.router.navigate(["/"]);
  }
}
