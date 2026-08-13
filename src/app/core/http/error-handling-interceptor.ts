import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { CORRELATION_ID_HEADER } from './correlation-id-interceptor';


const MESSAGES: Readonly<Record<number, string>> = {
  400: 'Los datos enviados no son válidos. Revisa el formulario e inténtalo de nuevo.',
  401: 'Tu sesión ha caducado. Vuelve a iniciar sesión.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  500: 'El servidor no pudo procesar la solicitud. Inténtalo más tarde.',
};

export class AppHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly correlationId: string | null,
  ) {
    super(message);
    this.name = 'AppHttpError';
  }
}

export const errorHandlingInterceptor: HttpInterceptorFn = (request, next) => {
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const correlationId = request.headers.get(CORRELATION_ID_HEADER);

      return throwError(
        () => new AppHttpError(toMessage(error), error.status, correlationId),
      ) as Observable<never>;
    }),
  );
};

function toMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'No hay conexión con el servidor. Comprueba tu red.';
  }

  const fromServer = error.error?.message;
  if (typeof fromServer === 'string' && fromServer.trim() !== '') {
    return fromServer;
  }

  return MESSAGES[error.status] ?? `Error inesperado del servidor (${error.status}).`;
}