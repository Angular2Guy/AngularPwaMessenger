import { Component, OnInit, HostListener } from '@angular/core';
import { Contact } from '../model/contact';
import { Message } from '../model/message';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  windowHeight: number;
  contacts: Contact[] = [];
  myContact: Contact;
  messages: Message[] = [];

  constructor() { }

  ngOnInit() {
   this.windowHeight = window.innerHeight -20;
   this.contacts.push({
     id: 1,
     name: "Max",
     base64Avatar: "assets/icons/smiley-640.jpg"
   },
   {
     id: 2,
     name: "Moritz",
     base64Avatar: "assets/icons/smiley-640.jpg"
   });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {    
    this.windowHeight = event.target.innerHeight -20;    
  }
  
  selectContact(contact: Contact) {   
    this.myContact = contact; 
    this.addMessages();
  }
  
  private addMessages() {   
    while(this.messages.length > 0) {
      this.messages.pop()
    }    
    this.messages.push({
      fromId: 1,
      toId: 2,
      timestamp: new Date().getTime(),
      text: "Hello1",
      send: true,
      received: true
    },
    {
      fromId: 2,
      toId: 1,
      timestamp: new Date().getTime(),
      text: "Hello2",
      send: true,
      received: true
    });
  }
}
