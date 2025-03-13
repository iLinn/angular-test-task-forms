import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';
import { firstValueFrom } from 'rxjs';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('checkUsernameAvailability', () => {
    it('should return true for available username', async () => {
      const result = await firstValueFrom(service.checkUsernameAvailability('New Bob'));
      expect(result).toBe({ isAvailable: true });
    });

    it('should return false for taken username', async () => {
      const result = await firstValueFrom(service.checkUsernameAvailability('John Doe'));
      expect(result).toBe({ isAvailable: false });
    });
  });

  describe('submitForms', () => {
    it('should successfully submit forms', async () => {
      const forms = [
        { id: 1, country: 'USA', username: 'newUser_1', birthdate: '1990-01-01' }
      ];
      
      const result = await firstValueFrom(service.submitForms(forms));
      expect(result).toEqual({ result: 'nice job' });
    });
  });
});