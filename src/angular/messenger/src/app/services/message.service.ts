import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LocaldbService } from './localdb.service';
import { JwttokenService } from './jwttoken.service';
import { Contact } from '../model/contact';
import { Message } from '../model/message';
import { Observable } from 'rxjs';
import { Utils } from '../services/utils.service';
import { SyncMsgs } from '../model/syncMsgs';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private readonly contactUrl = '/rest/message';
  
  constructor(private localdbService: LocaldbService,           
          private http: HttpClient, 
          private utils: Utils) { }
  
  findMessages(syncMsgs: SyncMsgs): Observable<Message[]> {
      return this.http.post<Message[]>(this.contactUrl+'/findMsgs', syncMsgs, this.utils.createHeader());
  }
  
  sendMessages(syncMsgs: SyncMsgs): Observable<Message[]> {
      return this.http.post<Message[]>(this.contactUrl+'/storeMsgs', syncMsgs,this.utils.createHeader());
  }
  
  findReceivedMessages(contact: Contact): Observable<Message[]> {
    return this.http.post<Message[]>(this.contactUrl+'/receivedMsgs', contact,this.utils.createHeader());
  }
}
