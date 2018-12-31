import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Message } from '../model/message';
import { Contact } from '../model/contact';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { LocaldbService } from '../services/localdb.service';

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
  @Output()
  sendMsg = new EventEmitter<string>();
  
  messageForm: FormGroup;
  
  constructor(private fb: FormBuilder) { 
    this.messageForm = fb.group({
      message: ['', Validators.required],
    });
  }

  ngOnInit() {
  }
  
  sendMessage() {    
    this.sendMsg.emit(this.messageForm.controls['message'].value);    
  }
}
