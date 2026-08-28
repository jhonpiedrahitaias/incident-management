import { Clock, IdGenerator, systemClock } from "./system.port";

/**
 * Pruebas del reloj real.
 *
 * Sin `TestBed` ni Angular, como todo lo de `core/domain/`.
 *
 * Es una línea de código, pero es **producción**: si alguien lo cambiara por
 * `Date.now()` seguiría compilando —ambos son valores— y `createdAt` pasaría
 * a guardar un número donde el resto del sistema espera ISO 8601.
 */
describe('systemClock', () => {
  it('devuelve una marca ISO 8601 válida', () => {
    const marca = systemClock();

    expect(typeof marca).toBe('string');
    // Formato exacto: es el que entiende `new Date(...)` en cualquier
    // navegador y el que espera el atributo `datetime` de `<time>`.
    expect(marca).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('la marca corresponde al momento actual', () => {
    const antes = Date.now();
    const marca = Date.parse(systemClock());
    const despues = Date.now();

    expect(marca).toBeGreaterThanOrEqual(antes);
    expect(marca).toBeLessThanOrEqual(despues);
  });

  it('avanza: dos lecturas no retroceden nunca', () => {
    const primera = Date.parse(systemClock());
    const segunda = Date.parse(systemClock());

    // No se exige que sean distintas —dos llamadas seguidas caen en el mismo
    // milisegundo— pero el tiempo no puede ir hacia atrás.
    expect(segunda).toBeGreaterThanOrEqual(primera);
  });

  it('un reloj fijo cumple el mismo contrato', () => {
    // Ésta es la razón de que `Clock` sea un tipo y no una llamada directa a
    // `new Date()`: la prueba de un caso de uso enchufa uno como éste y
    // puede afirmar la fecha exacta.
    const fijo: Clock = () => '2026-01-01T00:00:00.000Z';

    expect(fijo()).toBe('2026-01-01T00:00:00.000Z');
  });

  it('un generador de identificadores es igual de sustituible', () => {
    const secuencia: IdGenerator = (() => {
      let n = 0;
      return () => `inc-${++n}`;
    })();

    expect(secuencia()).toBe('inc-1');
    expect(secuencia()).toBe('inc-2');
  });
});