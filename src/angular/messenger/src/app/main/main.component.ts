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
import { Component, OnInit, HostListener, OnDestroy, Inject } from '@angular/core';
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
import { CryptoService } from '../services/crypto.service';
import { Subscription } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { CameraComponent } from '../camera/camera.component';


@Component( {
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
} )
export class MainComponent implements OnInit, OnDestroy {
  windowHeight: number;
  ownContact: Contact;
  contacts: Contact[] = [];
  selectedContact: Contact;
  messages: Message[] = [];
  myUser: MyUser = null;
  private interval: any;
  private conMonSub: Subscription;

  constructor( private localdbService: LocaldbService,
    private jwttokenService: JwttokenService,
    private netConnectionService: NetConnectionService,
    private messageService: MessageService,
    public dialog: MatDialog,
    private cryptoService: CryptoService,
    @Inject( DOCUMENT ) private document ) { }

  ngOnInit() {
    this.windowHeight = window.innerHeight - 84;
    this.conMonSub = this.netConnectionService.connectionMonitor.subscribe( online => this.onlineAgain( online ) );
  }

  ngOnDestroy(): void {
    if ( this.interval ) {
      clearInterval( this.interval );
    }
    this.conMonSub.unsubscribe();
  }

  @HostListener( 'window:resize', ['$event'] )
  onResize( event: any ) {
    this.windowHeight = event.target.innerHeight - 84;
  }

  private onlineAgain( online: boolean ) {
    if ( online && this.jwttokenService.getExpiryDate().getTime() < new Date().getTime() ) {
      alert( this.document.getElementById( 'onlineAgainMsg' ).textContent );
    }
  }

  openCameraDialog(): void {
    let dialogRef = this.dialog.open( CameraComponent, {
      width: '500px',
      data: { receiver: this.selectedContact }
    } );
    dialogRef.afterClosed().subscribe( result => {
      console.log( result );
      this.sendMessage(result);
    } );
  }

  openLoginDialog(): void {
    let dialogRef = this.dialog.open( LoginComponent, {
      width: '500px',
      data: { myUser: this.myUser }
    } );

    dialogRef.afterClosed().subscribe( result => {
      this.myUser = typeof result === 'undefined' || result === null ? null : result;
      if ( this.myUser !== null ) {
        this.ownContact = {
          name: this.myUser.username,
          base64Avatar: this.myUser.base64Avatar,
          publicKey: this.myUser.publicKey,
          userId: this.myUser.userId
        };
        this.contacts = [];
        this.selectedContact = null;
        this.localdbService.loadContacts( this.ownContact ).then( values => {
          this.contacts = values;
          this.selectedContact = values && values.length > 0 ? values[0] : null;
        } ).then( () => this.addMessages() ).then( () => {
          if ( this.interval ) {
            clearInterval( this.interval );
          }
          this.interval = setInterval( () => this.syncMsgs(), 15000 );
        } );
      }
    } );
  }

  logout(): void {
    this.myUser = null;
    this.ownContact = null;
    this.jwttokenService.jwtToken = null;
    this.contacts = [];
    this.messages = [];
    if ( this.interval ) {
      clearInterval( this.interval );
    }
  }

  selectContact( contact: Contact ) {
    this.selectedContact = contact;
    this.addMessages().then( () => this.syncMsgs() );
  }

  sendMessage( msg: Message ) {
    msg.fromId = this.ownContact.userId;
    this.cryptoService.encryptTextAes( this.myUser.password, this.myUser.salt, msg.text ).then( value => {
      msg.text = value;
      return msg;
    } ).then( myMsg => this.localdbService.storeMessage( myMsg ) )
      .then( () => this.addMessages().then( () => this.syncMsgs() ) );

  }

  private receiveRemoteMsgs( syncMsgs1: SyncMsgs ) {
    this.messageService.findMessages( syncMsgs1 ).subscribe( msgs => {
      let promises: PromiseLike<Message>[] = [];
      msgs = msgs.filter( msg => syncMsgs1.lastUpdate.getTime() < new Date( msg.timestamp ).getTime() );
      msgs.forEach( msg => {
        promises.push( (msg.text.indexOf(',') > 0 ? this.cryptoService.decryptLargeText(msg.text, this.myUser.privateKey, this.myUser.password) : this.cryptoService.decryptText( msg.text, this.myUser.privateKey, this.myUser.password )).then( value => {
          msg.text = value;
          return msg;
        } ) );
      } );
      Promise.all( promises ).then( myMsgs => {
        let promises2: PromiseLike<Promise<number>>[] = [];
        myMsgs.forEach( msg => {
          promises2.push(
            this.cryptoService.encryptTextAes( this.myUser.password, this.myUser.salt, msg.text )
              .then( value => {
                msg.text = value;
                return msg;
              } ).then( myValue => this.localdbService.storeMessage( msg ) ) );
        } );

        Promise.all( promises2 ).then( values => Promise.all( values ).then( myValue => {
          if ( promises.length > 0 ) {
            this.addMessages();
          }
        } ) );
      } )
    }, error => console.log( 'findMessages failed.' ) );
  }

  private sendRemoteMsgs( syncMsgs1: SyncMsgs ) {
    this.localdbService.toSyncMessages( this.ownContact ).then( msgs => {
      const oriMsgs: Message[] = JSON.parse( JSON.stringify( msgs ) );
      this.decryptLocalMsgs( msgs ).then( value => {
        const promises: PromiseLike<Message>[] = [];
        value.forEach( msg => {
          const fromCon = !this.contacts.filter( con => con.userId = msg.toId ) ? null : this.contacts.filter( con => con.userId = msg.toId )[0];
          if ( !fromCon ) {
            console.log( fromCon );
          } else {
            promises.push( (msg.text.length > 400 ? this.cryptoService.encryptLargeText(msg.text, fromCon.publicKey) : this.cryptoService.encryptText( msg.text, fromCon.publicKey )).then( result => {
              msg.text = result;
              return msg;
            } ) );
          }
        } );
        Promise.all( promises ).then( myMsgs => {
          const syncMsgs2: SyncMsgs = {
            ownId: this.ownContact.userId,
            msgs: myMsgs
          };
          this.messageService.sendMessages( syncMsgs2 ).subscribe( myMsgs => {
            const promises2: PromiseLike<number>[] = [];
            msgs.forEach( msg => {
              const newMsg = oriMsgs.filter( oriMsg => oriMsg.id === msg.id )[0];
              const myMsg = myMsgs.filter( myMsg2 => myMsg2.id === msg.id )[0];
              newMsg.send = true;
              newMsg.timestamp = myMsg.timestamp;
              promises2.push( this.localdbService.updateMessage( newMsg ) );//.then(result => console.log(msg), reject => console.log(reject));
            } );
            Promise.all( promises2 ).then( () => this.addMessages() );
          }, error => console.log( 'sendRemoteMsgs failed.' ) );
        } )
      } );
    } );
  }

  private storeReceivedMessages() {
    this.messageService.findReceivedMessages( this.ownContact ).subscribe( msgs => {
      if ( msgs.length > 0 ) {
        this.localdbService.loadMessages( this.ownContact ).then( localMsgs => {
          const msgsToStore: Message[] = [];
          msgs.forEach( msg => msgsToStore.push( localMsgs.filter( localMsg => localMsg.timestamp === msg.timestamp )[0] ) );
          msgsToStore.forEach( msg => msg.received = true );
          return msgsToStore;
        } ).then( msgsToStore => {
          const promises: PromiseLike<number>[] = [];
          msgsToStore.forEach( msgToStore =>
            promises.push( this.localdbService.updateMessage( msgToStore ) ) );
          return Promise.all( promises );
        } ).then( () => this.addMessages() );
      }
    }, error => console.log( 'storeReceivedMessages failed.' ) );
  }

  private syncMsgs() {
    if ( this.ownContact && this.netConnectionService.connetionStatus && !this.jwttokenService.localLogin ) {
      const contactIds = this.contacts.map( con => con.userId );
      const syncMsgs1: SyncMsgs = {
        ownId: this.ownContact.userId,
        contactIds: contactIds,
        lastUpdate: this.getLastSyncDate()
      };
      this.receiveRemoteMsgs( syncMsgs1 );
      this.sendRemoteMsgs( syncMsgs1 );
      this.storeReceivedMessages();
    }
  }

  private decryptLocalMsgs( msgs: Message[] ): PromiseLike<Message[]> {
    const promises: PromiseLike<Message>[] = [];
    msgs.forEach( msg => {
      promises.push( this.cryptoService.decryptTextAes( this.myUser.password, this.myUser.salt, msg.text ).then( value => {
        msg.text = value;
        return msg;
      } ) );
    } );
    return Promise.all( promises ).then( msgs => {
      return msgs;
    } );
  }

  private getLastSyncDate(): Date {
    const sortedMsg = this.messages
      .filter( i => !( typeof i.timestamp === "undefined" ) && !( i.timestamp === null ) )
      .sort( ( i1, i2 ) => new Date( i1.timestamp ).getTime() - new Date( i2.timestamp ).getTime() );
    return sortedMsg.length === 0 ? new Date( '2000-01-01' ) : new Date( sortedMsg[sortedMsg.length - 1].timestamp );
  }

  private addMessages(): Promise<Message[]> {
    return this.localdbService.loadMessages( this.selectedContact ).then( msgs =>
      this.decryptLocalMsgs( msgs ).then( values => {
        while ( this.messages.length > 0 ) {
          this.messages.pop()
        }
        this.messages = values;
        return values;
      } ) );
  }

  addNewContact( contact: Contact ) {
    this.contacts.push( contact );
  }  
}
