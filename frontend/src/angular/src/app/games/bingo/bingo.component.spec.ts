import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BingoComponent } from './bingo.component';

describe('BingoComponent', () => {
  let component: BingoComponent;
  let fixture: ComponentFixture<BingoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BingoComponent]
    });
    fixture = TestBed.createComponent(BingoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
