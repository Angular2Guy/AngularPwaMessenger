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

  private createKeyTuple( password: string, cryptoKeyPair: CryptoKeyPair): PromiseLike<Tuple<string, string>> {
    let jwkPubKey: string = null;
    return window.crypto.subtle.exportKey( "jwk", cryptoKeyPair.publicKey ).then( value => {
      jwkPubKey = JSON.stringify( value );      
      const mySalt = new TextDecoder().decode(window.crypto.getRandomValues( new Uint8Array( 16 ) ));
      return this.createWrapKey( password, mySalt )
        .then( value => {
          const algo: AesGcmParams = { name: "AES-GCM", iv: new TextEncoder().encode(mySalt) };
          return window.crypto.subtle.wrapKey( "jwk", cryptoKeyPair.privateKey, value, algo );
        } )
        .then( value => {   
          const algo1: AesGcmParams = { name: "AES-GCM", iv: new TextEncoder().encode(mySalt) };
          const algo2: RsaHashedImportParams = { name: "RSA-OAEP", hash: "SHA-256" };
          window.crypto.subtle.unwrapKey("jwk", value, cryptoKeyPair.privateKey, algo1, algo2, true, ['decrypt'])
            .then(value => 
              console.log(value)
            );
          const privateKey: PrivateKey = {key: new TextDecoder().decode( value ), salt: mySalt};
          return new Tuple( jwkPubKey,  JSON.stringify(privateKey));
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
            salt: new TextEncoder().encode(salt),
            "iterations": 100000,
            "hash": "SHA-256"
          },
          value,
          { "name": "AES-GCM", "length": 256 },
          true,
          ["wrapKey", "unwrapKey"]
        );
      } ).then(value => {
        window.crypto.subtle.exportKey( "jwk",value).then(myValue => console.log(myValue));        
        return value;
      });
  }

  public encryptText( msgText: string, keyStr: string ): PromiseLike<string> {
    const encMsg = new TextEncoder().encode( msgText );
    return window.crypto.subtle.importKey( 'jwk', JSON.parse( keyStr ), { name: "RSA-OAEP", hash: "SHA-256" }, false, ['encrypt'] )
      .then( value => window.crypto.subtle.encrypt( "RSA-OAEP", value, encMsg ) )
      .then( value => new TextDecoder().decode( value ) );
  }

  public decryptText( encText: string, keyStr: string, keyPwd: string ) {
    const keyJson: PrivateKey = JSON.parse(keyStr);
    const encKey = new TextEncoder().encode( keyJson.key );
    return this.createWrapKey( keyPwd, keyJson.salt).then( value => {      
      const algo1: AesGcmParams = { name: "AES-GCM", iv: new TextEncoder().encode(keyJson.salt) };
      const algo2: RsaHashedImportParams = { name: "RSA-OAEP", hash: "SHA-256" };
      return window.crypto.subtle.unwrapKey( 'jwk', encKey, value, algo1, algo2, false, ["decrypt"] );
    } ).then(value => window.crypto.subtle.decrypt({name: "RSA-OAEP"}, value, encKey), reject => {
      console.log(reject);
      return reject;
    })
    .then(value => new TextDecoder().decode(value));
  }
}
