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
import { JwtToken } from '../model/jwt-token';

@Injectable( {
  providedIn: 'root'
} )
export class JwtTokenService {
  private localJwtToken: string = null;

  constructor() { }

  get jwtToken(): string {
    return this.localJwtToken === null ? '' : this.localJwtToken;
  }

  set jwtToken( token: string ) {
    this.localJwtToken = !token ? null : token;
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  get localLogin(): boolean {
    return this.localJwtToken ? false : true;
  }

  getExpiryDate(): Date {
    if(!this.localLogin) {
      const jwtToken = this.urlBase64Decode(this.localJwtToken);
      return new Date(jwtToken.exp*1000);
    } else {
      return new Date( '2000-01-01' );
    }
  }

  private urlBase64Decode( str: string ): JwtToken {
    let output = str.replace( /-/g, '+' ).replace( /_/g, '/' );
    if(output) {
      if((output.length % 4) === 1) {
        throw new Error('Invalid Token');
      }
      output += new Array(5-output.length % 4).join('=');
    }
    const outputArr = output.split('.');
    return JSON.parse(atob( outputArr[1] )) as JwtToken;
  }
}
