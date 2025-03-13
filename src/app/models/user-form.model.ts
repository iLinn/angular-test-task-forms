export interface UserForm {
  id: number;
  country: string;
  username: string;
  birthdate: string;
  isValid: boolean;
  errors: {
    country?: string;
    username?: string;
    birthdate?: string;
  };
}