import { SESSION } from '../../../../core/infrastructure/di/tokens';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import {
  EMPTY,
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  forkJoin,
  interval,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { Incident, IncidentPriorityEnum, IncidentStatusEnum } from '../../../../core/domain/models/incident.model';
import {
  CHANGE_INCIDENTS_STATUS,
  INCIDENT_REPOSITORY,
  LIST_INCIDENTS,
} from '../../../../core/infrastructure/di/tokens';
import {
  ANY,
  IncidentStore,
  PAGE_SIZES,
  SortDirection,
  SortField,
} from '../../../../core/infrastructure/state/incident-store';
import { IncidentCard } from '../../components/incident-card/incident-card';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { LoadingIndicator } from '../../../../shared/components/loading-indicator/loading-indicator';

/** Espera antes de consultar al servidor, en milisegundos. */
const SEARCH_DEBOUNCE_MS = 300;

/** Periodo del refresco automático, en milisegundos. */
const AUTO_REFRESH_MS = 30_000;

@Component({
  selector: 'app-incident-list',
  imports: [
    IncidentCard,
    ConfirmDialog,
    EmptyState,
    LoadingIndicator,
    RouterLink,
  ],
  templateUrl: './incident-list.html',
  styleUrl: './incident-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentList {
  private readonly store = inject(IncidentStore);
  // Recargar es una operación de negocio: la ejecuta el caso de uso. El
  // store se sigue usando, pero solo para **leer** estado y para los filtros
  // y la paginación, que son de la vista.
  private readonly listIncidents = inject(LIST_INCIDENTS);
  private readonly changeStatuses = inject(CHANGE_INCIDENTS_STATUS);

  /** Las acciones en lote solo se ofrecen a quien puede gestionar. */
  protected readonly canManageIncidents = inject(SESSION).canManageIncidents;
  // El **puerto**, no el adaptador HTTP. Antes aquí había `inject(IncidentApi)`,
  // que ataba la pantalla a una implementación concreta y hacía imposible
  // probarla sin levantar toda la cadena de interceptores.
  private readonly incidentApi = inject(INCIDENT_REPOSITORY);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // --- Lectura del estado --------------------------------------------------
  //
  // Todo son señales de solo lectura del store. El componente **no puede**
  // escribir en el estado: para eso llama a una acción.

  protected readonly incidents = this.store.incidents;
  protected readonly visibleIncidents = this.store.visibleIncidents;
  protected readonly visibleCount = this.store.visibleCount;
  protected readonly totalCount = this.store.totalCount;
  protected readonly criticalCount = this.store.criticalCount;
  protected readonly openCount = this.store.openCount;
  protected readonly selectedIds = this.store.selectedIds;
  protected readonly selectedIncidents = this.store.selectedIncidents;
  protected readonly selectedCount = this.store.selectedCount;
  protected readonly hasSelection = this.store.hasSelection;
  /** Acciones que **todas** las seleccionadas admiten. Sale del dominio. */
  protected readonly commonStatusActions = this.store.commonStatusActions;

  // --- Acciones en lote ------------------------------------------------------

  /** Bloquea la barra mientras una operación está en vuelo. */
  private readonly bulkPendiente = signal(false);
  protected readonly bulkEnCurso = this.bulkPendiente.asReadonly();

  /** Resumen de lo ocurrido en la última operación en lote. */
  private readonly bulkResumen = signal<string | null>(null);
  protected readonly bulkMessage = this.bulkResumen.asReadonly();

  /** ¿Están todas las visibles seleccionadas? Decide el texto del botón. */
  protected readonly todasVisiblesSeleccionadas = computed(() => {
    const visibles = this.store.pagedIncidents();
    const ids = this.store.selectedIds();

    return visibles.length > 0 && visibles.every((incident) => ids.has(incident.id));
  });

  /** Texto del botón para cada destino: nombra la acción, no el estado. */
  protected accionPara(destino: IncidentStatusEnum): string {
    const acciones: Readonly<Record<IncidentStatusEnum, string>> = {
      OPEN: 'Reabrir',
      IN_PROGRESS: 'Tomar en curso',
      RESOLVED: 'Marcar resueltas',
      CLOSED: 'Cerrar',
    };

    return acciones[destino];
  }

  protected onToggleSelectAll(): void {
    this.store.toggleSelectAllVisible();
    this.bulkResumen.set(null);
  }

  protected onClearSelection(): void {
    this.store.clearSelection();
    this.bulkResumen.set(null);
  }

  protected onBulkStatus(destino: IncidentStatusEnum): void {
    const ids = this.store.selectedIncidents().map((incident) => incident.id);

    if (ids.length === 0 || this.bulkPendiente()) {
      return;
    }

    this.bulkPendiente.set(true);
    this.bulkResumen.set(null);

    this.changeStatuses
      .execute(ids, destino)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((resultado) => {
        this.bulkPendiente.set(false);

        // El caso de uso nunca falla: reparte entre aplicadas y fallidas. Se
        // cuenta lo que pasó de verdad en vez de dar un «listo» genérico.
        if (resultado.fallidas.length === 0) {
          this.bulkResumen.set(`${resultado.aplicadas.length} actualizadas.`);
          this.store.clearSelection();
          return;
        }

        this.bulkResumen.set(
          `${resultado.aplicadas.length} actualizadas, ${resultado.fallidas.length} sin cambiar.`,
        );
        // La selección se conserva: quien lo intentó necesita poder repetir
        // sobre las que quedaron sin aplicar.
      });
  }
  protected readonly hasActiveFilters = this.store.hasActiveFilters;
  protected readonly categories = this.store.categories;
  protected readonly sort = this.store.sort;
  protected readonly pagedIncidents = this.store.pagedIncidents;
  protected readonly totalPages = this.store.totalPages;
  protected readonly currentPageNumber = this.store.currentPageNumber;
  protected readonly hasPreviousPage = this.store.hasPreviousPage;
  protected readonly hasNextPage = this.store.hasNextPage;
  protected readonly pageRange = this.store.pageRange;
  protected readonly pageSize = this.store.pageSize;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly filters = this.store.filters;
  protected readonly loading = this.store.loading;
  protected readonly error = this.store.error;
  protected readonly loaded = this.store.loaded;

  /** Estado puramente visual: no describe el dominio, no va al store. */
  protected readonly searching = signal(false);
  protected readonly searchError = signal<string | null>(null);
  protected readonly autoRefresh = signal(false);

  /**
   * Incidencia pendiente de confirmar su eliminación.
   *
   * Guardar la incidencia entera —y no solo un booleano— permite nombrarla
   * en el diálogo, que es lo que evita borrar la que no era.
   */
  protected readonly pendingDeletion = signal<Incident | null>(null);

  // --- Búsqueda reactiva ---------------------------------------------------

  /**
   * El flujo RxJS se queda en el componente, no en el store.
   *
   * La espera de 300 ms y la cancelación son decisiones de **interacción**
   * —dependen de lo rápido que teclee una persona—, no del dominio. El
   * store solo recibe el resultado a través de una acción.
   */
  private readonly search = toSignal(
    toObservable(computed(() => this.filters().searchTerm)).pipe(
      debounceTime(SEARCH_DEBOUNCE_MS),
      map((term) => term.trim()),
      distinctUntilChanged(),
      filter((term) => term !== ''),
      tap(() => {
        this.searching.set(true);
        this.searchError.set(null);
      }),
      switchMap((term) =>
        this.incidentApi.search(term).pipe(
          catchError((failure: Error) => {
            this.searchError.set(failure.message);
            return of<Incident[]>([]);
          }),
        ),
      ),
      tap((results) => {
        this.searching.set(false);
        this.store.setSearchResults(results);
      }),
    ),
    { initialValue: [] as Incident[] },
  );

  constructor() {
    // El orden importa: primero se aplica lo que traiga la URL, y solo
    // después se empieza a escribirla.
    this.applyFiltersFromUrl();

    // `toSignal` necesita que alguien lea la señal para que el flujo corra.
    this.search();

    this.syncUrlWithState();
    this.startAutoRefresh();
    this.reloadWhenBackOnline();
  }

  // --- Sincronización con la URL -------------------------------------------
  //
  // Vive aquí y no en el store: el estado del dominio no debe saber que
  // existe un enrutador. El store guarda filtros; la URL es una forma de
  // presentarlos.

  /** Lee los parámetros de consulta al entrar y los vuelca en el store. */
  private applyFiltersFromUrl(): void {
    const params = this.route.snapshot.queryParamMap;

    this.store.setFilters({
      searchTerm: params.get('q') ?? ANY,
      status: (params.get('estado') ?? ANY) as IncidentStatusEnum | typeof ANY,
      priority: (params.get('prioridad') ?? ANY) as IncidentPriorityEnum | typeof ANY,
      category: params.get('categoria') ?? ANY,
    });

    const field = params.get('orden') as SortField | null;
    const direction = params.get('dir') as SortDirection | null;
    if (field === 'createdAt' || field === 'priority') {
      this.store.setSort({ field, direction: direction === 'asc' ? 'asc' : 'desc' });
    }

    const page = Number.parseInt(params.get('pagina') ?? '', 10);
    if (Number.isFinite(page) && page > 0) {
      this.store.goToPage(page);
    }
  }

  /**
   * Escribe el estado en la URL cada vez que cambia.
   *
   * Es un `effect` legítimo —de los que describía el Día 10—: no calcula un
   * valor para la plantilla, sincroniza con algo que vive fuera del sistema
   * reactivo, en este caso la barra de direcciones.
   *
   * `replaceUrl` evita llenar el historial: filtrar no debería obligar a
   * pulsar «atrás» quince veces para salir de la pantalla.
   */
  private syncUrlWithState(): void {
    effect(() => {
      const { searchTerm, status, priority, category } = this.store.filters();
      const { field, direction } = this.store.sort();
      const page = this.store.currentPageNumber();

      const queryParams: Params = {
        q: searchTerm.trim() || null,
        estado: status || null,
        prioridad: priority || null,
        categoria: category || null,
        // Solo se escribe el orden si no es el de por defecto.
        orden: field === 'createdAt' && direction === 'desc' ? null : field,
        dir: field === 'createdAt' && direction === 'desc' ? null : direction,
        pagina: page > 1 ? page : null,
      };

      this.router.navigate([], {
        relativeTo: this.route,
        queryParams,
        replaceUrl: true,
      });
    });
  }

  // --- Acciones: siempre a través del store --------------------------------

  protected onSearchTermChange(value: string): void {
    this.store.setFilters({ searchTerm: value });
  }

  protected onStatusFilterChange(value: string): void {
    this.store.setFilters({ status: value as IncidentStatusEnum | typeof ANY });
  }

  protected onPriorityFilterChange(value: string): void {
    this.store.setFilters({ priority: value as IncidentPriorityEnum | typeof ANY });
  }

  protected onCategoryFilterChange(value: string): void {
    this.store.setFilters({ category: value });
  }

  protected clearFilters(): void {
    this.store.clearFilters();
  }

  protected onSortChange(value: string): void {
    const [field, direction] = value.split(':') as [SortField, SortDirection];
    this.store.setSort({ field, direction });
  }

  protected onPageSizeChange(value: string): void {
    this.store.setPageSize(Number.parseInt(value, 10));
  }

  protected previousPage(): void {
    this.store.previousPage();
  }

  protected nextPage(): void {
    this.store.nextPage();
  }

  protected onIncidentSelected(incident: Incident): void {
    this.store.toggleSelection(incident.id);
  }

  /** El hijo pide eliminar; aquí solo se abre la confirmación. */
  /** Marca que se pidió borrar el lote; el diálogo confirma. */
  private readonly bulkDeletionPending = signal(false);
  protected readonly bulkDeletionRequested = this.bulkDeletionPending.asReadonly();

  protected onBulkDelete(): void {
    if (this.store.selectedCount() === 0 || this.bulkPendiente()) {
      return;
    }

    // Borrar es irreversible y aquí son varias a la vez: se confirma.
    this.bulkDeletionPending.set(true);
  }

  protected cancelBulkDeletion(): void {
    this.bulkDeletionPending.set(false);
  }

  protected confirmBulkDeletion(): void {
    const ids = this.store.selectedIncidents().map((incident) => incident.id);

    this.bulkDeletionPending.set(false);

    if (ids.length === 0) {
      return;
    }

    this.bulkPendiente.set(true);
    this.bulkResumen.set(null);

    // Cada borrado lleva su `catchError`: sin eso, el primer fallo cancelaría
    // los demás a mitad de vuelo y el lote quedaría a medias sin saber cuánto.
    const intentos = ids.map((id) =>
      this.store.remove(id).pipe(
        map(() => true),
        catchError(() => of(false)),
      ),
    );

    forkJoin(intentos)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((resultados) => {
        this.bulkPendiente.set(false);

        const borradas = resultados.filter(Boolean).length;
        const fallidas = resultados.length - borradas;

        this.bulkResumen.set(
          fallidas === 0
            ? `${borradas} eliminadas.`
            : `${borradas} eliminadas, ${fallidas} sin eliminar.`,
        );
      });
  }

  protected onDeleteRequested(incident: Incident): void {
    this.pendingDeletion.set(incident);
  }

  protected confirmDeletion(): void {
    const incident = this.pendingDeletion();

    if (!incident) {
      return;
    }

    this.pendingDeletion.set(null);
    this.store
      .remove(incident.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }

  protected cancelDeletion(): void {
    this.pendingDeletion.set(null);
  }

  protected reload(): void {
    this.reloadIncidents();
  }

  protected toggleAutoRefresh(): void {
    this.autoRefresh.update((enabled) => !enabled);
  }

  // --- Ciclo de vida -------------------------------------------------------

  /**
   * Temporizador controlado: el `interval` solo existe mientras el refresco
   * está activo, y `takeUntilDestroyed` lo corta con el componente.
   */
  private startAutoRefresh(): void {
    toObservable(this.autoRefresh)
      .pipe(
        switchMap((enabled) => (enabled ? interval(AUTO_REFRESH_MS) : EMPTY)),
        filter(() => !this.loading()),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.reloadIncidents());
  }

  /**
   * Ejecuta la consulta y anota el error si falla.
   *
   * El caso de uso deja el resultado en el modelo de lectura por su cuenta;
   * aquí solo queda decidir qué se le enseña al usuario si no llega.
   */
  private reloadIncidents(): void {
    this.store.clearError();

    this.listIncidents.execute().subscribe({
      error: (failure: Error) => {
        this.store.markLoaded();
        this.store.setError(failure.message);
      },
    });
  }

  /** `addEventListener` no lo limpia Angular: la baja se registra a mano. */
  private reloadWhenBackOnline(): void {
    const onOnline = () => this.reloadIncidents();

    window.addEventListener('online', onOnline);
    this.destroyRef.onDestroy(() => window.removeEventListener('online', onOnline));
  }
}