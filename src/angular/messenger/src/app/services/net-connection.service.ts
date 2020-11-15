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
import { Observable } from 'rxjs';

@Injectable( {
  providedIn: 'root'
} )
export class NetConnectionService {
  private _connectionMonitor: Observable<boolean>;
  private _connectionStatus: boolean;

  constructor() {
    this._connectionStatus = navigator.onLine;
    this._connectionMonitor = new Observable( ( observer ) => {
      window.addEventListener( 'offline', ( e ) => {
        this._connectionStatus = false;
        observer.next( false );
      } );
      window.addEventListener( 'online', ( e ) => {
        this._connectionStatus = true;
        observer.next( true );
      } );
    } );
  }

  get connectionMonitor(): Observable<boolean> {
    return this._connectionMonitor;
  }

  get connetionStatus(): boolean {
    return this._connectionStatus;
  }
}
