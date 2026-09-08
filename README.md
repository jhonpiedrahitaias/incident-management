# Gestión de incidencias

Aplicación de gestión de incidencias técnicas construida con **Angular**.

Es un proyecto de aprendizaje: funciona de principio a fin, pero el backend
está simulado. Lo que eso implica está escrito, sin adornos.

## Empezar

```bash
npm install
npm start
```

La aplicación queda en **http://localhost:4300/**.

> El puerto por defecto de Angular es el 4200; aquí se usa el **4300** porque
> el 4200 suele estar ocupado por otro proyecto en la máquina de desarrollo.
> Se cambia en el script `start` del `package.json`.

### Entrar

Cualquiera de estas cuentas, todas con la contraseña **`angular20`**:

| Correo | Rol | Qué puede hacer |
|---|---|---|
| `ana.torres@example.com` | **ADMIN** | todo, incluido el panel de administración |
| `luis.gomez@example.com` | **AGENT** | gestionar incidencias, sin administrar |
| `carlos.pena@example.com` | **REQUESTER** | registrar y consultar las suyas |

Las credenciales están a la vista en la propia pantalla de acceso.

### Requisitos

Node.js **22.22.1** o compatible, y npm **10.9.4** o compatible. El Angular
CLI viene en las dependencias del proyecto: no hace falta instalarlo aparte.

---

## Comandos

| Comando | Qué hace |
|---|---|
| `npm start` | servidor de desarrollo con recarga automática, en el puerto 4300 |
| `npm run build` | compila para producción en `dist/incident-management/browser/` |
| `npm test` | pruebas en modo vigilancia, con navegador abierto |
| `npm run test:ci` | pruebas una vez, sin ventana — **618 pruebas** |
| `npm run test:coverage` | pruebas con informe de cobertura en `coverage/` |
| `npm run lint` | análisis estático con `angular-eslint` |

La compilación de producción sustituye `src/environments/environment.ts` por
`environment.production.ts`, lo que entre otras cosas **deja fuera el backend
simulado**.

---

## Qué hace la aplicación

- **Incidencias**: registrar, editar, ver el detalle y eliminar con
  confirmación.
- **Búsqueda y filtros** por texto, estado, prioridad y categoría, con la
  búsqueda amortiguada para no pedir en cada tecla.
- **Los filtros viven en la URL**: se puede compartir o guardar una vista
  filtrada, y sobrevive a una recarga.
- **Resumen** con el recuento por estado y por prioridad.
- **Acceso por roles** con guards en las rutas, y un `returnUrl` que devuelve
  a donde se quería ir tras iniciar sesión.
- **Errores tratados en un solo sitio**, con un identificador de rastreo en
  cada petición.

---

## Cómo está organizado

```
src/app/
├── core/
│   ├── domain/          el centro — 0 imports de Angular, vigilado por ESLint
│   │   ├── models/      entidades y reglas puras
│   │   └── ports/       interfaces: qué necesita el dominio del exterior
│   ├── application/     casos de uso — 0 imports de Angular
│   │   └── use-cases/   registrar · consultar · cambiar estado
│   └── infrastructure/  todo lo reemplazable
│       ├── api/         IncidentApi (adaptador HTTP) + backend simulado
│       ├── di/          fichas de inyección de los puertos
│       ├── guards/      authGuard · roleGuard
│       ├── http/        4 interceptores: rastreo · token · carga · errores
│       ├── mocks/       datos de demostración
│       ├── services/    Auth · User · Loading
│       └── state/       IncidentStore (señales)
├── features/      una carpeta por pantalla, todas con carga diferida
│   ├── auth/  dashboard/  incidents/  admin/
├── layout/        cabecera y pie
├── shared/        piezas reutilizables, sin reglas de negocio
│   ├── components/  directives/  pipes/  validators/  pages/
└── testing/       utilidades comunes de las pruebas
```

**La regla que lo sostiene**: las dependencias apuntan hacia adentro.
`domain` no importa nada; `application` solo importa `domain`; `infrastructure`
puede importar ambas. **No es un acuerdo, es una regla de ESLint**: un
`import` de Angular en `domain/` o `application/` falla el linter.
---

## Pruebas

```bash
npm run test:ci        
npm run test:coverage 
```

Los umbrales de cobertura (**90 %** líneas y funciones, **80 %** ramas) están
configurados en `karma.conf.js`.

Con una advertencia que conviene tener presente: la cobertura mide ejecución,
no verificación. 
---

## Despliegue

La compilación genera archivos estáticos: sirve cualquier hosting estático.

```bash
npm run build
```

**Lo único que hay que configurar es el reenvío de rutas.** El enrutador vive
en el navegador: el servidor no conoce `/incidents/inc-003`, así que sin esta
regla recargar esa dirección devolvería un 404. Todo lo que no sea un archivo
real debe responderse con `index.html`, y con un **200**, no un 301 — es una
reescritura, no una redirección.
