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
import { Component, OnInit, EventEmitter, Output, Input, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { startWith, map, debounceTime, distinctUntilChanged, tap, switchMap, filter, flatMap } from 'rxjs/operators';
import { ContactService } from '../services/contact.service';
import { Contact } from '../model/contact';
import { NetConnectionService } from '../services/net-connection.service';
import { LocaldbService } from '../services/localdb.service';
import { LocalContact } from '../model/localContact';

@Component( {
    selector: 'app-add-contacts',
    templateUrl: './add-contacts.component.html',
    styleUrls: ['./add-contacts.component.scss']
} )
export class AddContactsComponent implements OnInit, OnDestroy {
    
    @Output() addNewContact = new EventEmitter<Contact>();
    @Input() userId: string;
    @Input() myContacts: Contact[];
    myControl = new FormControl();
    options: string[] = [];
    filteredOptions: Contact[] = [];
    contactsLoading = false;
    connected = false;
    myControlSub: Subscription = null;
    myNetConServiceSub: Subscription = null;

    constructor( 
            private contactService: ContactService,
            private netConService: NetConnectionService,
            private localdbService: LocaldbService) { }

    ngOnInit() {             
        this.connected = this.netConService.connetionStatus;
        this.netConService.connectionMonitor.subscribe( conn => this.connected = conn );
        this.myControlSub = this.myControl.valueChanges
            .pipe(
                debounceTime( 400 ),
                distinctUntilChanged(),
                tap( () => this.contactsLoading = true ),
                switchMap( name => this.contactService.findContacts( name ) ),
                map(contacts => contacts.filter(con => con.userId !== this.userId)),
                map(contacts => this.filterContacts(contacts)),
                tap( () => this.contactsLoading = false )
            ).subscribe(contacts => this.filteredOptions = contacts);
    }

    ngOnDestroy(): void {
      this.myNetConServiceSub.unsubscribe();
      this.myControlSub.unsubscribe();
    }
    
    private filterContacts(contacts: Contact[]): Contact[] {
        return contacts.filter(con => 
          this.myContacts.filter(myCon => 
            myCon.userId === con.userId).length === 0);
    }
    
    addContact() {
        if(this.filteredOptions.length === 1 && this.connected) {
            if(!this.filteredOptions[0].base64Avatar) {
                this.filteredOptions[0].base64Avatar = 'assets/icons/smiley-640.jpg';
            }
            const localContact: LocalContact = {
                base64Avatar: this.filteredOptions[0].base64Avatar,                
                name: this.filteredOptions[0].name,
                ownerId: this.userId, 
                publicKey: this.filteredOptions[0].publicKey,
                userId: this.filteredOptions[0].userId
            }; 
            this.localdbService.storeContact(localContact)
                .then(() => {
                    this.addNewContact.emit(this.filteredOptions[0]);
                    this.myControl.reset();
                    this.filteredOptions = [];
                });
        }
    }
}
