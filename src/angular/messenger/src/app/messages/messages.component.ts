import { Component, OnInit, Input } from '@angular/core';
import { Message } from '../model/message';
import { Contact } from '../model/contact';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss']
})
export class MessagesComponent implements OnInit {
  @Input()
  messages: Message;
  @Input()
  receiver: Contact;
  
  constructor() { }

  ngOnInit() {
  }

}
