import { INITIAL_STATUS, Incident, IncidentStatusEnum, nextIncidentId } from './incident.model';

describe('Incident (reglas de dominio)', () => {
    /** Incidencia mínima: solo importa el `id` en estas pruebas. */
    const withId = (id: string): Incident =>
        ({
            id,
            title: 'Da igual',
            description: 'Da igual',
            category: 'Da igual',
            priority: 'LOW',
            status: IncidentStatusEnum.OPEN,
            reporterId: 'u-001',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        }) as Incident;

    describe('INITIAL_STATUS', () => {
        it('una incidencia nace abierta', () => {
            expect(INITIAL_STATUS).toBe(IncidentStatusEnum.OPEN);
        });
    });

    describe('nextIncidentId', () => {
        it('con la colección vacía empieza por inc-001', () => {
            expect(nextIncidentId([])).toBe('inc-001');
        });

        it('continúa la serie', () => {
            expect(nextIncidentId([withId('inc-001'), withId('inc-002')])).toBe('inc-003');
        });

        it('parte del más alto, no de cuántos hay', () => {
            // Con tres incidencias pero llegando a la 007, la siguiente es la 008.
            // Contar en vez de mirar el máximo daría inc-004 y repetiría un id.
            const incidencias = [withId('inc-001'), withId('inc-005'), withId('inc-007')];

            expect(nextIncidentId(incidencias)).toBe('inc-008');
        });

        it('no depende del orden de la lista', () => {
            const desordenadas = [withId('inc-009'), withId('inc-002'), withId('inc-005')];

            expect(nextIncidentId(desordenadas)).toBe('inc-010');
        });

        it('rellena con ceros hasta tres dígitos', () => {
            expect(nextIncidentId([withId('inc-008')])).toBe('inc-009');
            expect(nextIncidentId([withId('inc-099')])).toBe('inc-100');
        });

        it('pasado el 999 sigue creciendo en vez de truncar', () => {
            expect(nextIncidentId([withId('inc-999')])).toBe('inc-1000');
        });

        it('ignora los identificadores sin dígitos en vez de fallar', () => {
            const mezcladas = [withId('legacy'), withId('inc-004')];

            expect(nextIncidentId(mezcladas)).toBe('inc-005');
        });

        it('con solo identificadores sin dígitos vuelve a empezar por inc-001', () => {
            expect(nextIncidentId([withId('legacy'), withId('otro')])).toBe('inc-001');
        });

        it('no modifica la colección que recibe', () => {
            const incidencias = [withId('inc-002'), withId('inc-001')];
            const copia = incidencias.map((incident) => incident.id);

            nextIncidentId(incidencias);

            expect(incidencias.map((incident) => incident.id)).toEqual(copia);
        });

        it('es determinista: la misma entrada da la misma salida', () => {
            const incidencias = [withId('inc-003')];

            expect(nextIncidentId(incidencias)).toBe(nextIncidentId(incidencias));
        });

        it('toma todos los dígitos del id, estén donde estén', () => {
            expect(nextIncidentId([withId('a1b2')])).toBe('inc-013');
        });
    });
});