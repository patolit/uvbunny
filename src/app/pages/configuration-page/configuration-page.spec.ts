import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurationPage } from './configuration-page';

describe('ConfigurationPage', () => {
  let component: ConfigurationPage;
  let fixture: ComponentFixture<ConfigurationPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigurationPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigurationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
