import { Component, OnInit, Input } from '@angular/core';
import { Message } from '../model/message';
import { Contact } from '../model/contact';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

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
  
  messageForm: FormGroup;
  
  constructor(fb: FormBuilder) { 
    this.messageForm = fb.group({
      message: ['', Validators.required],
    });
  }

  ngOnInit() {
  }
  
  sendMsg() {
    console.log(this.messageForm.valid);
    console.log(this.messageForm.controls['message'].value);
  }
}
