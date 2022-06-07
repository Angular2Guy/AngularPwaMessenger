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
import { Constants } from '../common/constants';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss']
})
export class MessagesComponent implements OnInit {

  @Input()
  messages: Message[];
  @Input()
  receiver: Contact;
  @Output()
  sendMsg = new EventEmitter<Message>();
  messageForm: FormGroup;
  readonly formKeyMessage = 'message';

  constructor(private fb: FormBuilder) {
    this.messageForm = fb.group({
      [this.formKeyMessage]: ['', Validators.required],
    });
  }

  ngOnInit(): void {

  }

  isImageMsg(msg: Message): boolean {
    if(msg.text.startsWith(Constants.B64_IMAGE_PREFIX,0)) {
      msg.text = Constants.IMAGE_PREFIX + msg.text.substr(Constants.B64_IMAGE_PREFIX.length);
    }
    const result = msg.text.startsWith(Constants.IMAGE_PREFIX,0);
    return result;
  }

  sendMessage() {
    if(this.messageForm.valid)  {
        const msg: Message = {
                fromId: null,
                toId: this.receiver.userId,
                text: this.messageForm.controls.message.value,
                send: false,
                received: false
        };
        this.messageForm.reset();
        this.sendMsg.emit(msg);
    }
  }
}
