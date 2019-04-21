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
import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { MyUser } from '../model/myUser';
import { FormGroup, FormControl, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { MainComponent } from '../main/main.component';
import { AuthenticationService } from '../services/authentication.service';
import { LocaldbService } from '../services/localdb.service';
import { LocalUser } from '../model/localUser';
import { JwttokenService } from '../services/jwttoken.service';
//import { LocalCrypto } from './localCrypto';
import { NetConnectionService } from '../services/net-connection.service';
import { CryptoService } from '../services/crypto.service';
import { Tuple } from '../common/tuple';


@Component( {
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
} )
export class LoginComponent implements OnInit {
  signinForm: FormGroup;
  loginForm: FormGroup;
  loginFailed = false;
  signinFailed = false;
  pwMatching = true;
  private connected = false;

  constructor( public dialogRef: MatDialogRef<MainComponent>,
    @Inject( MAT_DIALOG_DATA ) public data: any,
    private authenticationService: AuthenticationService,
    private localdbService: LocaldbService,
    private jwttokenService: JwttokenService,
    private netConnectionService: NetConnectionService,
    private cryptoService: CryptoService,
    fb: FormBuilder ) {
    this.signinForm = fb.group( {
      username: ['', Validators.required],
      password: ['', Validators.required],
      password2: ['', Validators.required],
      email: ['', Validators.required]
    }, {
        validator: this.validate.bind( this )
      } );
    this.loginForm = fb.group( {
      username: ['', Validators.required],
      password: ['', Validators.required]
    } );
  }

  ngOnInit() {
    this.connected = this.netConnectionService.connetionStatus;
    this.netConnectionService.connectionMonitor.subscribe( conn => this.connected = conn );
  }

  validate( group: FormGroup ) {
    if ( group.get( 'password' ).touched || group.get( 'password2' ).touched ) {
      this.pwMatching = group.get( 'password' ).value === group.get( 'password2' ).value && group.get( 'password' ).value !== '';
      if ( !this.pwMatching ) {
        group.get( 'password' ).setErrors( { MatchPassword: true } );
        group.get( 'password2' ).setErrors( { MatchPassword: true } );
      } else {
        group.get( 'password' ).setErrors( null );
        group.get( 'password2' ).setErrors( null );
      }
    }
    return this.pwMatching;
  }

  onSigninClick(): void {
    let myUser = new MyUser();
    myUser.username = this.signinForm.get( 'username' ).value;
    myUser.password = this.signinForm.get( 'password' ).value;
    myUser.email = this.signinForm.get( 'email' ).value;
    this.cryptoService.hashPW( this.signinForm.get( 'password' ).value ).then( value =>
      this.cryptoService.generateKeys( value ) ).then( result => {
        myUser.privateKey = result.b;
        myUser.publicKey = result.a;
      } ).then( () => this.cryptoService.hashServerPW( this.signinForm.get( 'password' ).value ) )
      .then( value => myUser.password = value)
      .then(() => this.cryptoService.generateKey( this.signinForm.get( 'password' ).value, null ))
      .then(myValue => {
        myUser.salt = myValue.b;
        this.authenticationService.postSignin( myUser ).subscribe( us => this.signin( us ), err => console.log( err ) );
      } );
  }

  onLoginClick(): void {
    let myUser = new MyUser();
    myUser.username = this.loginForm.get( 'username' ).value;
    myUser.password = this.loginForm.get( 'password' ).value;
    //      console.log(myUser);    
    if ( this.connected ) {
      this.cryptoService.hashServerPW( this.loginForm.get( 'password' ).value ).then( value => {
        myUser.password = value;
        this.authenticationService.postLogin( myUser ).subscribe( us => {
          let myLocalUser: LocalUser = {
            base64Avatar: null,
            createdAt: null,
            email: null,
            hash: null,
            publicKey: null,
            privateKey: null,
            salt: null,
            username: us.username,
            userId: null
          };
          this.localdbService.loadUser( myLocalUser )
            .then( localUserList => localUserList.toArray() )
            .then( localUserArray => {
              if ( localUserArray.length > 0 ) {
                us.password = this.loginForm.get( 'password' ).value;
                this.login( us, localUserArray[0] );
              } else {
                this.createLocalUser( us , this.loginForm.get( 'password' ).value).then( result => {
                  us.password = this.loginForm.get( 'password' ).value;
                  this.login( us, result );
                } );
              }
            } );
        }, err => {
          myUser.password = this.loginForm.get( 'password' ).value;
          this.localLogin( myUser ); 
          });
      } );
    } else {
      this.localLogin( myUser );
    }
  }

  private localLogin( myUser: MyUser ) {
    let myLocalUser: LocalUser = {
      base64Avatar: null,
      createdAt: null,
      email: null,
      hash: null,
      publicKey: null,
      privateKey: null,
      salt: null,
      username: myUser.username,
      userId: null
    };
    this.localdbService.loadUser( myLocalUser ).then( localUserList =>
      localUserList.first().then( myLocalUser => {
        myUser.userId = myLocalUser.userId;
        return this.login( myUser, myLocalUser ); 
        }) );
  }

  private createLocalUser( us: MyUser, passwd: string): PromiseLike<LocalUser> {
    let localUser: LocalUser = null;
    return this.cryptoService.generateKey( passwd, us.salt ? us.salt : null )
      .then( ( result ) => {
        localUser = {
          base64Avatar: us.base64Avatar,
          createdAt: us.createdAt,
          email: us.email,
          hash: result.a,
          salt: result.b,
          username: us.username,
          publicKey: us.publicKey,
          privateKey: us.privateKey,
          userId: us.userId
        };
        return localUser;
      } ).then( myLocalUser => this.localdbService.storeUser( myLocalUser ) )
      .then( value => Promise.resolve( value ) ).then( () => localUser );
  }

  signin( us: MyUser ): void {
    this.data.myUser = null;
    if ( us.username !== null ) {
      this.createLocalUser( us, this.signinForm.get( 'password' ).value ).then( value => {
        this.signinFailed = false;
        this.dialogRef.close();
      } );
    } else {
      this.signinFailed = true;
    }
  }

  login( us: MyUser, localUser: LocalUser ): void {
    this.cryptoService.generateKey( us.password, localUser.salt ).then( tuple => {
      if ( ( us.username !== null || localUser.username !== null ) && localUser.hash === tuple.a ) {
        if ( this.connected ) {
          this.jwttokenService.jwtToken = us.token;
        }        
        this.loginFailed = false;
        this.cryptoService.hashPW( us.password ).then( value => {
          us.password = value;
          us.salt = localUser.salt;
          this.data.myUser = us;
          this.dialogRef.close( this.data.myUser );
        } );
      } else {
        this.loginFailed = true;
      }
    } );
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }
}