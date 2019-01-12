import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import { MyUser } from '../model/myUser';
import { FormGroup, FormControl, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { MainComponent } from '../main/main.component';
import { AuthenticationService } from '../services/authentication.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  signinForm: FormGroup;
  loginForm: FormGroup;
  private user = new MyUser();
  loginFailed = false;
  signinFailed = false;
  pwMatching = true;
  
  constructor(public dialogRef: MatDialogRef<MainComponent>,
          @Inject(MAT_DIALOG_DATA) public data: any, private authenticationService: AuthenticationService, fb: FormBuilder) { 
      this.signinForm = fb.group({
          username: ['', Validators.required],
          password: ['', Validators.required],
          password2: ['', Validators.required],
          email: ['', Validators.required]
      },{
          validator: this.validate.bind(this)
      });
      this.loginForm = fb.group({
          username: ['', Validators.required],
          password: ['', Validators.required]          
      });
  }

  ngOnInit() {
      
  }

  validate(group: FormGroup) {
      if(group.get('password').touched || group.get('password2').touched) {
          this.pwMatching = group.get('password').value === group.get('password2').value && group.get('password').value !== '';
          if(!this.pwMatching) {
              group.get('password').setErrors({MatchPassword: true});
              group.get('password2').setErrors({MatchPassword: true});
          } else {
              group.get('password').setErrors(null);
              group.get('password2').setErrors(null);
          }
      }
      return this.pwMatching;
  }
  
  onSigninClick(): void {
      let myUser = new MyUser();
      myUser.username = this.signinForm.get('username').value;
      myUser.password = this.signinForm.get('password').value;
      myUser.email = this.signinForm.get('email').value;
//      console.log(this.signinForm);
//      console.log(myUser);
      this.authenticationService.postSignin(myUser).subscribe(us => this.signin(us),err => console.log(err));
  }
  
  onLoginClick(): void {
      let myUser = new MyUser();
      myUser.username = this.loginForm.get('username').value;
      myUser.password = this.loginForm.get('password').value;
//      console.log(myUser);
      this.authenticationService.postLogin(myUser).subscribe(us => this.login(us),err => console.log(err));
  }
  
  signin(us: MyUser):void {
      this.user = us;   
      this.data.hash = null;
      if(this.user.username !== null) {
          this.signinFailed = false;
          this.dialogRef.close();
      } else {
          this.signinFailed = true;
      }      
  }
  
  login(us: MyUser):void {
      this.user = us;
      if(this.user.username !== null) {
          this.loginFailed = false;                              
          this.dialogRef.close(this.data.hash);          
      } else {
          this.loginFailed = true;
      }      
  }
  
  onCancelClick(): void {
      this.dialogRef.close();
  }
}