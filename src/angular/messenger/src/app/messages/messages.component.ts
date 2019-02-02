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
