/**
 *    Copyright 2018 Sven Loesekann
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */
import { Injectable } from '@angular/core';
import { Tuple } from '../common/tuple';
import { PrivateKey } from '../model/privateKey';

@Injectable( {
  providedIn: 'root'
} )
export class CryptoService {

  constructor() { }

  public generateKeys( password: string ): PromiseLike<Tuple<string, string>> {
    return window.crypto.subtle.generateKey( {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array( [1, 0, 1] ),
      hash: "SHA-256",
    }, true, ["encrypt", "decrypt"] ).then( ( value ) => this.createKeyTuple( password, value ) );
  }

  private createKeyTuple( password: string, cryptoKeyPair: CryptoKeyPair ): PromiseLike<Tuple<string, string>> {
    let jwkPubKey: string = null;
    let wrapKey: CryptoKey = null;
    return window.crypto.subtle.exportKey( "jwk", cryptoKeyPair.publicKey ).then( value => {
      jwkPubKey = JSON.stringify( value );
      const mySalt = this.ab2str( window.crypto.getRandomValues( new Uint8Array( 16 ) ) );
      return this.createWrapKey( password, mySalt )
        .then( value => {
          wrapKey = value;
          const algo: AesGcmParams = { name: "AES-GCM", iv: this.str2ab( mySalt ) };
          return window.crypto.subtle.wrapKey( "jwk", cryptoKeyPair.privateKey, value, algo );
        } )
        .then( value => {        
          const privateKey: PrivateKey = { key: this.ab2str( value ), salt: mySalt };
          return new Tuple( jwkPubKey, JSON.stringify( privateKey ) );
        } );
    } );
  }

  private createWrapKey( password: string, salt: string ): PromiseLike<CryptoKey> {
    return window.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode( password ),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    )
      .then( value => {
        return window.crypto.subtle.deriveKey(
          {
            "name": "PBKDF2",
            salt: this.str2ab( salt ),
            "iterations": 100000,
            "hash": "SHA-256"
          },
          value,
          { "name": "AES-GCM", "length": 256 },
          true,
          ["wrapKey", "unwrapKey"]
        );
      } ).then( value => {
        //        window.crypto.subtle.exportKey( "jwk", value ).then( myValue => console.log( myValue ) );
        return value;
      } );
  }

  private ab2str( buf: ArrayBuffer | Uint8Array ): string {
    if ( buf.constructor === ArrayBuffer ) {
      buf = new Uint8Array( buf );
    }
    return btoa(String.fromCharCode.apply( null, new Uint8Array( buf ) ));
  }

  private str2ab( str: string ): ArrayBuffer {
    let decStr = atob(str);
    let buf = new ArrayBuffer( decStr.length );
    let bufView = new Uint8Array( buf );
    for ( let i = 0, strLen = decStr.length; i < strLen; i++ ) {
      bufView[i] = decStr.charCodeAt( i );
    }
    return buf;
  }

  public encryptText( msgText: string, keyStr: string ): PromiseLike<string> {
    const encMsg = new TextEncoder().encode( msgText );
    return window.crypto.subtle.importKey( 'jwk', JSON.parse( keyStr ), { name: "RSA-OAEP", hash: "SHA-256" }, false, ['encrypt'] )
      .then( value => window.crypto.subtle.encrypt( "RSA-OAEP", value, encMsg ) )
      .then( value => this.ab2str( value ) );
  }

  public decryptText( encText: string, keyStr: string, keyPwd: string ) {
    const keyJson: PrivateKey = JSON.parse( keyStr );
    const encKey = this.str2ab(keyJson.key );
    //    console.log(encText);
    return this.createWrapKey( keyPwd, keyJson.salt ).then( value => {
      const algo1: AesGcmParams = { name: "AES-GCM", iv: this.str2ab( keyJson.salt ) };
      const algo2: RsaHashedImportParams = { name: "RSA-OAEP", hash: "SHA-256" };
      return window.crypto.subtle.unwrapKey( 'jwk', encKey, value, algo1, algo2, false, ["decrypt"] );
    } ).then( value => {
      const algo2: RsaHashedImportParams = { name: "RSA-OAEP", hash: "SHA-256" };
      return window.crypto.subtle.decrypt( algo2, value, this.str2ab( encText ) );
    } )
      .then( value => new TextDecoder().decode( value ) );
  }

  public generateKey( password: string, salt: string ): PromiseLike<Tuple<string, string>> {
    const encoder = new TextEncoder();
    const saltBuffer = salt === null ? window.crypto.getRandomValues( new Uint8Array( 16 ) ) : this.str2ab( salt );    
    const passphraseKey = encoder.encode( password );
    return window.crypto.subtle.importKey(
      'raw',
      passphraseKey,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    ).then( ( key ) => {
      return window.crypto.subtle.deriveKey(
        {
          "name": 'PBKDF2',
          "salt": saltBuffer,
          "iterations": 100000,
          "hash": 'SHA-256'
        },
        key,
        { "name": 'AES-CBC', "length": 256 },
        true,
        ["encrypt", "decrypt"]
      )
    } ).then( ( webKey ) => {
      return crypto.subtle.exportKey( "raw", webKey );
    } ).then( ( buffer ) => {
      return new Tuple( this.ab2str( buffer ), this.ab2str(saltBuffer) );
    } );
  } 
   
  private keycreator(password: string, salt: string, text: string): PromiseLike<CryptoKey> {
    const saltBuffer = this.str2ab( salt );    
    const passphraseKey = new TextEncoder().encode( password );    
    return window.crypto.subtle.importKey(
      'raw',
      passphraseKey,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    ).then( ( key ) => {
      return window.crypto.subtle.deriveKey(
        {
          "name": 'PBKDF2',
          "salt": saltBuffer,
          "iterations": 100000,
          "hash": 'SHA-256'
        },
        key,
        { "name": 'AES-CBC', "length": 256 },
        true,
        ["encrypt", "decrypt"]
      )
    } );
  }
  
  public encryptTextAes(password: string, salt: string, text: string): PromiseLike<string> {
    const saltBuffer = this.str2ab( salt );
    return this.keycreator(password, salt, text).then(  webKey  => {
      return window.crypto.subtle.encrypt({ name: 'AES-CBC', iv: saltBuffer }, webKey, new TextEncoder().encode(text))
        .then(result => this.ab2str(result));
    });
  }
  
  public decryptTextAes(password: string, salt: string, text: string): PromiseLike<string> {
    const saltBuffer = this.str2ab( salt );    
    return this.keycreator(password, salt, text).then(  webKey  => {
      return window.crypto.subtle.decrypt({ "name": 'AES-CBC', iv: saltBuffer }, webKey, this.str2ab(text))
        .then(result => new TextDecoder().decode(result));      
    });
  }
  
  public hashPW(password: string): PromiseLike<string> {
    return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(password)).then(value => this.ab2str(value));
  }
}
