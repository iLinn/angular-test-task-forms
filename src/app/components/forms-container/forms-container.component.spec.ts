import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsContainerComponent } from './forms-container.component';
import { UserService } from '../../services/user.service';
import { of } from 'rxjs';
import { UserForm } from '../../models/user-form.model';

describe('FormsContainerComponent', () => {
  let component: FormsContainerComponent;
  let fixture: ComponentFixture<FormsContainerComponent>;
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    const submitFormsSpy = jasmine.createSpyObj('UserService', ['submitForms']);
    
    await TestBed.configureTestingModule({
      imports: [FormsContainerComponent],
      providers: [
        { provide: UserService, useValue: submitFormsSpy }
      ]
    }).compileComponents();

    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormsContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with two forms', () => {
    expect(component.forms.length).toBe(1);
  });

  describe('Form Management', () => {
    it('should add new form', () => {
      const initialCount = component.forms.length;
      component.addForm();
      expect(component.forms.length).toBe(initialCount + 1);
    });

    it('should remove form', () => {
      const initialCount = component.forms.length;
      component.removeForm(component.forms[0].id);
      expect(component.forms.length).toBe(initialCount - 1);
    });

    it('should update form values', () => {
      const mockForm: UserForm = {
        id: 1,
        country: 'USA',
        username: 'Bob New',
        birthdate: '1990-01-01',
        isValid: true,
        errors: {}
      };

      component.onFormChange(mockForm);
      expect(component.formValues[1]).toEqual(mockForm);
    });

    it('should track invalid forms count', () => {
      const mockForm: UserForm = {
        id: 1,
        country: '',
        username: '',
        birthdate: '',
        isValid: false,
        errors: { country: 'Required' }
      };

      component.onFormChange(mockForm);
      expect(component.invalidFormsCount).toBe(1);
    });
  });

  describe('Form Submission', () => {
    it('should start countdown when submitting', () => {
      component.startSubmitCountdown();
      expect(component.isCountingDown).toBeTruthy();
      expect(component.countdownValue).toBe(5);
    });

    it('should submit forms after countdown', fakeAsync(() => {
      userService.submitForms.and.returnValue(of({ result: 'nice job' }));
      
      const validForm: UserForm = {
        id: 1,
        country: 'Mexico',
        username: 'Bob New',
        birthdate: '1990-01-01',
        isValid: true,
        errors: {}
      };
      
      component.onFormChange(validForm);
      component.startSubmitCountdown();
      
      tick(5000); // Wait for countdown
      
      expect(userService.submitForms).toHaveBeenCalledWith([validForm]);
      expect(component.forms.length).toBe(1); // Should reset to one form after success
    }));
  });
});