import { Observable } from "rxjs";
import { AuthResponse, Credentials } from "../models/auth.model";

export interface AuthGateway {
  login(credentials: Credentials): Observable<AuthResponse>;
}