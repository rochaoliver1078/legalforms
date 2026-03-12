// ==============================================
// LEGALFORMS — Utility Functions
// ==============================================

/** Generate unique field ID */
export const uid = () => 'f' + Math.random().toString(36).slice(2, 8);

/** Format CPF: 000.000.000-00 */
export function maskCPF(v: string): string {
  return v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14);
}

/** Format CNPJ: 00.000.000/0000-00 */
export function maskCNPJ(v: string): string {
  return v.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2').slice(0, 18);
}

/** Format CEP: 00000-000 */
export function maskCEP(v: string): string {
  return v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
}

/** Format phone: (00) 00000-0000 */
export function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '');
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
}

/** Format currency: R$ 1.234,56 */
export function maskCurrency(v: string): string {
  const n = v.replace(/\D/g, '');
  if (!n) return '';
  const num = parseInt(n, 10) / 100;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Get mask function by field type */
export function getMask(type: string): ((v: string) => string) | null {
  switch (type) {
    case 'cpf': return maskCPF;
    case 'cnpj': return maskCNPJ;
    case 'cep': return maskCEP;
    case 'phone': return maskPhone;
    case 'currency': return maskCurrency;
    default: return null;
  }
}

/** Validate CPF */
export function validateCPF(cpf: string): boolean {
  const nums = cpf.replace(/\D/g, '');
  if (nums.length !== 11 || /^(\d)\1+$/.test(nums)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(nums[i]) * (10 - i);
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;
  if (parseInt(nums[9]) !== d1) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(nums[i]) * (11 - i);
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;
  return parseInt(nums[10]) === d2;
}

/** Validate CNPJ */
export function validateCNPJ(cnpj: string): boolean {
  const nums = cnpj.replace(/\D/g, '');
  if (nums.length !== 14 || /^(\d)\1+$/.test(nums)) return false;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(nums[i]) * weights1[i];
  let d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(nums[12]) !== d1) return false;
  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(nums[i]) * weights2[i];
  let d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return parseInt(nums[13]) === d2;
}

/** Format relative date in Portuguese */
export function formatDate(d: string): string {
  const date = new Date(d);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} dias atrás`;
  return date.toLocaleDateString('pt-BR');
}

/** Truncate text */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/** Class names helper */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
