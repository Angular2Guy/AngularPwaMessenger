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

interface AesGcmParams extends Algorithm {
  additionalData?: Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array | DataView | ArrayBuffer | null;
  iv: Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array | DataView | ArrayBuffer | null;
  tagLength?: number;
}

@Injectable( {
  providedIn: 'root'
} )
export class CryptoService {

  constructor() { }  
  
  public generateKeys(password: string): PromiseLike<Tuple<JsonWebKey, ArrayBuffer>> {
    return window.crypto.subtle.generateKey({
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    }, true, ["encrypt", "decrypt"]).then((value) => this.createKeyTuple(password, value));
  }
  
  private createKeyTuple(password: string, cryptoKeyPair: CryptoKeyPair): PromiseLike<Tuple<JsonWebKey, ArrayBuffer>> {    
    let jwkPubKey: JsonWebKey = null;    
    return window.crypto.subtle.exportKey("jwk", cryptoKeyPair.publicKey).then(value => {
      jwkPubKey = value;
      const enc = new TextEncoder();
      return window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
      ).then(value => {        
        const salt = window.crypto.getRandomValues(new Uint8Array(16));   
        return window.crypto.subtle.deriveKey(
            {
              "name": "PBKDF2",
              salt: salt,
              "iterations": 100000,
              "hash": "SHA-256"
            }, 
            value,
            { "name": "AES-GCM", "length": 256},
            true, 
            [ "wrapKey", "unwrapKey" ]
          ).then(value => {
//            console.log(value);
//            console.log(cryptoKeyPair.privateKey);
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const algo:AesGcmParams = {name: "AES-GCM",iv: iv}; 
            return window.crypto.subtle.wrapKey("jwk",cryptoKeyPair.privateKey, value, algo);
          })
          .then(value => {
            console.log(value);
            return new Tuple(jwkPubKey, value);
          });
      });            
    });
  }
  
  private convertArrayBufferViewtoString( buffer: Uint8Array ) {
    let str = "";
    for ( let iii = 0; iii < buffer.byteLength; iii++ ) {
      str += String.fromCharCode( buffer[iii] );
    }
    return str;
  }

  private convertStringToArrayBufferView( str: string ): Uint8Array {
    var bytes = new Uint8Array( str.length );
    for ( var iii = 0; iii < str.length; iii++ ) {
      bytes[iii] = str.charCodeAt( iii );
    }
    return bytes;
  }
}
