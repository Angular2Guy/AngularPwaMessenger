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
import { PrivateKey } from '../model/private-key';

@Injectable( {
  providedIn: 'root'
} )
export class CryptoService {

  constructor() { }

  public async generateKeys( password: string ): Promise<Tuple<string, string>> {
    const value = await window.crypto.subtle.generateKey({
          name: 'RSA-OAEP',
          modulusLength: 4096,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
      }, true, ['encrypt', 'decrypt']);
      return await this.createKeyTuple(password, value);
  }

  public async encryptLargeText( msgText: string, keyStr: string ): Promise<string> {
    const chunks = this.chunkSubstr(msgText, 350);
    const blocks = chunks.map(chunk => this.encryptText(chunk, keyStr));
    const myChunks = await Promise.all(blocks);
      return myChunks.join(',');
  }

  public async decryptLargeText( msgText: string, keyStr: string, keyPwd: string): Promise<string> {
    const chunks = msgText.split(',');
    const blocks = chunks.map(chunk => this.decryptText(chunk, keyStr, keyPwd));
    const myChunks = await Promise.all(blocks);
      return myChunks.join('');
  }

  public async encryptText( msgText: string, keyStr: string ): Promise<string> {
    const encMsg = new TextEncoder().encode( msgText );
    const value = await window.crypto.subtle.importKey('jwk', JSON.parse(keyStr), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
      const value_1 = await window.crypto.subtle.encrypt('RSA-OAEP', value, encMsg);
      return this.ab2str(value_1);
  }

  public decryptText( encText: string, keyStr: string, keyPwd: string ): PromiseLike<string>  {
    const keyJson: PrivateKey = JSON.parse( keyStr );
    const encKey = this.str2ab(keyJson.key );
    //    console.log(encText);
    const result = Promise.all([this.createWrapKey( keyPwd, keyJson.salt ).then( value => {
      const algo1: AesGcmParams = { name: 'AES-GCM', iv: this.str2ab( keyJson.salt ) };
      const algo2: RsaHashedImportParams = { name: 'RSA-OAEP', hash: 'SHA-256' };
	  return window.crypto.subtle.unwrapKey( 'jwk', encKey, value, algo1, algo2, false, ['decrypt'] );})
	.then( myValue => {
      const algo2: RsaHashedImportParams = { name: 'RSA-OAEP', hash: 'SHA-256' };
      return Promise.all([myValue]).then(myValue2 => window.crypto.subtle.decrypt( algo2, myValue2[0], this.str2ab( encText ) ));
    } ).then(value2 => Promise.all([value2]).then(value3 => new TextDecoder().decode( value3[0] )))]).then(myResult => myResult[0]);
	return result;
  }

  public async generateKey( password: string, salt: string ): Promise<Tuple<string, string>> {
    const encoder = new TextEncoder();
    const saltBuffer = salt === null ? window.crypto.getRandomValues( new Uint8Array( 16 ) ) : this.str2ab( salt );
    const passphraseKey = encoder.encode( password );
    const key = await window.crypto.subtle.importKey(
          'raw',
          passphraseKey,
          'PBKDF2',
          false,
          ['deriveBits', 'deriveKey']
      );
      const webKey = await window.crypto.subtle.deriveKey(
          {
              name: 'PBKDF2',
              salt: saltBuffer,
              iterations: 100000,
              hash: 'SHA-256'
          },
          key,
          { name: 'AES-CBC', length: 256 },
          true,
          ['encrypt', 'decrypt']
      );
      const buffer = await crypto.subtle.exportKey('raw', webKey);
      return new Tuple(this.ab2str(buffer), this.ab2str(saltBuffer as Uint8Array));
  }

  public async encryptTextAes(password: string, salt: string, text: string): Promise<string> {
    const saltBuffer = this.str2ab( salt );
    const result2 = await Promise.all([this.keycreator(password, salt, text).then(webKey => Promise.all([webKey])
          .then(webKey2 => window.crypto.subtle.encrypt({ name: 'AES-CBC', iv: saltBuffer }, webKey2[0], new TextEncoder().encode(text)))
          .then(result => Promise.all([result]).then(myResult => this.ab2str(myResult[0]))))]);
      return result2[0];
  }

  public async decryptTextAes(password: string, salt: string, text: string): Promise<string> {
    const saltBuffer = this.str2ab( salt );
    const result3 = await Promise.all([this.keycreator(password, salt, text).then(webKey => Promise.all([webKey])
          .then(webKey2 => window.crypto.subtle.decrypt({ name: 'AES-CBC', iv: saltBuffer }, webKey2[0], this.str2ab(text)))
          .then(result => Promise.all([result]).then(result2 => new TextDecoder().decode(result2[0]))))]);
      return result3[0];
  }

  public async hashPW(password: string): Promise<string> {
    const value = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
      return this.ab2str(value);
  }

  public async hashServerPW(password: string): Promise<string> {
    const value = await window.crypto.subtle.digest('SHA-384', new TextEncoder().encode(password));
      return this.ab2str(value);
  }

  public createSecurePassword(): string {
	return this.ab2str(window.crypto.getRandomValues( new Uint8Array( 32 ) ) as Uint8Array)
		.replace('=','').replace(/[^a-z0-9]/gi,'');
  }

  private async keycreator(password: string, salt: string, text: string): Promise<CryptoKey> {
    const saltBuffer = this.str2ab( salt );
    const passphraseKey = new TextEncoder().encode( password );
    const key = await window.crypto.subtle.importKey(
          'raw',
          passphraseKey,
          'PBKDF2',
          false,
          ['deriveBits', 'deriveKey']
      );
      return await window.crypto.subtle.deriveKey(
          {
              name: 'PBKDF2',
              salt: saltBuffer,
              iterations: 100000,
              hash: 'SHA-256'
          },
          key,
          { name: 'AES-CBC', length: 256 },
          true,
          ['encrypt', 'decrypt']
      );
  }
  private async createKeyTuple( password: string, cryptoKeyPair: CryptoKeyPair ): Promise<Tuple<string, string>> {
    let jwkPubKey: string = null;
    const mySalt = this.ab2str( window.crypto.getRandomValues( new Uint8Array( 16 ) ) as Uint8Array );
    const value = await window.crypto.subtle.exportKey('jwk', cryptoKeyPair.publicKey);
      jwkPubKey = JSON.stringify(value);
      const value_2 = await this.createWrapKey(password, mySalt);
      const algo: AesGcmParams = { name: 'AES-GCM', iv: this.str2ab(mySalt) };
      const myValue = await window.crypto.subtle.wrapKey('jwk', cryptoKeyPair.privateKey, value_2, algo);
      const privateKey: PrivateKey = { key: this.ab2str(myValue), salt: mySalt };
      return new Tuple(jwkPubKey, JSON.stringify(privateKey));
  }

  private async createWrapKey( password: string, salt: string ): Promise<CryptoKey> {
    const value = await window.crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(password),
          'PBKDF2',
          false,
          ['deriveBits', 'deriveKey']
      );
      const value_1 = await window.crypto.subtle.deriveKey(
          {
              name: 'PBKDF2',
              salt: this.str2ab(salt),
              iterations: 100000,
              hash: 'SHA-256'
          },
          value,
          { name: 'AES-GCM', length: 256 },
          true,
          ['wrapKey', 'unwrapKey']
      );
      return value_1;
  }

  private ab2str( buf: ArrayBuffer | Uint8Array ): string {
    if ( buf.constructor === ArrayBuffer ) {
      buf = new Uint8Array( buf );
    }
    return btoa(String.fromCharCode.apply( null, new Uint8Array( buf ) ));
  }

  private str2ab( str: string ): ArrayBuffer {
    const decStr = atob(str);
    const buf = new ArrayBuffer( decStr.length );
    const bufView = new Uint8Array( buf );
    for ( let i = 0, strLen = decStr.length; i < strLen; i++ ) {
      bufView[i] = decStr.charCodeAt( i );
    }
    return buf;
  }

  private chunkSubstr(str: string, size: number): string[] {
    const numChunks = Math.ceil(str.length / size);
    const chunks = new Array(numChunks);

    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
      chunks[i] = str.substring(o, size);
    }

    return chunks;
  }
}
