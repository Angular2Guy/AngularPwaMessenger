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
  DestroyRef,
  OnInit,
  inject,
} from "@angular/core";
import { BingoService } from "src/app/services/games/bingo.service";
import { CommonModule } from "@angular/common";
import { GamesService } from "src/app/services/games/games.service";
import { map, repeat } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BingoGame } from "src/app/model/games/bingo-game";
import { MatButtonModule } from "@angular/material/button";
import { Subscription } from "rxjs";

export interface BingoCell {
  value: number;
  hit: boolean;
  bingo: boolean;
}

interface NewGame {
  bingoCells: BingoCell[];
  gameUuid: string;
  bingoHits: boolean[][];
}

interface CheckForWinResult {
  win: boolean;
  xrow: number;
  yrow: number;
  plusdiag: boolean;
  minusdiag: boolean;
}

@Component({
  standalone: true,
  selector: "app-bingo",
  templateUrl: "./bingo.component.html",
  styleUrls: ["./bingo.component.scss"],
  providers: [BingoService],
  imports: [CommonModule, MatButtonModule],
})
export class BingoComponent implements OnInit {
  protected bingoCells: BingoCell[] = [];
  protected bingoNumber = 0;
  protected gameUuid: string;
  protected bingoResult = false;
  private randomNumberSub: Subscription = null;
  private readonly destroy: DestroyRef = inject(DestroyRef);
  private gameHits: boolean[][];
  private randomValues: number[] = [];

  constructor(
    protected gamesService: GamesService,
    private bingoService: BingoService
  ) {}

  ngOnInit(): void {
    this.bingoCells = [];
    //console.log(this.gamesService.myUser);
  }

  protected startGame(): void {
    this.stopGame();
    this.bingoService
      .newGame([this.gamesService.myUser.userId])
      .pipe(
        map((myValue) => this.mapNewGame(myValue)),
        takeUntilDestroyed(this.destroy)
      )
      .subscribe((result) => {
        this.bingoCells = result.bingoCells;
        this.gameUuid = result.gameUuid;
        this.gameHits = result.bingoHits;
        this.randomValues = [];
        this.randomNumberSub = this.bingoService
          .updateGame(this.gameUuid)
          .pipe(repeat({ delay: 5000 }), takeUntilDestroyed(this.destroy))
          .subscribe((result) => this.updateValues(result));
      });
  }

  protected stopGame(): void {
    this?.randomNumberSub?.unsubscribe();
    this.bingoNumber = 0;
    this.bingoResult = false;
    this.randomValues = [];
    const currentGameUuid = this.gameUuid;
    if (!!currentGameUuid) {
      this.bingoService
        .endGame(this.gameUuid)
        .pipe(takeUntilDestroyed(this.destroy))
        .subscribe((result) =>
          console.log(`Game ended: ${currentGameUuid}, result: ${result}`)
        );
    }
  }

  protected switchBingoCell(bingoCell: BingoCell): void {
    bingoCell.hit = this.randomValues.includes(bingoCell.value)
      ? !bingoCell.hit
      : false;
    //console.log(this.checkForWin());
    const checkForWin = this.checkForWin();
    if (checkForWin.win) {
      this.bingoService
        .checkWin(this.gameUuid, this.gamesService.myUser.userId)
        .pipe(takeUntilDestroyed(this.destroy))
        .subscribe((result) => {
          this.bingoResult = result;
          this.markBingo(checkForWin);
          this.randomNumberSub.unsubscribe();
        });
    }
  }

  private markBingo(checkForWin: CheckForWinResult): void {
    if (checkForWin.win) {
      for (let i = 0; i < 5; i++) {
        if (checkForWin.xrow >= 0) {
          this.bingoCells[checkForWin.xrow * 5 + i].bingo = true;
        } else if (checkForWin.yrow >= 0) {
          this.bingoCells[i * 5 + checkForWin.yrow].bingo = true;
        } else if (checkForWin.minusdiag) {
          this.bingoCells[i * 5 + 4 - i].bingo = true;
        } else if (checkForWin.plusdiag) {
          this.bingoCells[i * 5 + i].bingo = true;
        }
      }
    }
  }

  private checkForWin(): CheckForWinResult {
    let xrow = -1;
    let yrow = -1;
    let plusdiag = 0;
    let minusdiag = 0;
    for (let y = 0; y < 5; y++) {
      let xhits = 0;
      for (let x = 0; x < 5; x++) {
        xhits += this.bingoCells[y * 5 + x].hit && this.gameHits[y][x] ? 1 : 0;
      }
      if (xhits >= 5 || xrow >= 0) {
        xrow = xrow >= 0 ? xrow : y;
        continue;
      }
    }
    for (let y = 0; y < 5; y++) {
      let yhits = 0;
      for (let x = 0; x < 5; x++) {
        yhits += this.bingoCells[x * 5 + y].hit && this.gameHits[x][y] ? 1 : 0;
      }
      if (yhits >= 5 || yrow >= 0) {
        yrow = yrow >= 0 ? yrow : y;
        continue;
      }
    }
    for (let i = 0; i < 5; i++) {
      plusdiag += this.bingoCells[i * 5 + i].hit && this.gameHits[i][i] ? 1 : 0;
      minusdiag +=
        this.bingoCells[i * 5 + 4 - i].hit && this.gameHits[4 - i][i] ? 1 : 0;
    }
    return {
      minusdiag: minusdiag >= 5,
      plusdiag: plusdiag >= 5,
      xrow: xrow,
      yrow: yrow,
      win: minusdiag >= 5 || plusdiag >= 5 || xrow >= 0 || yrow >= 0,
    } as CheckForWinResult;
  }

  private updateValues(bingoGame: BingoGame): void {
    this.bingoNumber =
      bingoGame.randomValues.length > 0
        ? bingoGame.randomValues[bingoGame.randomValues.length - 1]
        : null;
    this.randomValues = bingoGame.randomValues;
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
        myBingoCells[y * 5 + x].bingo = false;
        myBingoCells[y * 5 + x].value =
          bingoGame.bingoBoards[myIndex].board[y][x];
      }
    }
    return {
      gameUuid: bingoGame.uuid,
      bingoCells: myBingoCells,
      bingoHits: bingoGame.bingoBoards[myIndex].hits,
    } as NewGame;
  }
}
