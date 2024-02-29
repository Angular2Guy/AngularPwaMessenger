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
import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { Contact } from "../model/contact";
import { CommonModule } from "@angular/common";
import { AiName } from "../model/aiFriend/ai-config";

@Component({
  standalone: true,
  selector: "app-contacts",
  templateUrl: "./contacts.component.html",
  styleUrls: ["./contacts.component.scss"],
  imports: [CommonModule],
})
export class ContactsComponent implements OnInit {
  AiName = AiName;
  @Input()
  selectedContact: Contact;
  @Input()
  contacts: Contact[] = [];
  @Output()
  selContact = new EventEmitter<Contact>();

  constructor() {}

  ngOnInit() {}

  select(contact: Contact) {
    this.selContact.emit(contact);
  }
}
