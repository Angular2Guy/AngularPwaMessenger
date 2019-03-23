import { Injectable } from '@angular/core';
import { Tuple } from '../common/tuple';

@Injectable( {
  providedIn: 'root'
} )
export class CryptoService {

  constructor() { }

  public generateKeys(password: string) {
    return window.crypto.subtle.generateKey({
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    }, true, ["encrypt", "decrypt"]).then((value) => this.createKeyTuple(password, value));
  }
  
  private createKeyTuple(password: string, cryptoKeyPair: CryptoKeyPair): PromiseLike<Tuple<JsonWebKey, ArrayBuffer>> {    
    let jwkPubKey: JsonWebKey = null;
    const salt = window.crypto.getRandomValues(new Uint8Array(16));   
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
        return window.crypto.subtle.deriveKey(
            {
              "name": "PBKDF2",
              salt: salt,
              "iterations": 100000,
              "hash": "SHA-256"
            },
            value,
            { "name": "AES-KW", "length": 256},
            true,
            [ "wrapKey", "unwrapKey" ]
          ).then(value => window.crypto.subtle.wrapKey("jwk",cryptoKeyPair.privateKey, value, "AES-KW"))
          .then(value => new Tuple(jwkPubKey, value));
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
