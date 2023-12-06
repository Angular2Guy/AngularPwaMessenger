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
import { Injectable } from "@angular/core";
import Dexie from "dexie";
import { LocalContact } from "../model/local-contact";
import { LocalMessage } from "../model/local-message";
import { LocalUser } from "../model/local-user";
import { Contact } from "../model/contact";
import { Message } from "../model/message";

@Injectable({
  providedIn: "root",
})
export class LocaldbService extends Dexie {
  contacts: Dexie.Table<LocalContact, number>;
  messages: Dexie.Table<LocalMessage, number>;
  users: Dexie.Table<LocalUser, number>;

  constructor() {
    super("LocaldbService");
    this.version(1).stores({
      contacts: "++id, name, base64Avatar, base64PublicKey, userId, ownerId",
      messages: "++id, fromId, toId, timestamp, text, send, received",
      users: "++id, createdAt, username, password, email, base64Avatar, userId",
    });
  }

  storeContact(contact: LocalContact): Promise<number> {
    return this.transaction("rw", this.contacts, () =>
      this.contacts.put(contact, contact.localId)
    );
  }

  loadContacts(contact: Contact): Promise<LocalContact[]> {
    return this.transaction("r", this.contacts, () => 	
      this.contacts
        .filter((con) => con.ownerId === contact.userId)
        .sortBy("name"));
  }

  storeMessage(message: Message): Promise<number> {
    const localMessage: LocalMessage = message;
    delete localMessage.id;
    return this.transaction("rw", this.messages, () =>
      this.messages.add(localMessage)
    );
  }

  updateMessage(message: Message): Promise<number> {
    const localMessage: LocalMessage = message;
    localMessage.id = message.localId;
    delete message.localId;
    return this.transaction("rw", this.messages, () =>
      this.messages.update(localMessage.id, message)
    );
  }

  loadMessages(contact: Contact): Promise<Message[]> {
    return this.transaction("rw", this.messages, () =>
      this.messages
        .filter(
          (msg) => msg.toId === contact.userId || msg.fromId === contact.userId
        )
        .sortBy("timestamp")
    ).then((localMsgs) => this.localMsgToMsg(localMsgs));
  }

  toSyncMessages(contact: Contact): Promise<Message[]> {
    return this.transaction("rw", this.messages, () =>
      this.messages
        .filter((msg) => msg.fromId === contact.userId)
        .filter((msg) => !msg.send)
        .filter(
          (msg) =>
            msg.timestamp === null || typeof msg.timestamp === "undefined"
        )
        .toArray()
    ).then((localMsgs) => this.localMsgToMsg(localMsgs));
  }

  storeUser(user: LocalUser): Promise<number> {
    return this.transaction("rw", this.users, () => this.users.add(user));
  }

  loadUser(user: LocalUser): Promise<Dexie.Collection<LocalUser, number>> {
    return this.transaction("rw", this.users, () =>
      this.users.filter((dbuser) => dbuser.username === user.username)
    );
  }

  private localMsgToMsg(localMsgs: LocalMessage[]): Message[] {
    return localMsgs.map((localMsg) => {
      const msg: Message = localMsg;
      msg.localId = localMsg.id;
      localMsg.id = null;
      return msg;
    });
  }
}
