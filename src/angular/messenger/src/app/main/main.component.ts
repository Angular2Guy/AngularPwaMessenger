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
import { Component, OnInit, HostListener } from '@angular/core';
import { Contact } from '../model/contact';
import { Message } from '../model/message';
import { LocaldbService } from '../services/localdb.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { LoginComponent } from '../login/login.component';
import { MyUser } from '../model/myUser';
import { SyncMsgs } from '../model/syncMsgs';
import { JwttokenService } from '../services/jwttoken.service';
import { AuthenticationService } from '../services/authentication.service';
import { NetConnectionService } from '../services/net-connection.service';
import { MessageService } from '../services/message.service';

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
  myUser: MyUser = null;

  constructor( private localdbService: LocaldbService, 
               private jwttokenService: JwttokenService,
               private netConnectionService: NetConnectionService,
               private messageService: MessageService,
               public dialog: MatDialog ) { }

  ngOnInit() {
    this.windowHeight = window.innerHeight - 20;
    this.netConnectionService.connectionMonitor.subscribe(online => this.syncMsgs());
//    const mycontacts: Contact[] = [];
//    mycontacts.push(
//      {
//        id: 1,
//        name: "Sven",
//        base64Avatar: "assets/icons/smiley-640.jpg",
//        userId: 1
//      },
//      {
//        id: 2,
//        name: "Max",
//        base64Avatar: "assets/icons/smiley-640.jpg",
//        userId: 1
//      },
//      {
//        id: 3,
//        name: "Moritz",
//        base64Avatar: "assets/icons/smiley-640.jpg",
//        userId: 1
//      } );
//    mycontacts.forEach( contact => this.localdbService.storeContact( contact ).then( ( result ) => console.log( result ) ) );
//    this.localdbService.loadContacts().then( result => {
//        result.each( contact => {
//          if(contact.userId === this.myUser.id) { 
//            this.ownContact = contact;
//          } else {
//            this.contacts.push( contact );
//          }
//      });      
//    } );
//    const myMessages: Message[] = [];
//    myMessages.push( {
//      fromId: 1,
//      toId: 2,
//      timestamp: new Date().getTime(),
//      text: "Hello1",
//      send: true,
//      received: true
//    },
//      {
//        fromId: 2,
//        toId: 1,
//        timestamp: new Date().getTime(),
//        text: "Hello2",
//        send: true,
//        received: true
//      } );
//    myMessages.forEach(msg => this.localdbService.storeMessage(msg).then(result => console.log(result)));    
  }

  @HostListener( 'window:resize', ['$event'] )
  onResize( event: any ) {
    this.windowHeight = event.target.innerHeight - 20;
  }
  
  openLoginDialog(): void {
    let dialogRef = this.dialog.open(LoginComponent, {
      width: '500px',
      data: { myUser: this.myUser}
    });
  
    dialogRef.afterClosed().subscribe(result => {        
      this.myUser = typeof result === 'undefined' || result === null ? null : result;
      if(this.myUser !== null) {
          this.ownContact = {
              name: this.myUser.username,
              base64Avatar: this.myUser.base64Avatar,
              base64PublicKey: this.myUser.publicKey,
              userId: this.myUser.userId
          };
      }
    });
  }
  
  logout(): void {
    this.myUser = null;
    this.jwttokenService.jwtToken = null;
  }
  
  selectContact( contact: Contact ) {
    this.myContact = contact;
    this.addMessages();
  }

  sendMessage(msg: Message) {    
    msg.fromId = this.ownContact.userId;
    this.localdbService.storeMessage(msg).then(result => {
        this.addMessages();
        this.syncMsgs();
    });    
    
  }
  
  private syncMsgs() {
      if(this.netConnectionService.connetionStatus) {
          const contactIds = this.contacts.map(con => con.userId);
          const syncMsgs1: SyncMsgs = {
               ownId: this.ownContact.userId,
               contactIds: contactIds,
               lastUpdate: this.getLastSyncDate()
          }; 
          this.messageService.findMessages(syncMsgs1).subscribe(msgs => {
              this.messages.concat(msgs);
              msgs.forEach(msg => this.localdbService.storeMessage(msg).then());              
          });          
          this.localdbService.toSyncMessages(this.ownContact).then(msgs => {
              const syncMsgs2: SyncMsgs = {
                      ownId: this.ownContact.userId,
                      msgs: msgs          
              };
              this.messageService.sendMessages(syncMsgs2).subscribe(myMsgs => 
                  myMsgs.forEach(msg => this.localdbService.updateMessage(msg).then()
              ));
          });
          
      }
  }
  
  private getLastSyncDate(): Date {
      const sortedMsg = this.messages
      .filter(i => !(typeof i.timestamp === "undefined") && !(i.timestamp === null)) 
      .sort((i1, i2) => i1.timestamp.getTime() - i2.timestamp.getTime());
      return sortedMsg[sortedMsg.length -1].timestamp;      
  }
  
  private addMessages() {
    while ( this.messages.length > 0 ) {
      this.messages.pop()
    }    
    this.localdbService.loadMessages(this.myContact).then(msgs => this.messages.concat(msgs));
  }
  
  addNewContact(contact: Contact) {      
      this.contacts.push(contact);
  }
}
