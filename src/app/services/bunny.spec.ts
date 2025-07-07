import { TestBed } from '@angular/core/testing';

import { Bunny } from './bunny';

describe('Bunny', () => {
  let service: Bunny;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Bunny);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
