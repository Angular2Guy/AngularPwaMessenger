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
import { Injectable } from '@angular/core';
import { LocaldbService } from './localdb.service';
import { NetConnectionService } from './net-connection.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { JwttokenService } from './jwttoken.service';
import { Contact } from '../model/contact';
import { flatMap,tap, map, switchMap } from 'rxjs/operators';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private readonly contactUrl = '/rest/contact';
  constructor(private localdbService: LocaldbService,           
          private http: HttpClient, 
          private netConService: NetConnectionService,
          private jwttokenService: JwttokenService) { }
  
  syncContactDb() {
      const myReqOptionsArgs = this.createHeader();
      this.http.get<Contact[]>(this.contactUrl+'/mycontacts', myReqOptionsArgs)
          .pipe(flatMap(con => con))
          .subscribe(myCon => this.localdbService.storeContact(myCon).then(result => console.log('Contact updated: '+myCon.name)));
  }
  
  syncContactsToServer() {
      from(this.localdbService.loadContactsToSync()).pipe(
              flatMap(con => con),
              tap(myCon => this.http.put(this.contactUrl+'/mycontact', myCon, this.createHeader()))
              ).subscribe(myCon1 => {
                  myCon1.sync = true;
                  this.localdbService.storeContact(myCon1).then(() => console.log('Contact synced to Server:'+myCon1.name));});
  }
  
  private createHeader() {
      return { headers: new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', this.jwttokenService.jwtToken)};
  }
  
  loadContacts(): Observable<Contact[]> {
     return from(this.localdbService.loadContacts());
  }
  
  saveContact(contact: Contact): Observable<number> {
      let result: Observable<number> = null;
      if(this.netConService.connetionStatus) {
          result = this.http.put<number>(this.contactUrl+'/mycontact', contact, this.createHeader()).pipe(
                  tap(() => from(this.localdbService.storeContact(contact))));
      } else {
          result = from(this.localdbService.storeContact(contact));
      }
      return result;
  }
  
  findContact(conName: string): Observable<Contact[]> {
      return this.http.get<Contact[]>(this.contactUrl+'/findcontacts');
  }
}
