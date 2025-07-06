import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBunnyModal } from './add-bunny-modal';

describe('AddBunnyModal', () => {
  let component: AddBunnyModal;
  let fixture: ComponentFixture<AddBunnyModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddBunnyModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddBunnyModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
