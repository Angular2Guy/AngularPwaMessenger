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
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MainComponent } from '../main/main.component';
import { Contact } from '../model/contact';
import { Message } from '../model/message';

@Component({
	selector: 'app-fileupload',
	templateUrl: './fileupload.component.html',
	styleUrls: ['./fileupload.component.scss']
})
export class FileuploadComponent implements OnInit {
	currentFile: File;
	fileContent: string;
	showFileSizeMsg: boolean;
	private readonly MB: number = 1024 * 1024;

	constructor(public dialogRef: MatDialogRef<MainComponent>,
		@Inject(MAT_DIALOG_DATA) public data: any) { }

	ngOnInit() {
		this.showFileSizeMsg = false;
	}

	filechange(fileInput: any) {
		this.currentFile = fileInput.target.files[0];
		let reader = new FileReader();
		reader.onload = () => {
			let textstr: string = <string>reader.result;
			let textstrs = textstr.split(";");
			this.fileContent = textstrs[1];
			//console.log(textstrs[1]);
		};
		reader.readAsDataURL(this.currentFile);
	}

	upload() {
		if (this.fileContent && this.fileContent.length < 2 * this.MB) {
			let receiver = this.data.receiver as Contact;
			let msg: Message = {
				fromId: null,
				toId: receiver.userId,
				text: this.fileContent,
				filename: this.currentFile.name,
				send: false,
				received: false
			};
			this.dialogRef.close(msg);
		} else {
			this.showFileSizeMsg = true;
		}
	}

	cancel() {
		this.dialogRef.close(null);
	}
}
