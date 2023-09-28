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
import {
  AfterViewInit,
  Component,
  OnInit,
} from "@angular/core";
import { BingoService } from "src/app/services/games/bingo.service";
import { CommonModule } from "@angular/common";
import { GamesService } from "src/app/services/games/games.service";

export interface BingoCell{
	value: number;
	hit: boolean;
}

@Component({
  standalone: true,
  selector: "app-bingo",
  templateUrl: "./bingo.component.html",
  styleUrls: ["./bingo.component.scss"],
  providers: [BingoService],
  imports: [
    CommonModule    
  ],
})
export class BingoComponent implements OnInit, AfterViewInit {
  protected bingoCells: BingoCell[] = [];
  protected bingoNumber: number;
  
  constructor(protected gamesService: GamesService, private bingoService: BingoService) {}
  
  ngOnInit(): void {
	this.bingoCells = [];
    for(let y = 0;y < 5;y++) {			
	  for(let x = 0;x < 5;x++) {
		this.bingoCells.push({value: null,hit: false} as BingoCell);
		this.bingoCells[y * 5 + x].hit = Math.random() > 0.5;
		this.bingoCells[y * 5 + x].value = y * 5 + x + 1;  
	  }
	}    		
	//console.log(this.gamesService.myUser);
	this.bingoService.newGame([this.gamesService.myUser.userId]).subscribe(result => console.log(result));
  }

  ngAfterViewInit(): void {
    //super.ngAfterViewInit();
  }
      
}
