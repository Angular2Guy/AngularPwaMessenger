import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MyUser } from '../model/myUser';
import { AuthCheck } from '../model/authCheck';
import { Observable } from 'rxjs';
import { JwttokenService } from './jwttoken.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private reqOptionsArgs = { headers: new HttpHeaders().set( 'Content-Type', 'application/json' ) };
  private authUrl = '/rest/auth';
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
