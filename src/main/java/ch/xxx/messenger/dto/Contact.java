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
package ch.xxx.messenger.dto;

public class Contact {
	private String name;
	private String base64Avatar;	
	private String base64PublicKey;

	public Contact(String name, String base64Avatar, String publicKey) {
		super();
		this.name = name;
		this.base64Avatar = base64Avatar;
		this.base64PublicKey = publicKey;
	}
	public String getName() {
		return name;
	}
	public String getBase64Avatar() {
		return base64Avatar;
	}
	public String getBase64PublicKey() {
		return base64PublicKey;
	}
	  
}
