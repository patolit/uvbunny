import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BunnyDetail } from './bunny-detail';

describe('BunnyDetail', () => {
  let component: BunnyDetail;
  let fixture: ComponentFixture<BunnyDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BunnyDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BunnyDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
