import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BunnyChart } from './bunny-chart';

describe('BunnyChart', () => {
  let component: BunnyChart;
  let fixture: ComponentFixture<BunnyChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BunnyChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BunnyChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
