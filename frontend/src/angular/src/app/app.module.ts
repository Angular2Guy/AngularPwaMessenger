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
import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { MatSidenavModule } from "@angular/material/sidenav";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { MatTabsModule } from "@angular/material/tabs";
import { MatToolbarModule } from "@angular/material/toolbar";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { ServiceWorkerModule } from "@angular/service-worker";
import { environment } from "../environments/environment";
import { MainComponent } from "./main/main.component";
import { ContactsComponent } from "./contacts/contacts.component";
import { MessagesComponent } from "./messages/messages.component";
import { LoginComponent } from "./login/login.component";
import { AddContactsComponent } from "./add-contacts/add-contacts.component";
import { HttpProfileInterceptor } from "./services/http-profile.interceptor";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { CameraComponent } from "./camera/camera.component";
import { FileuploadComponent } from "./fileupload/fileupload.component";
import { TokenInterceptor } from "./services/token.interceptor";
import { VoiceComponent } from "./voice/voice.component";

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    ContactsComponent,
    MessagesComponent,
    LoginComponent,
    AddContactsComponent,
    CameraComponent,
    FileuploadComponent,
    VoiceComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule,
    MatSidenavModule,
    MatToolbarModule,
    MatTabsModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatListModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    ServiceWorkerModule.register("ngsw-worker.js", {
      enabled: environment.production,
    }),
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpProfileInterceptor,
      multi: true,
    },
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
