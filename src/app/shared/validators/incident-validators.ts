//IA
import { ValidationErrors, ValidatorFn } from '@angular/forms';
import { AbstractControl, } from "@angular/forms";

export function normalizeTag(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function notOnlyWhitespace(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (typeof value !== 'string' || value === '') {
    return null;
  }

  return value.trim() === '' ? { onlyWhitespace: true } : null;
}

/**
 * Rechaza los textos que contienen alguna palabra restringida.
 *
 * Es una *factoría* de validadores: recibe la configuración y devuelve la
 * función. Es el patrón que usa el propio Angular en `Validators.minLength(5)`.
 *
 * La comparación es por **palabra completa** y sin distinguir mayúsculas ni
 * acentos. Buscar por subcadena daría falsos positivos: prohibir `test`
 * rechazaría «con*test*ador». Así, «Test» y «TEST» se detectan, pero
 * «contestador» pasa.
 */
export function forbiddenWords(words: readonly string[]): ValidatorFn {
  const forbidden = words.map((word) => normalizeText(word));

  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (typeof value !== 'string' || value.trim() === '') {
      return null;
    }

    const tokens = new Set(normalizeText(value).split(/[^\p{L}\p{N}]+/u).filter(Boolean));
    const found = forbidden.filter((word) => tokens.has(word));

    return found.length > 0 ? { forbiddenWords: { found } } : null;
  };
}

/**
 * Limita cuántos elementos puede tener una colección (un `FormArray`).
 *
 * Se aplica al array entero, no a sus controles: el error no pertenece a
 * ninguna etiqueta concreta, sino al conjunto.
 */
export function maxItems(max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!Array.isArray(value)) {
      return null;
    }

    return value.length > max ? { maxItems: { max, actual: value.length } } : null;
  };
}

/**
 * Rechaza una colección con elementos repetidos.
 *
 * Compara en forma normalizada, así que «Red», «red » y «RED» cuentan como
 * la misma etiqueta. Los elementos vacíos se ignoran: aún se están
 * escribiendo, y de ellos se ocupa el validador de cada control.
 */
export function noDuplicates(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (!Array.isArray(value)) {
    return null;
  }
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const item of value) {
    if (typeof item !== 'string') {
      continue;
    }

    const normalized = normalizeTag(item);
    if (normalized === '') {
      continue;
    }

    if (seen.has(normalized)) {
      duplicates.add(normalized);
    }

    seen.add(normalized);
  }

  return duplicates.size > 0 ? { duplicates: { values: [...duplicates] } } : null;
}

/** Minúsculas y sin acentos, para comparar texto sin sorpresas. */
function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD') // separa la letra de su tilde…
    .replace(/[̀-ͯ]/g, ''); // …y descarta la tilde
}