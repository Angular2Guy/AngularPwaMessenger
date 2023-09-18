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
import { LocaldbService } from "./localdb.service";
import { HttpClient } from "@angular/common/http";
import { Contact } from "../model/contact";
import { from, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ContactService {
  private readonly contactUrl = "/rest/contact";
  private myOwnContact: Contact = null;
  
  constructor(
    private localdbService: LocaldbService,
    private http: HttpClient
  ) {}

  get ownContact() {
	  return this.myOwnContact;
  }

  set ownContact(ownContact1: Contact) {
	  this.myOwnContact = ownContact1;
  }

  loadContacts(contact: Contact): Observable<Contact[]> {
    return from(this.localdbService.loadContacts(contact));
  }

  findContacts(conName: string): Observable<Contact[]> {
    const con: Contact = {
      name: conName,
      base64Avatar: null,
      publicKey: null,
      userId: null,
    };
    return this.http.post<Contact[]>(this.contactUrl + "/findcontacts", con);
  }
}
