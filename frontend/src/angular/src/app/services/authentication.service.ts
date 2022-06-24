/**    Copyright 2018 Sven Loesekann
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
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MyUser } from '../model/my-user';
import { AuthCheck } from '../model/auth-check';
import { Observable } from 'rxjs';
import { JwttokenService } from './jwttoken.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private reqOptionsArgs = { headers: new HttpHeaders().set( 'Content-Type', 'application/json' ) };
  private readonly authUrl = '/rest/auth';
  constructor(private http: HttpClient, private jwttokenService: JwttokenService) { }

  postLogin(user: MyUser): Observable<MyUser> {
    return this.http.post<MyUser>(this.authUrl+'/login', user, this.reqOptionsArgs);
  }

  postSignin(user: MyUser): Observable<MyUser> {
    return this.http.post<MyUser>(this.authUrl+'/signin', user, this.reqOptionsArgs);
  }

  postCheckAuthorisation(route: string): Observable<AuthCheck> {
    const authCheck = new AuthCheck();
    authCheck.route = route;
    const myReqOptionsArgs = { headers: new HttpHeaders()
                                        .set('Content-Type', 'application/json')
                                        .set('Authorization', this.jwttokenService.jwtToken)};
    return this.http.post<AuthCheck>(this.authUrl+'/authorize', authCheck, myReqOptionsArgs);
  }
}
