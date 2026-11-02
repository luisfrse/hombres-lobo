# Hombres lobo / Homes llop

El clásico juego de roles (Castronegro / Mafia) para jugar **todos en la misma sala**:

- Una persona hace de **narrador** (no juega) y lleva la partida desde su panel `/narrador`. Para crear partidas necesita un **código de invitación** que le das tú desde `/admin` (como en Quest pública). Los jugadores solo necesitan el PIN de la partida.
- Los jugadores entran desde el móvil con el **PIN o el QR** y reciben su rol en secreto.
- El debate y la votación se hacen en voz alta; la app **reparte los roles, guía la noche paso a paso y anuncia el día**.
- Interfaz en **català y castellano** (selector CA | ES, o `?lang=ca` / `?lang=es`).

## Páginas

| Ruta | Para quién |
|---|---|
| `/` | Jugadores (PIN + nombre). `/?pin=123456` rellena el PIN (es lo que abre el QR) |
| `/narrador` | Narrador (pide un **código de invitación**) |
| `/admin` | Administrador (usuario cualquiera + `ADMIN_PASSWORD`): crea, copia, caduca, revoca y borra códigos |

## Roles

Aldeano (relleno), Lobo (1 a 10), Vidente, Bruja, Cazador, Cupido, Niña y Salvador. Cada rol se activa o desactiva en el panel del narrador y tiene un botón **ⓘ** que explica lo que hace. Cada jugador ve en su tarjeta (se toca para mostrarla u ocultarla) su rol **con la descripción de lo que hace**.

El **Alguacil** no es una carta: el narrador lo nombra durante el día (voto doble); si muere, designa sucesor.

La **Niña** no tiene paso propio en la noche: el narrador vigila en voz alta que no se note que espía.

Reglas del reparto: mínimo 4 jugadores; al menos 1 lobo; los lobos deben ser menos que el resto; lobos + roles especiales no pueden superar a los jugadores.

### Noche
Orden de los pasos (solo aparecen los roles que hay en la partida): Cupido (solo la primera noche) → Salvador → Vidente → Lobos → Bruja. Si el titular de un rol ya está eliminado, el panel lo avisa y el narrador hace igualmente la pantomima para no delatarlo. El Salvador no puede proteger a la misma persona dos noches seguidas. La Bruja ve la víctima de los lobos y tiene una poción de curación y otra de veneno, de un solo uso cada una.

### Día
Se anuncian las muertes con su causa (lobos, veneno, pena de amor, cazador, votación). Si muere el Cazador o el Alguacil, el narrador resuelve primero esa decisión. Después, votación en voz alta y el narrador marca al eliminado (o «Nadie»).

### Final
Gana el **pueblo** (no quedan lobos), los **lobos** (igualan en número al resto) o los **enamorados** (si son los dos últimos y de bandos distintos). Al acabar se revelan todos los roles y el narrador puede empezar otra partida con los mismos jugadores.

## Privacidad
Cada jugador recibe **solo su rol** (y, si es lobo, los nombres de los otros lobos; si está enamorado, el nombre de su pareja). El rol de los eliminados se muestra solo si el narrador deja marcada esa opción. Las partidas viven en memoria y se olvidan al cerrarlas o tras 6 h sin actividad. En disco solo se guardan los códigos de invitación (etiqueta, código, fechas y contador de partidas).

## Variables de entorno

| Variable | Por defecto | Qué hace |
|---|---|---|
| `ADMIN_PASSWORD` | aleatoria (sale en el log) | Contraseña de `/admin` |
| `DATA_DIR` | `./data` | Carpeta de la base de códigos (`lobo-codigos.db`). En Coolify: volumen en `/data` |
| `CONTACT_URL` | `https://luisfs.com` | Enlace «Solicítalo» de la pantalla de acceso |
| `MAX_PARTIDAS_POR_CODIGO` | 3 | Partidas abiertas a la vez por código |
| `PORT` | 3000 | Puerto |
| `MAX_PARTIDAS` | 30 | Partidas abiertas a la vez |
| `MAX_JUGADORES` | 30 | Jugadores por partida |
| `INACTIVIDAD_HORAS` | 6 | Horas sin actividad tras las que se cierra una partida |

## Puesta en marcha

```
npm install
ADMIN_PASSWORD=una-clave-larga npm start
```

En Coolify: repositorio nuevo, build con Nixpacks, puerto 3000, dominio propio (por ejemplo `lobo.luisfs.com`), variable `ADMIN_PASSWORD` y un volumen persistente montado en `/data` con `DATA_DIR=/data` (si no, los códigos se pierden al redesplegar).

## Seguridad
- Límites por IP en memoria (429/`demasiados_intentos`): 5 códigos de invitación erróneos cada 15 min, 5 contraseñas de `/admin` erróneas cada 15 min (el bloqueo se mantiene aunque se envíe la buena) y 40 PIN erróneos cada 10 min. Detrás de un proxy se confía en una sola cabecera `X-Forwarded-For`.
- Un código da una sesión de narrador de 12 h (en memoria). Revocar o borrar un código **cierra sus partidas abiertas** (avisando a los jugadores) e invalida sus sesiones; un código caducado deja de funcionar.
- Socket.IO solo acepta el `Origin` del propio sitio (o conexiones sin `Origin`).
- Cada partida tiene su propio token de narrador, aleatorio guardado en la pestaña (`sessionStorage`); el jugador, con un token propio en `localStorage` para reconectar tras recargar. Las acciones del narrador se comprueban en el servidor; los identificadores públicos de los jugadores no sirven para suplantarlos.
- Ritmo máximo de eventos por conexión, nombres saneados (sin caracteres de control ni de dirección de texto, 20 caracteres), CSP con scripts propios, `X-Frame-Options: DENY`.
- `/api/qr` solo genera códigos para partidas que existen.

## Idiomas
Todo el texto sale de `public/i18n.js` (generado a partir de `tools/claves.py` y `tools/motor.js`; si cambias textos, edita `tools/claves.py` y ejecuta `python3 tools/generar-i18n.py`). `npm test` comprueba que ca y es tienen las mismas claves y marcadores y que todas las claves usadas existen.

## Pruebas
`npm test` ejecuta: `test/simulacion.js` (partidas completas con sockets: privacidad, noche, cazador, enamorados, alguacil, brujería, reconexión), `test/i18n.js` y `test/navegador.js` (narrador + 4 móviles en Chromium, ⓘ, tarjeta de rol, cambio de idioma sin perder estado, sin errores de consola).
