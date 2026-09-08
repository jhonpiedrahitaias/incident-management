import { canAdminister, canManageIncidents, hasAnyRole, UserRole } from "./user.model";

/**
 * Pruebas de los permisos del dominio.
 *
 * Sin `TestBed` ni Angular. Antes eran `computed` dentro de `AuthService`, así
 * que comprobar «quién puede qué» exigía montar un inyector e iniciar sesión.
 * Ahora son funciones puras sobre el rol.
 *
 * > Esto decide **qué se ofrece**, no qué se permite. La barrera de verdad
 * > está en el servidor (riesgo R-02). Estas pruebas fijan la regla de la
 * > interfaz, no una garantía de seguridad.
 */
describe('permisos (reglas de dominio)', () => {
  const TODOS: UserRole[] = ['ADMIN', 'AGENT', 'REQUESTER'];

  describe('canManageIncidents', () => {
    it('ADMIN y AGENT atienden incidencias', () => {
      expect(canManageIncidents('ADMIN')).toBe(true);
      expect(canManageIncidents('AGENT')).toBe(true);
    });

    it('REQUESTER no', () => {
      // Quien reporta puede registrar y consultar las suyas, no gestionarlas.
      expect(canManageIncidents('REQUESTER')).toBe(false);
    });

    it('sin sesión tampoco', () => {
      // `null` no es «rol desconocido con permiso»: es «nadie».
      expect(canManageIncidents(null)).toBe(false);
    });
  });

  describe('canAdminister', () => {
    it('es exclusivo de ADMIN', () => {
      expect(canAdminister('ADMIN')).toBe(true);
      expect(canAdminister('AGENT')).toBe(false);
      expect(canAdminister('REQUESTER')).toBe(false);
      expect(canAdminister(null)).toBe(false);
    });

    it('quien administra también gestiona: no hay permiso huérfano', () => {
      // Si algún día administrar no implicara gestionar, sería una decisión
      // que habría que tomar a conciencia, no un descuido.
      for (const rol of TODOS) {
        if (canAdminister(rol)) {
          expect(canManageIncidents(rol)).withContext(rol).toBe(true);
        }
      }
    });
  });

  describe('hasAnyRole', () => {
    it('acierta cuando el rol está en la lista', () => {
      expect(hasAnyRole('AGENT', 'ADMIN', 'AGENT')).toBe(true);
    });

    it('falla cuando no está', () => {
      expect(hasAnyRole('REQUESTER', 'ADMIN', 'AGENT')).toBe(false);
    });

    it('sin rol nunca coincide, ni con la lista vacía', () => {
      expect(hasAnyRole(null, 'ADMIN')).toBe(false);
      expect(hasAnyRole(null)).toBe(false);
    });

    it('una lista vacía no deja pasar a nadie', () => {
      // El caso peligroso: si devolviera `true` por no haber restricciones,
      // un `hasAnyRole()` mal escrito abriría la puerta a todo el mundo.
      for (const rol of TODOS) {
        expect(hasAnyRole(rol)).withContext(rol).toBe(false);
      }
    });
  });
});