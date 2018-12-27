import { Component, OnInit } from '@angular/core';
import { Contact } from '../model/contact';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent implements OnInit {
  contacts: Contact[] = [];

  constructor() { }

  ngOnInit() {
    this.contacts.push({
      name: "Max",
      base64Avatar: ""
    },
    {
      name: "Moritz",
      base64Avatar: ""
    });
  }

}
