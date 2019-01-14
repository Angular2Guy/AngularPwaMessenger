import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable( {
  providedIn: 'root'
} )
export class NetConnectionService {
  private _connectionMonitor: Observable<boolean>;

  constructor() {
    this._connectionMonitor = new Observable( ( observer ) => {
      window.addEventListener( 'offline', ( e ) => {
        observer.next( false );
      } );
      window.addEventListener( 'online', ( e ) => {
        observer.next( true );
      } );
    } );
  }
  
  get connectionMonitor(): Observable<boolean> {
    return this._connectionMonitor;
  }
}
