import { Component, OnInit, HostListener } from '@angular/core';
import { Contact } from '../model/contact';
import { Message } from '../model/message';
import { LocaldbService } from '../services/localdb.service';

@Component( {
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
} )
export class MainComponent implements OnInit {
  windowHeight: number;
  ownContact: Contact;
  contacts: Contact[] = [];
  myContact: Contact;
  messages: Message[] = [];

  constructor( private localdbService: LocaldbService ) { }

  ngOnInit() {
    this.windowHeight = window.innerHeight - 20;
    const mycontacts: Contact[] = [];
    mycontacts.push(
      {
        id: "1",
        name: "Sven",
        base64Avatar: "assets/icons/smiley-640.jpg",
        own: true
      },
      {
        id: "2",
        name: "Max",
        base64Avatar: "assets/icons/smiley-640.jpg",
        own: false
      },
      {
        id: "3",
        name: "Moritz",
        base64Avatar: "assets/icons/smiley-640.jpg",
        own: false
      } );
    mycontacts.forEach( contact => this.localdbService.storeContact( contact ).then( ( result ) => console.log( result ) ) );
    this.localdbService.loadContacts().then( result => {
      result.filter( contact => !contact.own ).each( contact => this.contacts.push( contact ) );
      result.filter( contact => contact.own ).each( contact => this.ownContact = contact );
    } );
    const myMessages: Message[] = [];
    myMessages.push( {
      fromId: "1",
      toId: "2",
      timestamp: new Date().getTime(),
      text: "Hello1",
      send: true,
      received: true
    },
      {
        fromId: "2",
        toId: "1",
        timestamp: new Date().getTime(),
        text: "Hello2",
        send: true,
        received: true
      } );
    myMessages.forEach(msg => this.localdbService.storeMessage(msg).then(result => console.log(result)));    
  }

  @HostListener( 'window:resize', ['$event'] )
  onResize( event: any ) {
    this.windowHeight = event.target.innerHeight - 20;
  }

  selectContact( contact: Contact ) {
    this.myContact = contact;
    this.addMessages();
  }

  private addMessages() {
    while ( this.messages.length > 0 ) {
      this.messages.pop()
    }    
    this.localdbService.loadMessages(this.myContact).then(msgs => msgs.each(msg => this.messages.push(msg)));
  }
}
