import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JwttokenService {
  private _jwtToken: string = null;
  
  constructor() { }
  
  get jwtToken():string {
    return this._jwtToken === null ? '' : `Bearer ${this._jwtToken}`;
  }
  
  set jwtToken(token: string) {
    this._jwtToken = !token ? null : token;
  }
}
