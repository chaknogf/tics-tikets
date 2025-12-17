import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Notificador } from './notificador';

describe('Notificador', () => {
  let component: Notificador;
  let fixture: ComponentFixture<Notificador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Notificador]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Notificador);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
