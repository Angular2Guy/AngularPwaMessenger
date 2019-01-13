import { Injectable } from '@angular/core';
import Dexie from 'dexie';
import { Contact } from '../model/contact';
import { Message } from '../model/message';
import { LocalUser } from '../model/localUser';

@Injectable( {
  providedIn: 'root'
} )
export class LocaldbService extends Dexie {
  contacts: Dexie.Table<Contact, number>;
  messages: Dexie.Table<Message, number>;
  users:    Dexie.Table<LocalUser, number>;

  constructor() {
    super( "LocaldbService" );
    this.version( 1 ).stores({
      contacts: '++id, name, base64Avatar, userId',
      messages: '++id, fromId, toId, timestamp, text, send, received',
      users: '++id, createdAt, username, password, email, base64Avatar'
    });
  }
  
  storeContact(contact: Contact): Promise<number> {
    return this.transaction('rw', this.contacts, () => this.contacts.add(contact));
  }
  
  loadContacts(): Promise<Dexie.Collection<Contact, number>> {    
    return this.transaction('r', this.contacts, () => this.contacts.orderBy('name'));
  }
  
  storeMessage(message: Message): Promise<number> {
    return this.transaction('rw', this.messages, () => this.messages.add(message));
  }
  
  loadMessages(contact: Contact): Promise<Dexie.Collection<Message, number>> {
    return this.transaction('rw', this.messages, () => this.messages.orderBy('timestamp').filter(msg => (msg.toId === contact.id || msg.fromId === contact.id)));
  }
  
  storeUser(user: LocalUser): Promise<number> {
    return this.transaction('rw', this.users, () => this.users.add(user));
  }
}
