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
  Component,
  OnInit,
  EventEmitter,
  Output,
  Input,
  DestroyRef,
  inject,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import {
  map,
  debounceTime,
  distinctUntilChanged,
  tap,
  switchMap,
} from "rxjs/operators";
import { ContactService } from "../services/contact.service";
import { Contact } from "../model/contact";
import { LocaldbService } from "../services/localdb.service";
import { LocalContact } from "../model/local-contact";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
    selector: "app-add-contacts",
    templateUrl: "./add-contacts.component.html",
    styleUrls: ["./add-contacts.component.scss"],
    standalone: false
})
export class AddContactsComponent implements OnInit {
  @Output() addNewContact = new EventEmitter<Contact>();
  @Input() userId: string;
  @Input() myContacts: Contact[];
  protected myControl = new FormControl();
  protected filteredOptions: Contact[] = [];
  protected contactsLoading = false;
  private readonly destroy: DestroyRef = inject(DestroyRef);

  constructor(
    private contactService: ContactService,
    private localdbService: LocaldbService
  ) {}

  ngOnInit() {
    this.myControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroy),
        tap(() => (this.contactsLoading = true)),
        switchMap((name) => this.contactService.findContacts(name)),
        map((contacts) => contacts.filter((con) => con.userId !== this.userId)),
        map((contacts) => this.filterContacts(contacts)),
        tap(() => (this.contactsLoading = false))
      )
      .subscribe((contacts) => (this.filteredOptions = contacts));
  }

  addContact() {
    if (this.filteredOptions.length === 1) {
      if (!this.filteredOptions[0].base64Avatar) {
        this.filteredOptions[0].base64Avatar = "assets/icons/smiley-640.jpg";
      }
      const localContact: LocalContact = {
        base64Avatar: this.filteredOptions[0].base64Avatar,
        name: this.filteredOptions[0].name,
        ownerId: this.userId,
        publicKey: this.filteredOptions[0].publicKey,
        userId: this.filteredOptions[0].userId,
      };
      this.localdbService.storeContact(localContact).then(() => {
        this.addNewContact.emit(this.filteredOptions[0]);
        this.myControl.reset();
        this.filteredOptions = [];
      });
    }
  }

  private filterContacts(contacts: Contact[]): Contact[] {
    return contacts.filter(
      (con) =>
        this.myContacts.filter((myCon) => myCon.userId === con.userId)
          .length === 0
    );
  }
}
