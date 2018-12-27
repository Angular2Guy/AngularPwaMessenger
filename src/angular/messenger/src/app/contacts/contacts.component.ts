import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Contact } from '../model/contact';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent implements OnInit {
  @Input()
  contacts: Contact[] = [];
  @Output()
  selContact = new EventEmitter<Contact>();

  constructor() { }

  ngOnInit() {    
  }
  
  select(contact: Contact) {
    this.selContact.emit(contact);    
  }

}
