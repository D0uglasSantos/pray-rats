export function validateSignUpInput(input: {
  name?: string;
  email?: string;
  password?: string;
}): { valid: boolean; error?: string } {
  if (!input.name?.trim() || !input.email?.trim() || !input.password) {
    return { valid: false, error: "Preencha todos os campos." };
  }
  if (input.password.length < 6) {
    return { valid: false, error: "A senha deve ter pelo menos 6 caracteres." };
  }
  return { valid: true };
}

export function validateSignInInput(input: {
  email?: string;
  password?: string;
}): { valid: boolean; error?: string } {
  if (!input.email?.trim() || !input.password) {
    return { valid: false, error: "Preencha e-mail e senha." };
  }
  return { valid: true };
}

export function validateGroupName(name?: string): { valid: boolean; error?: string } {
  if (!name?.trim()) {
    return { valid: false, error: "Informe o nome do grupo." };
  }
  if (name.trim().length > 120) {
    return { valid: false, error: "Nome do grupo deve ter no máximo 120 caracteres." };
  }
  return { valid: true };
}

export function validateCheckinTitle(title?: string): { valid: boolean; error?: string } {
  if (!title?.trim()) {
    return { valid: false, error: "Informe um título para o check-in." };
  }
  if (title.trim().length > 140) {
    return { valid: false, error: "Título deve ter no máximo 140 caracteres." };
  }
  return { valid: true };
}
