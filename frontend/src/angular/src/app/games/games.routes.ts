import { Routes } from "@angular/router";
import { GamesComponent } from "./games.component";
import { BingoComponent } from "./bingo/bingo.component";

export const GAMES: Routes = [
  {
    path: "",
    component: GamesComponent,
    children: [
      { path: "**", redirectTo: "bingo" },
      { path: "bingo", component: BingoComponent },
    ],
  },
  { path: "**", redirectTo: "" },
];
