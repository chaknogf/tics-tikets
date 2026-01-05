import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FueraDeServicio } from './fuera-de-servicio';

describe('FueraDeServicio', () => {
  let component: FueraDeServicio;
  let fixture: ComponentFixture<FueraDeServicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FueraDeServicio]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FueraDeServicio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
