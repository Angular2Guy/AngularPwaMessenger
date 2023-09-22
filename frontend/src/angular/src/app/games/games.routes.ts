import { Routes } from "@angular/router";
import { BingoComponent } from "./bingo/bingo.component";

export const GAMES: Routes = [
  { path: "bingo", component: BingoComponent },
  { path: "**", redirectTo: "bingo" },
];
