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
import { Tuple } from '../common/tuple';

export class LocalCrypto {
//  static generateKey(password: string, salt: string): PromiseLike<Tuple<string,string>> {
//    const saltBuffer = salt === null ? window.crypto.getRandomValues(new Uint8Array(8)) : this.toByteArray(salt);  
//    const encoder = new TextEncoder();
//    const passphraseKey = encoder.encode(password);
//    return window.crypto.subtle.importKey(
//        'raw', 
//        passphraseKey, 
//        'PBKDF2', 
//        false, 
//        ['deriveBits', 'deriveKey']
//      ).then((key) => {
//        return window.crypto.subtle.deriveKey(
//            { "name": 'PBKDF2',
//              "salt": saltBuffer,
//              "iterations": 128,
//              "hash": 'SHA-256'
//            },
//            key,
//            { "name": 'AES-CBC', "length": 256 },
//            true,
//            [ "encrypt", "decrypt" ]
//          )
//        }).then((webKey) => {
//          return crypto.subtle.exportKey("raw", webKey);
//        }).then((buffer) => {
//          return new Tuple(this.toHexString(buffer), this.toHexString(saltBuffer));
//      });    
//  }
//  
//  private static toHexString(byteArray: Uint8Array | ArrayBuffer): string {
//    if(byteArray.constructor === ArrayBuffer) {
//      byteArray = new Uint8Array(byteArray);
//    }
//    return Array.prototype.map.call(byteArray, (byte) => {
//      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
//    }).join('');
//  }
//  
//  private static toByteArray(hexString: string): Uint8Array {
//    return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
//  }
}