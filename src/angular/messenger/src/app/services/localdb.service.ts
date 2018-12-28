import { Injectable } from '@angular/core';
import Dexie from 'dexie';
import { Contact } from '../model/contact';
import { Message } from '../model/message';


@Injectable( {
  providedIn: 'root'
} )
export class LocaldbService extends Dexie {
  contacts: Dexie.Table<Contact, number>;
  messages: Dexie.Table<Message, number>;

  constructor() {
    super( "LocaldbService" );
    this.version( 1 ).stores( {
      contacts: 'id, name, base64Avatar',
      messages: '++id, fromId, toId, timestamp, text, send, received'
    });
  }
  
  storeContact(contact: Contact): Promise<number> {
    return this.transaction('rw', this.contacts, () => this.contacts.add(contact));
  }
  
  loadContacts(): Promise<Dexie.Collection<Contact, number>> {    
    return this.transaction('r', this.contacts, () => this.contacts.orderBy('name'));
  }
}
