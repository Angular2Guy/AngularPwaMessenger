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
import { AfterViewInit, Component, DestroyRef, OnInit, inject } from "@angular/core";
import { BingoService } from "src/app/services/games/bingo.service";
import { CommonModule } from "@angular/common";
import { GamesService } from "src/app/services/games/games.service";
import { map, repeat } from "rxjs/operators";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BingoGame } from "src/app/model/games/bingo-game";
import { MatButtonModule } from "@angular/material/button";
import { Subscription } from "rxjs";

export interface BingoCell {
  value: number;
  hit: boolean;
}

interface NewGame {
  bingoCells: BingoCell[];
  gameUuid: string;
  bingoHits: boolean[][];
}

@Component({
  standalone: true,
  selector: "app-bingo",
  templateUrl: "./bingo.component.html",
  styleUrls: ["./bingo.component.scss"],
  providers: [BingoService],
  imports: [CommonModule, MatButtonModule],
})
export class BingoComponent implements OnInit, AfterViewInit {
  protected bingoCells: BingoCell[] = [];
  protected bingoNumber: number;   
  protected gameUuid: string;  
  private randomNumberSub: Subscription = null;
  private readonly destroy: DestroyRef = inject(DestroyRef);
  private gameHits: boolean[][];

  constructor(
    protected gamesService: GamesService,
    private bingoService: BingoService
  ) {}

  ngOnInit(): void {
    this.bingoCells = [];
    /*
    for(let y = 0;y < 5;y++) {			
	  for(let x = 0;x < 5;x++) {
		this.bingoCells.push({value: null,hit: false} as BingoCell);
		this.bingoCells[y * 5 + x].hit = Math.random() > 0.5;
		this.bingoCells[y * 5 + x].value = y * 5 + x + 1;  
	  }
	} 
	*/
    //console.log(this.gamesService.myUser);    
  }

  ngAfterViewInit(): void {    
  }

  protected startGame(): void {	  
	this.bingoService
      .newGame([this.gamesService.myUser.userId])
      .pipe(map((myValue) => this.mapNewGame(myValue)), takeUntilDestroyed(this.destroy))
      .subscribe((result) => {
        this.bingoCells = result.bingoCells;
        this.gameUuid = result.gameUuid;
        this.gameHits = result.bingoHits;
        this.randomNumberSub = this.bingoService.updateGame(this.gameUuid).pipe(repeat({delay: 5000}), takeUntilDestroyed(this.destroy))
          .subscribe(result => this.updateValues(result));
      });        
  }
  
  protected stopGame(): void {
	  this?.randomNumberSub?.unsubscribe();
  }

  protected switchBingoCell(bingoCell: BingoCell): void {
	  bingoCell.hit = !bingoCell.hit;
  }

  private updateValues(bingoGame: BingoGame): void {
	  this.bingoNumber = bingoGame.randomValues.length > 0 ? bingoGame.randomValues[bingoGame.randomValues.length -1] : null;
	  this.gameHits = bingoGame.bingoBoards[this.getBoardIndex(bingoGame)].hits;
  }

  private getBoardIndex(bingoGame: BingoGame): number {
	 return bingoGame.playerUserIds.findIndex(
      (myValue1) => myValue1 === this.gamesService.myUser.userId
    ); 
  }

  private mapNewGame(bingoGame: BingoGame): NewGame {
    const myIndex = this.getBoardIndex(bingoGame);
    const myBingoCells: BingoCell[] = [];
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        myBingoCells.push({ value: null, hit: false } as BingoCell);
        myBingoCells[y * 5 + x].hit = bingoGame.bingoBoards[myIndex].hits[y][x];
        myBingoCells[y * 5 + x].value =
          bingoGame.bingoBoards[myIndex].board[y][x];
      }
    }
    return { gameUuid: bingoGame.uuid, bingoCells: myBingoCells, bingoHits: bingoGame.bingoBoards[myIndex].hits } as NewGame;
  }
}
