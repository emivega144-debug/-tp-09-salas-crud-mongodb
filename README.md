# tp-09-salas-crud-mongodb

Trabajo práctico 09 del curso de desarrollo back-end con Node.js. Completa las operaciones de actualización y eliminación (`PUT`, `PATCH` y `DELETE`) sobre la API de reservas de salas conectada a MongoDB Atlas, manteniendo la lectura, la creación y las vistas web del TP 08.

## Origen y entorno del proyecto

Este repositorio parte de una copia funcional de `tp-08-salas-http-mongodb`, conservando la estructura en CommonJS, las vistas EJS, el cierre ordenado del servidor y las herramientas de formato y análisis (`Prettier` y `ESLint`).

- **Node.js:** v24.19.0
- **Dependencias principales:** `express` (5.x), `mongoose` (9.10.3), `ejs` y `morgan`
- **Base de datos:** MongoDB Atlas Free, base `reservas_salas_u9`, colección `reservas`
- **Resolución DNS:** Se mantiene la configuración explícita de servidores DNS en `src/config/base-datos.js` para asegurar la resolución SRV de Atlas.

Para correr el proyecto localmente hay que crear un archivo `.env` en la raíz a partir de `.env.example` (sin subir `.env` al repositorio):

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://USUARIO:CLAVE@HOST/reservas_salas_u9?retryWrites=true&w=majority
```

## Instalación, validación e inicio

```bash
npm install
node --env-file=.env scripts/comprobar-conexion.js
npm run format
npm run check
node --env-file=.env src/index.js
```

El servidor arranca en `http://localhost:3000` recién después de confirmar la conexión con Atlas y no inserta documentos automáticamente al iniciar ni al listar.

## Organización por capas

- `src/config/`: Lectura de variables de entorno (`entorno.js`) y conexión a MongoDB Atlas (`base-datos.js`).
- `src/modelos/reserva.js`: Esquema Mongoose de reserva, listas de valores permitidos (`SALAS_PERMITIDAS`, `TURNOS_PERMITIDOS`) y reglas de validación de datos.
- `src/servicios/reservas-mongo.js`: Operaciones asíncronas sobre la colección (`listar`, `obtenerPorId`, `crear`, `reemplazar`, `actualizar`, `eliminar`, `contar`). Valida el formato de `ObjectId` antes de consultar, arma explícitamente los objetos permitidos sin pasar `req.body` directo y ejecuta las escrituras con `runValidators: true`, `returnDocument: "after"` y `upsert: false`.
- `src/middleware/`:
  - `reservas.js`: Valida los campos obligatorios en `POST` (6 campos, rechazando `estado` o `_id`) y la base de `PUT`.
  - `cambios-reservas.js`: Controla que `PUT` incluya los 7 campos editables sin extras y que `PATCH` acepte únicamente `personas` y/o `estado`.
  - `solicitudes.js` y `errores.js`: Registro de peticiones y manejo centralizado de errores (`400` para entradas o IDs inválidos y JSON mal formado; `500` genérico sin exponer trazas ni credenciales).
- `src/controladores/reservas.js`: Lógica de respuesta para las vistas HTML (`/`, `/reservas`, `/reservas/nueva`, `/reservas/:id`), `/estado` y los endpoints JSON de la API.
- `src/rutas/`: Definición de rutas web (`reservas.js`) y de la API REST (`reservas-api.js`).

## Contratos HTTP y reglas de validación

### Endpoints de la API (`/api/reservas`)

| Método | Ruta | Comportamiento | Respuesta exitosa | Errores |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/reservas` | Devuelve el arreglo simple de reservas (admite `?sala=`) | `200` + arreglo JSON | `400` parámetro inválido |
| `GET` | `/api/reservas/:id` | Busca una reserva por identificador | `200` + reserva JSON | `400` ID inválido / `404` no encontrada |
| `POST` | `/api/reservas` | Crea una reserva con `estado: "pendiente"` por defecto | `201` + reserva + header `Location` | `400` datos inválidos o envío de `estado`/`_id` |
| `PUT` | `/api/reservas/:id` | Reemplaza los 7 campos editables conservando el mismo `id` | `200` + reserva actualizada | `400` campo faltante, extra o inválido / `404` ausente |
| `PATCH` | `/api/reservas/:id` | Modifica solo `personas` y/o `estado` dejando el resto igual | `200` + reserva actualizada | `400` cuerpo vacío, campo no permitido o inválido / `404` ausente |
| `DELETE` | `/api/reservas/:id` | Elimina físicamente el documento de la colección | `204` sin cuerpo | `400` ID inválido / `404` ausente |

### Reglas de datos

- `estudiante`: texto obligatorio (`trim`).
- `email`: texto obligatorio (`trim`) con `@`.
- `sala`: `Sala Norte`, `Sala Sur` o `Sala Multimedia`.
- `fecha`: texto obligatorio (`trim`).
- `turno`: `Mañana`, `Tarde` o `Noche`.
- `personas`: entero entre `1` y `6`. Se acepta como número o texto numérico no vacío verificando finitud, rango e integridad (se rechazan decimales, booleanos, arreglos u objetos).
- `estado`: `pendiente` o `confirmada` (en `POST` se asigna `pendiente` y no puede enviarlo el cliente; en `PUT` es obligatorio; en `PATCH` es opcional si se envía `personas`).

### Borrado físico vs. cambio de estado

- **Cambiar `estado` (`PUT` / `PATCH`):** Actualiza la situación de la reserva entre `"pendiente"` y `"confirmada"`, manteniendo el documento guardado en MongoDB, su `id`, su aparición en los listados y el conteo en `/estado`.
- **Eliminar (`DELETE`):** Borra el documento de la colección mediante `deleteOne`. Después de eliminarlo, cualquier `GET` o nuevo `DELETE` sobre ese `id` devuelve `404` y el total en `/estado` baja en uno.

## Ejemplos de solicitudes (Postman / PowerShell)

**POST `/api/reservas`**
```json
{
  "estudiante": "Ana Ejemplo",
  "email": "ana@example.com",
  "sala": "Sala Norte",
  "fecha": "2026-10-28",
  "turno": "Mañana",
  "personas": 2
}
```

**PUT `/api/reservas/:id`**
```json
{
  "estudiante": "Ana Ejemplo",
  "email": "ana@example.com",
  "sala": "Sala Norte",
  "fecha": "2026-10-28",
  "turno": "Mañana",
  "personas": 2,
  "estado": "confirmada"
}
```

**PATCH `/api/reservas/:id`**
```json
{
  "personas": 3
}
```

## Registro de pruebas realizadas

Pruebas ejecutadas sobre `http://localhost:3000` contra la base `reservas_salas_u9`:

| Caso | Solicitud | Resultado observado |
| :--- | :--- | :--- |
| Creación válida | `POST /api/reservas` (6 campos) | `201`, header `Location: /api/reservas/6b03ab76137a57421fcde188`, `estado: "pendiente"` |
| `POST` con campo prohibido | `POST /api/reservas` enviando `estado` | `400` sin crear documento |
| Reemplazo completo | `PUT /api/reservas/6b03ab76137a57421fcde188` (7 campos) | `200`, mismo `id`, `estado: "confirmada"` |
| `PUT` incompleto | `PUT` omitiendo `estado` | `400`, documento conservado sin cambios |
| Cambio parcial de `personas` | `PATCH /api/reservas/6b03ab76137a57421fcde188` con `{"personas": 3}` | `200`, `personas: 3` y conservación de `estado` y datos restantes |
| Cambio parcial de `estado` | `PATCH /api/reservas/6b03ab76137a57421fcde188` con `{"estado": "pendiente"}` | `200`, `estado: "pendiente"` y conservación de `personas: 3` |
| `PATCH` con campos inválidos | `{}`, `{"sala": "Sala Sur"}`, `{"_id": "..."}`, `{"$set": ...}` | `400` sin modificación |
| `PATCH` con valores fuera de regla | `personas` en `0`, `7`, `2.5`, `true`, `[]`, `{}` y `estado: "cancelada"` | `400` sin modificación |
| ID mal formado o JSON roto | `PATCH /api/reservas/123` y cuerpo JSON incompleto | `400` |
| ID válido inexistente | `PATCH /api/reservas/000000000000000000000000` | `404` sin crear documento |
| Eliminación física | `DELETE /api/reservas/6b03ab76137a57421fcde189` | `204` sin cuerpo, una reserva menos en `GET /api/reservas` |
| Repetir `DELETE` y consultar tras borrar | `DELETE` y `GET` sobre `6b03ab76137a57421fcde189` | `404` en ambos casos |
| Persistencia tras reinicio | Detener servidor (`Ctrl+C`), reiniciar y consultar `GET` y `/estado` | `6b03ab76137a57421fcde188` conserva `personas: 3` y `estado: "pendiente"`; el borrado sigue en `404`; `/estado` informa `totalReservas: 4` |
| Vistas HTML y formulario | Navegación por `/`, `/reservas`, `/reservas/nueva` y `/estado` | Funcionamiento correcto sincronizado con MongoDB |