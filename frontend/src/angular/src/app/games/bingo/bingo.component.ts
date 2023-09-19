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
import { Component, HostListener, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDrawerMode, MatSidenavModule } from "@angular/material/sidenav";
import { Router } from '@angular/router';
import { BingoService } from 'src/app/services/games/bingo.service';
import { CommonModule } from '@angular/common';
import { Contact } from 'src/app/model/contact';
import { ContactsComponent } from "../../contacts/contacts.component";

@Component({
    standalone: true,
    selector: 'app-bingo',
    templateUrl: './bingo.component.html',
    styleUrls: ['./bingo.component.scss'],
    providers: [BingoService],
    imports: [CommonModule, MatToolbarModule, MatButtonModule, MatSidenavModule, ContactsComponent]
})
export class BingoComponent implements OnInit {
	private headerBarHeight = 84;
	protected windowHeight: number;
	protected contactListMode: MatDrawerMode = "side";
	protected contacts: Contact[] = [];
    protected selectedContact: Contact;
	
	constructor(private router: Router) {}
	
    ngOnInit(): void {
      this.windowHeight = window.innerHeight - this.headerBarHeight;
    }
	
    @HostListener("window:resize", ["$event"])
    onResize(event: any): void {
      this.windowHeight = event.target.innerHeight - this.headerBarHeight;
      console.log(this.windowHeight);
    }
	
	back(): void {
		this.router.navigate(['/']);
	}
	
	selectContact(contact: Contact): void {
		this.selectedContact = contact;	  
	}
}
