import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserFormComponent } from '../user-form/user-form.component';
import { UserForm } from '../../models/user-form.model';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-forms-container',
  standalone: true,
  imports: [CommonModule, UserFormComponent],
  templateUrl: './forms-container.component.html',
  styleUrls: ['./forms-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormsContainerComponent implements OnInit {
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);

  forms: { id: number }[] = [];
  formValues: { [key: number]: UserForm } = {};
  nextId = 1;
  
  invalidFormsCount = 0;
  countdownValue = 5;
  isCountingDown = false;
  isSubmitting = false;
  countdownInterval: any;

  ngOnInit(): void {
    this.addForm();
  }

  get canSubmit(): boolean {
    return Object.keys(this.formValues).length > 0 && this.invalidFormsCount === 0;
  }

  formTrackBy(index: number, form: { id: number }): number {
    return form.id;
  }

  addForm(): void {
    this.forms.push({ id: this.nextId });
    this.nextId++;
    this.cdr.detectChanges();
  }

  removeForm(id: number): void {
    this.forms = this.forms.filter(form => form.id !== id);
    delete this.formValues[id];
    this.updateInvalidFormsCount();
  }

  onFormChange(formData: UserForm): void {
    this.formValues[formData.id] = formData;
    this.updateInvalidFormsCount();
  }

  private updateInvalidFormsCount(): void {
    this.invalidFormsCount = Object.values(this.formValues)
      .filter(form => !form.isValid).length;
  }

  startSubmitCountdown(): void {
    if (this.isCountingDown || this.isSubmitting) return;
    
    this.isCountingDown = true;
    this.countdownValue = 5;
    
    this.countdownInterval = setInterval(() => {
      this.countdownValue--;
      this.cdr.detectChanges();
      
      if (this.countdownValue <= 0) {
        clearInterval(this.countdownInterval);
        this.isCountingDown = false;
        this.submitForms();
      }
    }, 1000);
  }

  private submitForms(): void {
    this.isSubmitting = true;
    
    const formsToSubmit = Object.values(this.formValues)
      .filter(form => form.isValid)
      .map(({ id, country, username, birthdate }) => ({ 
        id, country, username, birthdate 
      }));
    
    this.userService.submitForms(formsToSubmit).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response?.result) {
          alert(response.result);
          // Reset forms after successful submission
          this.forms = [];
          this.formValues = {};
          this.nextId = 1;
          // Add a new empty form
          this.addForm();
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error submitting forms:', error);
        alert('An error occurred while submitting forms. Please try again.');
      }
    });
  }

  cancelSubmit(): void {
    clearInterval(this.countdownInterval);
    this.isCountingDown = false;
    this.isSubmitting = false;
    this.countdownValue = 5;

  }
}