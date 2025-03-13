import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UserFormComponent } from './user-form.component';
import { UserService } from '../../services/user.service';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { Country } from '../../shared/enum/country';

describe('UserFormComponent', () => {
  let component: UserFormComponent;
  let fixture: ComponentFixture<UserFormComponent>;
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    const checkUsernameSpy = jasmine.createSpyObj('UserService', ['checkUsernameAvailability']);
    
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, UserFormComponent],
      providers: [
        { provide: UserService, useValue: checkUsernameSpy }
      ]
    }).compileComponents();

    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    component.formId = 1;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    it('should initialize with invalid form', () => {
      expect(component.form.valid).toBeFalsy();
    });

    it('should validate required fields', () => {
      const form = component.form;
      expect(form.get('country')?.errors?.['required']).toBeTruthy();
      expect(form.get('username')?.errors?.['required']).toBeTruthy();
      expect(form.get('birthdate')?.errors?.['required']).toBeTruthy();
    });

    it('should validate future date', () => {
      const birthdateControl = component.form.get('birthdate');
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      birthdateControl?.setValue(futureDate.toISOString().split('T')[0]);
      expect(birthdateControl?.errors?.['futureDate']).toBeTruthy();
    });

    it('should accept valid date', () => {
      const birthdateControl = component.form.get('birthdate');
      const pastDate = '1990-01-01';
      
      birthdateControl?.setValue(pastDate);
      expect(birthdateControl?.errors?.['futureDate']).toBeFalsy();
    });
  });

  describe('Username Validation', () => {
    it('should check username availability', fakeAsync(() => {
      userService.checkUsernameAvailability.and.returnValue(of({ isAvailable: true }));
      
      const usernameControl = component.form.get('username');
      usernameControl?.setValue('testuser');
      
      tick(300); // debounceTime
      expect(userService.checkUsernameAvailability).toHaveBeenCalledWith('testuser');
    }));

    it('should mark username as taken', fakeAsync(() => {
      userService.checkUsernameAvailability.and.returnValue(of({ isAvailable: false }));
      
      const usernameControl = component.form.get('username');
      usernameControl?.setValue('admin');
      
      tick(300); // debounceTime
      expect(usernameControl?.errors?.['taken']).toBeTruthy();
    }));
  });

  describe('Country Selection', () => {
    it('should filter countries', () => {
      const event = { target: { value: 'aus' } } as any;
      component.filterCountries(event);
      expect(component.filteredCountries).toContain(Country.Australia);
      expect(component.filteredCountries).toContain(Country.Austria);
    });

    it('should select country', () => {
      component.selectCountry('Ukraine');
      expect(component.form.get('country')?.value).toBe('Ukraine');
      expect(component.showCountryDropdown).toBeFalsy();
    });
  });

  describe('Form Events', () => {
    it('should emit remove event', () => {
      spyOn(component.remove, 'emit');
      component.onRemove();
      expect(component.remove.emit).toHaveBeenCalledWith(1);
    });

    it('should emit form change event', () => {
      spyOn(component.formChange, 'emit');
      component.form.patchValue({
        country: 'Mexico',
        username: 'John New',
        birthdate: '1990-01-01'
      });
      expect(component.formChange.emit).toHaveBeenCalled();
    });
  });
});