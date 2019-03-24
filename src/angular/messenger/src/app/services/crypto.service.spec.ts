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
import { TestBed } from '@angular/core/testing';

import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let privateKey: string = null;
  let publicKey: string = null;
  const privateKeyPwd = 'hallo123';

  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CryptoService = TestBed.get(CryptoService);
    expect(service).toBeTruthy();
  });
  
  it('keys should be created', (done: DoneFn) => {
    const service: CryptoService = TestBed.get(CryptoService);
    service.generateKeys(privateKeyPwd).then(value => {
      expect(value.a).toBeDefined('value.a missing');
      expect(value.b).toBeDefined('value.b missing');
      privateKey = value.b;
      publicKey = value.a;
      done();
    });
  });
  
  it('encrypt text', (done: DoneFn) => {
    const service: CryptoService = TestBed.get(CryptoService);
    service.encryptText('testText', publicKey).then(value => {
      expect(value).toBeDefined('encryption failed');
      done();
    });    
  });
});
