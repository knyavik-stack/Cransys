/**
 * Валидатор паролей по стандартам кибербезопасности Cransys 2026
 * Требования:
 * 1. Не менее 8 символов
 * 2. Латинский алфавит (без кириллицы)
 * 3. Хотя бы одна заглавная буква (A-Z)
 * 4. Хотя бы одна строчная буква (a-z)
 * 5. Хотя бы одна цифра (0-9)
 */

export interface PasswordRuleStatus {
  minLength: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  isLatinOnly: boolean;
}

export interface PasswordValidationResult {
  valid: boolean;
  rules: PasswordRuleStatus;
  errors: string[];
}

export function checkPasswordSecurity(password: string): PasswordValidationResult {
  const p = password || '';
  const minLength = p.length >= 8;
  const hasLowercase = /[a-z]/.test(p);
  const hasUppercase = /[A-Z]/.test(p);
  const hasNumber = /[0-9]/.test(p);
  // Разрешены латинские буквы, цифры и стандартные специальные символы
  const isLatinOnly = p.length > 0 && !/[а-яА-ЯёЁ]/.test(p) && /^[\x20-\x7E]+$/.test(p);

  const rules: PasswordRuleStatus = {
    minLength,
    hasLowercase,
    hasUppercase,
    hasNumber,
    isLatinOnly,
  };

  const errors: string[] = [];
  if (!minLength) errors.push('Пароль должен содержать не менее 8 символов');
  if (!isLatinOnly) errors.push('Пароль должен содержать только латинские символы, цифры и спецзнаки');
  if (!hasLowercase) errors.push('Добавьте хотя бы одну строчную латинскую букву (a-z)');
  if (!hasUppercase) errors.push('Добавьте хотя бы одну заглавную латинскую букву (A-Z)');
  if (!hasNumber) errors.push('Добавьте хотя бы одну цифру (0-9)');

  return {
    valid: minLength && hasLowercase && hasUppercase && hasNumber && isLatinOnly,
    rules,
    errors,
  };
}
