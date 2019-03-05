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
import { Utils } from '../services/utils.service';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private readonly contactUrl = '/rest/contact';
  constructor(private localdbService: LocaldbService,           
          private http: HttpClient, 
          private utils: Utils) { }
  
  loadContacts(): Observable<Contact[]> {
     return from(this.localdbService.loadContacts());
  }
  
  findContacts(conName: string): Observable<Contact[]> {
      const con: Contact = {
              name: conName, 
              base64Avatar: null,             
              base64PublicKey: null,
              userId: null};
      return this.http.post<Contact[]>(this.contactUrl+'/findcontacts', con, this.utils.createHeader());
  }
}
