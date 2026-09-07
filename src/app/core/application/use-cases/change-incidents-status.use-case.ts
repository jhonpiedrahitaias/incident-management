import { Observable, forkJoin, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Incident, IncidentStatusEnum } from '../../domain/models/incident.model';
import { UpdateIncidentStatusUseCase } from './update-incident-status.use-case';

/** Resultado de aplicar un cambio de estado a varias incidencias. */
export interface BulkStatusResult {
    /** Las que se guardaron correctamente. */
    readonly aplicadas: readonly Incident[];
    /** Las que fallaron, con su motivo. */
    readonly fallidas: readonly { readonly id: string; readonly motivo: string }[];
}

/** Lo que devuelve cada intento individual, antes de repartirlo. */
type Intento =
    | { readonly ok: true; readonly incident: Incident }
    | { readonly ok: false; readonly id: string; readonly motivo: string };

/** Separa los intentos en aplicadas y fallidas. */
function repartir(resultados: readonly Intento[]): BulkStatusResult {
    const aplicadas: Incident[] = [];
    const fallidas: { id: string; motivo: string }[] = [];

    for (const resultado of resultados) {
        if (resultado.ok) {
            aplicadas.push(resultado.incident);
        } else {
            fallidas.push({ id: resultado.id, motivo: resultado.motivo });
        }
    }

    return { aplicadas, fallidas };
}

export class ChangeIncidentsStatusUseCase {
    constructor(
        private readonly cambiarEstado: UpdateIncidentStatusUseCase
    ) { }

    execute(ids: readonly string[], status: IncidentStatusEnum): Observable<BulkStatusResult> {
        if (ids.length === 0) {
            return of({ aplicadas: [], fallidas: [] });
        }

        const intentos = ids.map((id) =>
            this.cambiarEstado.execute(id, status).pipe(
                map((incident) => ({ ok: true as const, incident })),
                catchError((error: Error) => of({ ok: false as const, id, motivo: error.message })),
            ),
        );

        return forkJoin(intentos).pipe(map((resultados) => repartir(resultados)));
    }
}