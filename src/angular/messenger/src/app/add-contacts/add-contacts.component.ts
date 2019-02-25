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
import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { startWith, map, debounceTime, distinctUntilChanged, tap, switchMap, filter, flatMap } from 'rxjs/operators';
import { ContactService } from '../services/contact.service';
import { Contact } from '../model/contact';
import { NetConnectionService } from '../services/net-connection.service';
import { LocaldbService } from '../services/localdb.service';

@Component( {
    selector: 'app-add-contacts',
    templateUrl: './add-contacts.component.html',
    styleUrls: ['./add-contacts.component.scss']
} )
export class AddContactsComponent implements OnInit {
    @Output() addNewContact = new EventEmitter<Contact>();
    @Input() userId: string;
    myControl = new FormControl();
    options: string[] = [];
    filteredOptions: Contact[] = [];
    contactsLoading = false;
    connected = false;

    constructor( 
            private contactService: ContactService,
            private netConService: NetConnectionService,
            private localdbService: LocaldbService) { }

    ngOnInit() {             
        this.connected = this.netConService.connetionStatus;
        this.netConService.connectionMonitor.subscribe( conn => this.connected = conn );
        this.myControl.valueChanges
            .pipe(
                debounceTime( 400 ),
                distinctUntilChanged(),
                tap( () => this.contactsLoading = true ),
                switchMap( name => this.contactService.findContacts( name ) ),
                map(contacts => contacts.filter(con => con.userId !== this.userId)),
                tap( () => this.contactsLoading = false )
            ).subscribe(contacts => this.filteredOptions = contacts);
    }

    addContact() {
        if(this.filteredOptions.length === 1 && this.connected) {
            if(!this.filteredOptions[0].base64Avatar) {
                this.filteredOptions[0].base64Avatar = 'assets/icons/smiley-640.jpg';
            }
            this.localdbService.storeContact(this.filteredOptions[0])
                .then(() => this.addNewContact.emit(this.filteredOptions[0]));
        }
    }
}
