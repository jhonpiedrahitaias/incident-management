import { Observable } from 'rxjs';
import { Incident } from '../models/incident.model';

export interface IncidentRepository {

  getAll(): Observable<Incident[]>;
  search(term: string): Observable<Incident[]>;
  getById(id: string): Observable<Incident>;
  create(incident: Incident): Observable<Incident>;
  update(incident: Incident): Observable<Incident>;
  remove(id: string): Observable<void>;
}