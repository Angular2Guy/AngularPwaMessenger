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
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { BingoGame } from "src/app/model/games/bingo-game";

@Injectable({
  providedIn: "root",
})
export class BingoService {
  private readonly baseUrl = "/rest/games/bingo";
  constructor(private http: HttpClient) {}

  newGame(userIds: string[]): Observable<BingoGame> {
    const bingoGame = {
      bingoBoards: [],
      lastUpdate: null,
      randomValues: [],
      uuid: null,
      playerUserIds: userIds,
    } as BingoGame;
    return this.http.post<BingoGame>(this.baseUrl + "/newgame", bingoGame);
  }

  updateGame(gameUuid: string): Observable<BingoGame> {
    return this.http.get<BingoGame>(`${this.baseUrl}/updategame/${gameUuid}`);
  }

  checkWin(gameUuid: string, userUuid: string): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.baseUrl}/checkwin/${gameUuid}/user/${userUuid}`
    );
  }
}
