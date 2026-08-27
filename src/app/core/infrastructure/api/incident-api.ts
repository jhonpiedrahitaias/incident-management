//IA

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Incident } from '../../domain/models/incident.model';
import { environment } from '../../../../environments/environment';
import { IncidentRepository } from '../../domain/ports/incident-repository.port';

const BASE_URL = `${environment.apiBaseUrl}/incidents`;

/**
 * Adaptador HTTP del puerto `IncidentRepository`.
 *
 * Su única responsabilidad es **hablar con el servidor**: construir la URL,
 * elegir el verbo y tipar la respuesta. No guarda estado, no decide reglas
 * de negocio y no sabe nada de la interfaz.
 */
@Injectable({
  providedIn: 'root',
})
export class IncidentApi implements IncidentRepository {
  private readonly http = inject(HttpClient);

  /** `GET /api/incidents` */
  getAll(): Observable<Incident[]> {
    return this.http.get<Incident[]>(BASE_URL);
  }

  /** `GET /api/incidents/:id` */
  getById(id: string): Observable<Incident> {
    return this.http.get<Incident>(`${BASE_URL}/${id}`);
  }

  search(term: string): Observable<Incident[]> {
    const trimmed = term.trim();
    const params = trimmed ? new HttpParams().set('search', trimmed) : new HttpParams();

    return this.http.get<Incident[]>(BASE_URL, { params });
  }

  /** `POST /api/incidents` */
  create(incident: Incident): Observable<Incident> {
    return this.http.post<Incident>(BASE_URL, incident);
  }

  /** `PUT /api/incidents/:id` */
  update(incident: Incident): Observable<Incident> {
    return this.http.put<Incident>(`${BASE_URL}/${incident.id}`, incident);
  }

  /** `DELETE /api/incidents/:id` */
  remove(id: string): Observable<void> {
     return this.http.delete<void>(`${BASE_URL}/${id}`);
  }
}