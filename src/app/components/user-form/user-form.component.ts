import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { UserService } from '../../services/user.service';
import { COUNTRIES } from '../../shared/enum/country';
import { UserForm } from '../../models/user-form.model';
import { CheckUserResponseData } from '../../shared/interface/responses';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormComponent implements OnInit, OnDestroy {
  @Input() formId!: number;
  @Output() formChange = new EventEmitter<UserForm>();
  @Output() remove = new EventEmitter<number>();

  form!: FormGroup;
  showCountryDropdown = false;
  filteredCountries = COUNTRIES;
  checkingUsername = false;
  maxDate: string;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
  ) {
    // Set max date to today
    const today = new Date();
    this.maxDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.initForm();
    this.setupUsernameValidation();
    this.setupFormValueChanges();
    this.cdr.detectChanges();

    // Close dropdown when clicking outside
    document.addEventListener('click', this.onDocumentClick);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.onDocumentClick);
  }

  private onDocumentClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.showCountryDropdown = false;
      this.cdr.detectChanges();
    }
  };

  private initForm(): void {
    this.form = this.fb.group({
      country: ['', Validators.required],
      username: ['', Validators.required],
      birthdate: ['', [Validators.required, this.futureDateValidator()]]
    });
  }

  private futureDateValidator() {
    return (control: any) => {
      if (!control.value) {
        return null;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const inputDate = new Date(control.value);
      inputDate.setHours(0, 0, 0, 0);

      return inputDate > today ? { futureDate: true } : null;
    };
  }

  private setupUsernameValidation(): void {
    this.form.get('username')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(username => {
        if (!username || username.length < 3) {
          return [];
        }
        this.checkingUsername = true;
        this.cdr.detectChanges();
        return this.userService.checkUsernameAvailability(username);
      }),
      takeUntil(this.destroy$),
    ).subscribe(({ isAvailable }: CheckUserResponseData) => {
      this.checkingUsername = false;
      const usernameControl = this.form.get('username');
      
      if (usernameControl?.value && !isAvailable) {
        usernameControl.setErrors({ ...usernameControl.errors, taken: true });
      } else if (usernameControl?.errors?.['taken']) {
        const { taken, ...errors } = usernameControl.errors;
        usernameControl.setErrors(Object.keys(errors).length ? errors : null);
      }
      
      this.emitFormChange();
    });
  }

  private setupFormValueChanges(): void {
    this.form.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.emitFormChange();
    });
  }

  filterCountries(event: Event): void {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredCountries = COUNTRIES.filter(country => 
      country.toLowerCase().includes(value)
    );
  }

  selectCountry(country: string): void {
    this.form.get('country')?.setValue(country);
    this.showCountryDropdown = false;
    this.cdr.detectChanges();
  }

  isControlInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  onRemove(): void {
    this.remove.emit(this.formId);
  }

  private emitFormChange(): void {
    const formValue = this.form.value;
    const errors: any = {};
    
    if (this.isControlInvalid('country')) {
      errors.country = 'Please select a country';
    }
    
    if (this.isControlInvalid('username') || this.form.get('username')?.errors?.['taken']) {
      errors.username = 'Please provide a correct Username';
    }
    
    if (this.isControlInvalid('birthdate')) {
      errors.birthdate = 'Please provide a valid date';
    }

    const userForm: UserForm = {
      id: this.formId,
      ...formValue,
      isValid: this.form.valid,
      errors
    };

    this.formChange.emit(userForm);
    this.cdr.detectChanges();
  }
}
