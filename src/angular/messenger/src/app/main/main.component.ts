import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  windowHeight: number;
  constructor() { }

  ngOnInit() {
   this.windowHeight = window.innerHeight -20; 
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.windowHeight = event.target.innerHeight -20;
  }
  
}
