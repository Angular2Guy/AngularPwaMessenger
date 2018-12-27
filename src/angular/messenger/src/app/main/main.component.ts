import { Component, OnInit, HostListener } from '@angular/core';
import { Contact } from '../model/contact';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  windowHeight: number;
  contacts: Contact[] = [];
  myContact: Contact;

  constructor() { }

  ngOnInit() {
   this.windowHeight = window.innerHeight -20; 
   this.contacts.push({
     name: "Max",
     base64Avatar: "assets/icons/smiley-640.jpg"
   },
   {
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
  }
}
