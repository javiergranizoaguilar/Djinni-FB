---
title: "Djinni-FB. Plataforma web para jugar rol de mesa online"
subtitle: "Memoria Tecnica del Trabajo de Fin de Grado"
author: "Javier Granizo Aguilar"
date: "28 de mayo de 2026"
lang: es
geometry: margin=2.5cm
fontsize: 11pt
toc: true
toc-depth: 3
numbersections: true
---

# Datos de la entrega

| Campo | Valor                                                                        |
|---|------------------------------------------------------------------------------|
| Autor | Javier Granizo Aguilar                                                       |
| Titulacion | Grado Superior en DAW                                                        |
| Centro | Escuela de Arte de Granada                                                   |
| Tutor/a | Manuel Prieto Macias                                                         |
| Curso academico | 2025--2026                                                                   |
| Fecha de defensa | Jueves 28 de mayo                                                            |
| Repositorio | Djinni-FB (monorepo con `Djinni-B/` backend y `Djinni-F/` frontend)          |
| Stack | Symfony 8, PHP 8.4, MariaDB 10.11, React 19, Vite, Workerman, Docker Compose |

<div style="page-break-after: always;"></div>

# 1. Descripcion del proyecto

## 1.1 Que es Djinni-FB

Djinni-FB es una aplicacion web para jugar partidas de rol de mesa a distancia. Sustituye los tableros, miniaturas y hojas de personaje de papel por una mesa virtual (lo que en la comunidad se conoce como VTT, *virtual tabletop*), donde el director de juego prepara escenas con mapas, niebla de guerra y muros que bloquean la linea de vision, y los jugadores controlan sus personajes desde el mismo navegador con sincronizacion en tiempo real.

El nucleo del producto no es la simulacion de las reglas de un sistema concreto, sino el tablero compartido y la hoja de personaje editable. Esa decision la tome despues de los primeros prototipos, porque automatizar las reglas de D&D 5e en su totalidad daba para un TFG por si solo y, mas importante, ataba la herramienta a un unico sistema. Asi la aplicacion sirve igual de bien para una campana de D&D que para un sistema mas ligero, y son los jugadores quienes interpretan los resultados de las tiradas.

## 1.2 Objetivos

Los objetivos que me marque al empezar eran tres:

1. Construir un cliente de tablero virtual que se actualizara sin recargar para todos los jugadores conectados a la misma partida.
2. Modelar la informacion del personaje con suficiente profundidad para que el jugador no necesitara una hoja paralela en papel.
3. Tener el sistema desplegado de forma reproducible, sin pasos manuales que se le olvidaran al evaluador.

Los tres se cumplen. El segundo se quedo corto en algunas piezas como el inventario, donde funciona el CRUD basico pero no hay automatismos de carga maxima ni divisas; lo documento mas abajo como limitacion conocida.

## 1.3 Alcance funcional

Lo que esta dentro:

- Registro y autenticacion con JWT, con limitacion de intentos por IP y por usuario.
- Creacion y gestion de partidas. Cada partida tiene un token de invitacion que el director comparte por enlace.
- Editor de escenas con rejilla cuadrada, capas de fondo, jugador, GM, muros y niebla de guerra.
- Tokens con barras de contador enlazables a campos del personaje (vida, ki, mana, lo que el jugador defina).
- Sistema de vision por token con calculo de poligono de visibilidad por *raycasting* en cliente.
- Reglas, conos y aristas para medir distancias durante una partida.
- Chat de partida con persistencia y modo privado entre jugador y director.
- Hoja de personaje con caracteristicas, salvaciones, habilidades, ataques, hechizos, inventario y rasgos.
- Hoja de monstruo en paralelo, para que el director gestione enemigos.
- Sistema de roster por partida con carpetas, control delegado a jugadores y visibilidades selectivas.
- Subida de imagenes (mapa de escena, retrato del personaje, token, avatar) con validacion de MIME real y tope de tamano.

Lo que esta fuera, declarado de forma explicita y discutido en *Conclusiones*:

- Automatismos de reglas (resolucion completa de combate, gestion de turnos).
- Reconexion de WebSocket sin perdida de estado en escenarios con multiples nodos.
- Suite de tests automatica.
- Internacionalizacion. La interfaz esta solo en castellano.

## 1.4 Publico objetivo

Grupos de tres a seis personas que ya juegan rol de forma presencial y quieren mantener las partidas cuando no pueden coincidir en la misma habitacion. No es una herramienta para descubrir el rol de mesa, sino para que un grupo ya formado siga jugando. Eso explica decisiones de diseno: no hay tutoriales paso a paso, hay atajos de teclado en todas las acciones del tablero, y la curva de aprendizaje del director es deliberadamente mas pronunciada que la del jugador.

<div style="page-break-after: always;"></div>

# 2. Arquitectura del sistema

## 2.1 Vision general

El sistema se compone de cinco contenedores Docker que se levantan con un unico `docker compose up -d`:

| Servicio | Imagen | Puerto host | Funcion |
|---|---|---|---|
| `database` | `mariadb:10.11` | 3306 | Persistencia principal. |
| `php` | imagen propia (`docker/php/Dockerfile`) | interno 9000 | PHP-FPM 8.4 con la API Symfony. |
| `nginx` | `nginx:1.27-alpine` | 8000 | Servidor web que enruta a PHP-FPM. |
| `workerman` | misma imagen que `php` | 8081 | Servidor WebSocket por partida. |
| `frontend` | imagen propia con build de Vite | 5173 | SPA React servida como estaticos. |

El diagrama formal vive en `diagramas/arquitectura.mmd` y se exporta a PNG/PDF en el momento del empaquetado. En texto:

- El navegador del jugador descarga la SPA desde `nginx:5173`, hace peticiones HTTP JSON contra la API expuesta en `nginx:8000`, y abre una conexion WebSocket persistente contra `workerman:8081`.
- Las peticiones HTTP llevan un token JWT en la cabecera `Authorization: Bearer ...`. La SPA lo guarda en `localStorage` (`vtt_token`).
- El handshake del WebSocket envia ese mismo JWT como primer mensaje. Workerman lo valida con la clave publica antes de unir la conexion a una sala por partida.
- La base de datos vive en un volumen Docker llamado `db_data`. Las claves JWT se generan dentro del contenedor `php` en el primer arranque y se persisten en el volumen `jwt_keys`, compartido con `workerman` para que ambos firmen y validen con la misma pareja.

## 2.2 Por que esta separacion

La separacion entre API REST y servidor de WebSocket es la decision arquitectonica que mas tiempo me costo tomar. La opcion natural en Symfony es Mercure, que de hecho viene instalado por defecto en el esqueleto de Flex y aparece en `Djinni-B/composer.json` como `symfony/mercure-bundle`. Lo descarte y opte por Workerman por dos razones concretas:

Primero, el modelo de salas. Mercure es un *hub* de pub/sub con topicos por URL. Para meter logica de "solo los miembros de esta partida ven estos eventos y, ademas, los tokens en la capa GM no se envian a los jugadores", habria tenido que filtrar emisiones en el backend y aceptar que el cliente recibiera identificadores de eventos que no podia leer. Workerman me permite mantener un mapa en memoria `gameId -> [conexiones]` y filtrar en el servidor antes de emitir.

Segundo, el coste de tener un broker externo. Mercure se apoya en Caddy + un proceso aparte; Workerman es un proceso PHP largo que reutiliza el mismo Doctrine y las mismas entidades del resto de la aplicacion. En `Djinni-B/src/Command/ChatServerCommand.php` los mensajes se persisten directamente con el `EntityManager` y se reusan los repositorios.

El precio que pago: si la aplicacion creciera, este Workerman no escala horizontalmente porque el estado de salas vive en proceso. Un segundo `worker` partiria las conexiones. Lo documento como limitacion en el codigo (`worker->count = 1`) y en *Conclusiones*.

## 2.3 Backend Symfony

El backend sigue el patron MVC de Symfony con tres capas:

- **Controladores REST** en `Djinni-B/src/Controller/`. Todos llevan el prefijo `Api*` excepto los del subdominio de escena, que usan el prefijo `^/scene/api/` para separarlos en una firewall propia. Son finos: validan entrada, llaman a entidades y repositorios y serializan respuestas JSON.
- **Entidades Doctrine** en `Djinni-B/src/Entity/`. Llevan atributos `#[ORM\Column]`, relaciones declaradas, y constraints de validacion `#[Assert\Range]`, `#[Assert\GreaterThanOrEqual]` cuando aplica. Las migraciones autogeneradas viven en `Djinni-B/migrations/`.
- **Servicios de dominio** en `Djinni-B/src/Security/` (validador de uploads, comprobador de pertenencia a sesion, voters). Se inyectan via constructor en los controladores.

La autenticacion la lleva `lexik/jwt-authentication-bundle`. Hay tres firewalls definidos en `Djinni-B/config/packages/security.yaml`:

- `login` para `^/api/login`, sin autenticacion, con `login_throttling` configurado a 5 intentos por 15 minutos.
- `api_scene` para `^/scene/api`, con autenticacion JWT, separado para poder configurar reglas distintas en el futuro.
- `api` para `^/api`, autenticacion JWT.

La razon de tener dos firewalls JWT y no uno solo es operativa: las rutas del editor de escena (`fog`, `walls`) se llaman varias veces por segundo durante una sesion activa, y separarlas me permite ajustar limites y politicas de forma aislada sin tocar el resto.

## 2.4 Frontend React

El frontend es una SPA en `Djinni-F/` construida con Vite. No tiene Twig en ningun punto. Los componentes se organizan asi:

- `src/pages/` contiene las paginas con rutas en React Router: listas de partidas, personajes y monstruos, y modales pesados de edicion (`EditCharacterModal`, `EditMonsterModal`).
- `src/ingame/` agrupa los componentes que viven dentro del tablero virtual: selector de escenas, paleta de tokens, panel de roster, pestana de chat.
- `src/components/` son primitivos reutilizables (`Modal`, `Toast`).
- `src/control_user/` son login y registro.
- `src/config/api.js` centraliza las URLs y lee `import.meta.env.VITE_API_URL` y `VITE_WS_URL`. Ningun componente debe hardcodear `http://localhost:8000`; en su momento varios lo hacian, lo cuento en la seccion de errores cometidos.

El tablero se dibuja con `react-konva`, una capa fina sobre Konva. Use react-konva en vez de SVG por tres motivos: el rendimiento de capas con varios cientos de elementos arrastrables, el modelo declarativo encaja con React, y la API de Konva facilita acciones que en SVG requieren bastante trabajo (transformaciones, zoom, *hit-detection* por capa).

## 2.5 Capas del tablero

El tablero (`VttBoard.jsx`) renderiza cinco capas Konva:

1. `background`: imagen de mapa de la escena.
2. `user`: tokens de jugador (visibles para todos los participantes).
3. `gm`: tokens del director, filtrados antes de salir del servidor para no exponerlos a los jugadores.
4. `walls`: muros para la linea de vision; capa visible solo al director.
5. `fog`: niebla de guerra; pintado revelado y oculto, capa visible al director con render adaptado en cliente para el jugador.

La capa `gm` se filtra en dos sitios. El primero, en el servidor, en `SceneTokenController.php`, donde se comprueba si el usuario es director antes de devolver tokens de esa capa. El segundo, en el cliente, descartando los que se cuelen. La defensa en profundidad es deliberada: un fallo en una de las dos capas no expone el otro flanco.

<div style="page-break-after: always;"></div>

# 3. Modelo de datos

## 3.1 Diagrama E/R

El diagrama completo esta en `diagramas/er.mmd` en formato Mermaid `erDiagram`. Para la version impresa, se exporta a PNG con `mmdc` (Mermaid CLI) o se renderiza desde un visor compatible.

La estructura general:

- Un `User` se une a multiples partidas a traves de la tabla pivote `UserGameSession`, que ademas guarda el booleano `is_dm`.
- Una `GameSesion` agrupa varias `Scene`. Cada escena guarda dimensiones de rejilla y dos campos JSON, `fog_data` y `walls_data`, con el estado de niebla y muros.
- Sobre cada escena pueden vivir `SceneToken` y `SceneImage`. Los tokens guardan posicion en pixeles y en celdas, capa, contadores, auras y radio de vision.
- `CharacterSheet` es la hoja del personaje, asociada a la partida por `gamesesion`. Para compartirla entre varios usuarios existe `CharacterSheetUser` (mismo patron que `MonsterUser` para los monstruos). La hoja se descompone en `Attack`, `Ability`, `Inventory` y `Spell` como entidades hijas, mas un enum `Proficency` que no tiene endpoint propio.
- `GameMessage` registra el chat por partida. Los mensajes privados director-jugador (modo *gm*) no se persisten.
- `RosterFolder`, `RosterItem` y `RosterVisibility` modelan el panel lateral de participantes y monstruos visibles. La visibilidad es por concesion explicita del director.

## 3.2 Diccionario de datos

A continuacion se documentan las tablas principales. Las columnas omitidas son auxiliares (timestamps, claves foraneas evidentes) y se ven en las migraciones de `Djinni-B/migrations/`.

### `user`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | INT PK auto | |
| `username` | VARCHAR(255) | Maximo enforced en API (50). |
| `email` | VARCHAR(255) | Unico de facto por endpoint. |
| `password` | VARCHAR(255) | Hash con `password_hashers: auto` (bcrypt o argon segun PHP). |
| `avatar_url` | VARCHAR(255) NULL | Ruta relativa bajo `public/uploads/avatars/`. |
| `roles` | JSON | Array de roles Symfony. `ROLE_USER` siempre presente por defecto. |
| `datetime` | DATETIME_IMMUTABLE | Fecha de alta. |

### `game_sesion`

Nota: el nombre lleva una `s`. Es un error tipografico arrastrado desde la primera migracion. Mantenerlo es preferible a renombrar todo el codigo: el termino aparece en mas de cien sitios.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | INT PK auto | |
| `title` | VARCHAR(255) | |
| `is_active` | TINYINT(1) | |
| `invitation_token` | VARCHAR(255) NULL | Generado con `random_bytes(16)` hexadecimal. |
| `img_path` | VARCHAR(255) NULL | Portada de la partida. |
| `created_at` | DATETIME_IMMUTABLE | |

### `user_game_session`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | INT PK | |
| `user_id` | INT FK -> `user.id` | |
| `game_session_id` | INT FK -> `game_sesion.id` | |
| `is_dm` | TINYINT(1) | Decide si el usuario es director en esa partida. |

### `scene`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | INT PK | |
| `session_id` | INT FK -> `game_sesion.id` | |
| `name` | VARCHAR | |
| `grid_width` / `grid_height` | INT | Limitados en controlador a 1..200. |
| `fog_data` | JSON | Estructura `{ mode: 'fog', revealed: [...] }`. Tope ~256 KB. |
| `walls_data` | JSON | Estructura `{ walls: [{ id, x1, y1, x2, y2 }, ...] }`. Tope ~256 KB. |

### `scene_token`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | INT PK | |
| `scene_id` | INT FK -> `scene.id` | |
| `token_id` | INT FK -> `token.id` NULL | Plantilla reutilizable. |
| `kind` | VARCHAR | `character`, `monster` o `custom`. |
| `entity_id` | INT NULL | Apunta a `character_sheet` o `monster` segun `kind`. |
| `col` / `row` | INT | Posicion en rejilla. Validados >= 0. |
| `x` / `y` | INT | Posicion en pixeles dentro del lienzo. |
| `width` / `height` | INT | En pixeles. |
| `layer` | VARCHAR | `background`, `user`, `gm`. |
| `image_url` | VARCHAR NULL | |
| `counters` | JSON | Lista de barras `{ label, current, max, color, linked_field }`. |
| `auras` | JSON | Lista `{ feet, color, shape, opacity }`. |
| `vision_radius` | INT | En pies. Limite 0..500. |
| `owner_id` | INT FK -> `user.id` | Quien lo creo. |
| `controlled_by_id` | INT FK -> `user.id` NULL | Jugador delegado por el director. |

### `character_sheet`

La hoja de personaje es la tabla con mas columnas, alrededor de cincuenta. Las relevantes:

- Cabecera (`name`, `race`, `subrace`, `alignment`, `level`).
- Combate (`hp`, `max_hp`, `armor_class`, `ac_mode`, `ac_config`, `hit_dice`).
- Salvaciones (`sav_str`, `sav_dex`, `sav_con`, `sav_int`, `sav_wis`, `sav_cha` mas su `_mod` para modificador manual).
- Dieciocho habilidades de D&D 5e, cada una con su columna de pericia y su `_mod` opcional.
- Vision (`vision` en pies), valores por defecto del token (`default_auras`, `default_token`, `default_token_data`).
- Recursos magicos (`spell_slots`, `spellcasting_abillity`; *sic* en este ultimo, error tipografico arrastrado).

### `game_message`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | INT PK | |
| `game_sesion_id` | INT FK | |
| `sender_id` | INT FK -> `user.id` | |
| `content` | TEXT | |
| `created_at` | DATETIME_IMMUTABLE | |

### Roster

`roster_folder` (`id`, `game_sesion_id`, `parent_id`, `name`), `roster_item` (`id`, `folder_id`, `kind`, `entity_id`, `name`, `color`, `image_url`, `controlled_by_user_id`, `created_by_id`) y `roster_visibility` (`id`, `roster_item_id`, `user_id`). La tabla `roster_visibility` es una concesion: si existe una fila, el jugador ve el item; si no existe y el item no lo creo el, no lo ve.

## 3.3 Migraciones

Las veinte migraciones de `Djinni-B/migrations/` se generaron con `php bin/console doctrine:migrations:diff` a medida que el modelo crecio. La numeracion va por fecha (`VersionAAAAMMDDHHMMSS`). No edite migraciones aplicadas; siempre genere una nueva. El comando `doctrine:schema:validate` reporta cero drift entre entidades y esquema.

<div style="page-break-after: always;"></div>

# 4. Especificaciones tecnicas

## 4.1 Stack y versiones

| Capa | Tecnologia | Version | Por que esta |
|---|---|---|---|
| Lenguaje servidor | PHP | 8.4 | Requisito Symfony 8. |
| Framework servidor | Symfony | 8.0 | Madurez, ecosistema de bundles, atributos PHP. |
| ORM | Doctrine ORM | 3.6 | Estandar de facto en Symfony, migraciones automaticas. |
| Auth | `lexik/jwt-authentication-bundle` | 3.2 | JWT cifrados con RSA, sin sesion. |
| WebSocket | Workerman | 5.1 | Servidor PHP de larga vida, reusa entidades Doctrine. |
| BD | MariaDB | 10.11 | Compatible MySQL, libre, bien dockerizada. |
| Lenguaje cliente | JavaScript ES2022 | | |
| Framework cliente | React | 19.2 | Modelo declarativo, ecosistema. |
| Bundler | Vite | 7.2 | HMR rapido, build pequeno, sin webpack. |
| Canvas | Konva + react-konva | 10.2 / 19.2 | Rendimiento con muchos elementos, capas. |
| Routing | react-router-dom | 7.13 | Estandar React. |
| HTTP cliente | Axios | 1.13 | Interceptores para JWT y 401. |
| Estilos | Tailwind CSS | 3.4 | *Utility-first*, evita CSS huerfano. |
| Contenedores | Docker Compose | v2 | Despliegue reproducible. |

## 4.2 Justificacion de elecciones no obvias

**React frente a Twig**. El enunciado admitia ambas. Twig habria sido mas corto, pero el tablero virtual exige sincronizacion en tiempo real con cientos de eventos por segundo (arrastres, ruler, paint de niebla). Devolver fragmentos HTML cada vez es inviable. Una SPA con estado en cliente es la unica forma sensata.

**Tailwind frente a CSS modular**. Pase los primeros mil pixeles con CSS modules y termine con archivos sueltos repetidos. Migre a Tailwind y la consistencia visual mejoro porque las clases utilitarias son su propio sistema de diseno.

**Workerman frente a Mercure**. Ya explicado en *Arquitectura*. En resumen: control fino del *fan-out* por sala y posibilidad de filtrar antes de emitir.

**JWT frente a sesiones**. Una SPA en otro origen que el backend (puertos distintos en `localhost`) obliga a CORS y cookies *cross-site* con `SameSite=None`. JWT en cabecera evita ese laberinto y permite que el WebSocket reuse el mismo token en el handshake.

**MariaDB frente a PostgreSQL**. Las dos servian. Elegi MariaDB porque ya tenia un `compose.yaml` heredado del esqueleto de Symfony Flex con MariaDB configurada, y por las herramientas de inspeccion que conozco (DBeaver, phpMyAdmin). PostgreSQL habria sido igual de valido.

## 4.3 Dependencias relevantes del backend

Lista no exhaustiva extraida de `Djinni-B/composer.json`:

- `lexik/jwt-authentication-bundle`: emision y validacion de JWT.
- `nelmio/cors-bundle`: politica CORS configurable por regex.
- `symfony/rate-limiter`: limitador de intentos en login, registro y subidas.
- `symfony/security-bundle`: voters, firewalls, hashing.
- `symfony/validator`: anotaciones `#[Assert]` en entidades.
- `workerman/workerman`: bucle de eventos para el WebSocket.

## 4.4 Dependencias relevantes del frontend

Extraidas de `Djinni-F/package.json`:

- `react` y `react-dom` 19.2.
- `react-konva` y `konva` para el canvas.
- `react-router-dom` 7.13.
- `axios` para HTTP.
- `tailwindcss` y los plugins `@tailwindcss/forms` y `@tailwindcss/container-queries`.

## 4.5 Seguridad

El enunciado pide implementacion robusta del componente de seguridad de Symfony. Lo que se implemento:

- Contrasenas: hash con la configuracion `auto` de Symfony, que selecciona Argon2id o Bcrypt segun la version de PHP. Longitud minima 12 caracteres validada en backend (`ApiUserController`) y en cliente.
- JWT con RSA. Las claves se generan en el primer arranque del contenedor `php` y se guardan en el volumen `jwt_keys` para sobrevivir reinicios.
- Limitacion de fuerza bruta. Login: 5 intentos por IP+email cada 15 minutos via `login_throttling`. Registro: 3 por hora por IP. Subidas: 30 por minuto por usuario. Configurado en `Djinni-B/config/packages/rate_limiter.yaml`.
- Validacion de subidas. El helper `App\Security\UploadValidator` comprueba MIME real (no la cabecera enviada por el cliente), tipo dentro de una lista blanca (`image/png|jpeg|webp|gif`) y tamano maximo de 5 MB. Tambien protege `unlink()` contra *path traversal* con `pathIsWithin()`.
- Control de acceso por sesion. `App\Security\SessionAccessChecker` centraliza la comprobacion de pertenencia y de rol director, y se inyecta en todos los controladores. Las cuatro clases `Voter` del directorio `Djinni-B/src/Security/Voter/` estan registradas para nuevos endpoints; los antiguos siguen con el patron explicito de `assertMemberOfSession` / `assertDm`.
- Interceptor de respuesta 401 en el cliente. Cuando el backend devuelve 401, el `axiosConfig.js` borra el token, emite un evento `auth-change` y redirige a `/login`.
- Capas de validacion en entidad. Las entidades llevan `#[Assert\Range]` y `#[Assert\GreaterThanOrEqual]` como defensa en profundidad sobre los *clamp* del controlador.

Una decision que conviene defender ante el tribunal: el enunciado menciona "gestion de roles y permisos (ej. `ROLE_USER`, `ROLE_ADMIN`)". El sistema usa `ROLE_USER` para usuarios autenticados, pero no tiene `ROLE_ADMIN` global. El rol que importa en el dominio (director de partida) es por sesion, no por usuario, porque alguien puede ser director en una partida y jugador en otra. Eso obligo a modelarlo con el booleano `is_dm` en la tabla pivote `user_game_session` en lugar de con un rol Symfony global. El componente de seguridad sigue activo, simplemente el rol no vive en la tabla `user.roles` sino en el pivote.

## 4.6 Validacion en cliente y servidor

El enunciado pide validacion doble. En cliente, los formularios usan validacion HTML5 (`required`, `type="email"`, `minlength`) reforzada por componente cuando hace falta (el formulario de registro comprueba contrasena igual entre los dos campos antes de enviar). En servidor, ademas del decorador `#[Assert]` de las entidades, los controladores hacen *clamp* de rangos numericos (HP 0..999, vision 0..500, rejilla 1..200) para que un cliente modificado no pueda escribir valores fuera de rango.

Una nota honesta: el proyecto no usa el componente `symfony/form` en sentido estricto. El stack es API REST y los formularios viven en React. Lo que cumple la finalidad de Symfony Forms (mapeo, validacion, errores) lo hace una combinacion de deserializacion JSON manual mas `Validator`. Es funcionalmente equivalente pero formalmente distinto.

<div style="page-break-after: always;"></div>

# 5. Manual de despliegue

## 5.1 Requisitos del evaluador

Un equipo con Docker Engine y Docker Compose v2. Nada mas. No hace falta PHP, ni Composer, ni Node, ni `nvm`, ni MariaDB local.

## 5.2 Pasos

Desde la raiz del proyecto descomprimido:

```
docker compose up -d
```

Esto realiza, en una sola orden:

1. Descarga las imagenes base (`mariadb:10.11`, `nginx:1.27-alpine`, `node:20-alpine`, `php:8.4-fpm-alpine`).
2. Construye dos imagenes propias: `djinni_php` y `djinni_front`.
3. Arranca cinco contenedores (`djinni_db`, `djinni_php`, `djinni_nginx`, `djinni_ws`, `djinni_front`).
4. En el `entrypoint` del contenedor `djinni_php`:
   - Instala las dependencias de Composer si el volumen `backend_vendor` esta vacio.
   - Genera la pareja de claves JWT si no existe.
   - Espera hasta que MariaDB acepte conexiones.
   - Crea la base de datos `app` si no existe.
   - Aplica las migraciones pendientes.
   - Carga los usuarios y la partida de demostracion (idempotente; si ya existen, no hace nada).
   - Limpia la cache de Symfony y ajusta permisos en `var/` y `public/uploads/`.

Una vez levantado, los servicios estan en:

| Servicio | URL |
|---|---|
| Frontend SPA | `http://localhost:5173` |
| API REST | `http://localhost:8000` |
| WebSocket | `ws://localhost:8081` |
| MariaDB | `localhost:3307` (usuario `app`, contrasena `app`, base `app`) |

## 5.3 Usuarios de prueba

Cargados automaticamente por el comando `app:load-demo` en el primer arranque:

| Email | Contrasena | Rol en la partida demo |
|---|---|---|
| `dm@djinni.local` | `DungeonMaster1!` | Director (DM) |
| `jugador@djinni.local` | `PartyMember1!` | Jugador |

Ambos cumplen la politica de contrasenas de 12 caracteres minimo. La partida `Partida de demostracion` aparece en la lista de partidas de los dos usuarios nada mas iniciar sesion.

## 5.4 Comandos utiles

Estos comandos se ejecutan desde la raiz del repo:

```
docker compose logs -f djinni_php          # ver logs de Symfony
docker compose logs -f djinni_ws           # ver logs del WebSocket
docker compose exec djinni_php bash        # entrar al contenedor de PHP
docker compose exec djinni_db mariadb -uapp -papp app   # consola MariaDB
docker compose down                        # parar contenedores
docker compose down -v                     # parar y borrar volumenes (BD + claves)
```

## 5.5 Reset completo

Si el tribunal quiere partir de cero:

```
docker compose down -v
docker compose up -d
```

El borrado de volumenes (`-v`) elimina la base de datos y las claves JWT. El siguiente `up -d` regenera todo en un par de minutos.

<div style="page-break-after: always;"></div>

# 6. Pruebas y verificacion

## 6.1 Lo que se ha probado

Las pruebas durante el desarrollo fueron manuales y de aceptacion. Use dos navegadores en paralelo (uno como director, otro como jugador) para cada flujo critico:

- Registro y login.
- Creacion de partida, unirse con token de invitacion.
- Crear escena, dibujar muros, pintar niebla.
- Spawn de token desde el roster, arrastrar, ver la posicion sincronizada en el otro navegador.
- Editar la hoja de personaje, comprobar autosave (1,5 s de *debounce*) y *flush* al cerrar el modal.
- Lanzar tiradas desde la hoja al chat publico y al chat privado director-jugador.
- Subir imagen de mapa, comprobar validacion de MIME real.

## 6.2 Lo que no esta probado de forma automatica

No hay suite de tests automatica. Es la limitacion mas importante del proyecto y la reconozco. Un TFG industrial deberia tenerla; el mio no llego a tiempo. La carpeta `Djinni-B/tests/` solo contiene `bootstrap.php`. Para una v2, lo primero seria un puado de tests funcionales con `WebTestCase` cubriendo el flujo de autenticacion y un test E2E con Playwright cubriendo el flujo critico de partida.

## 6.3 Endurecimiento de seguridad realizado

Durante las ultimas semanas hice un repaso de seguridad sistematico, partiendo de una lectura cruzada del codigo con dos navegadores y un proxy interceptor. El registro de hallazgos vivio en un fichero `AUDIT_FIXES.md` en la raiz del repo mientras quedaban entradas abiertas; cuando todas las criticas se cerraron, lo retire para no dejar documentacion estancada conviviendo con el codigo ya corregido. Lo que se trato:

- Tres vulnerabilidades criticas de IDOR (borrado de token, lectura de mensajes y creacion de escena sin comprobar permisos) cerradas.
- Subida de archivos endurecida (MIME real, lista blanca, tope de tamano, proteccion contra *path traversal*).
- Rate limiting en login, registro y subidas.
- Modales con `role="dialog"`, foco capturable y cierre con `Esc`.
- Centralizacion del control de acceso en `SessionAccessChecker`.

Quedan asuntos abiertos como el *split* de `EditCharacterModal` en pestanas, el *split* de `VttBoard` en componentes Konva memoizados, y la migracion del WebSocket a Redis para escalado horizontal. Los marque de forma explicita como fuera de alcance y los recojo en *Trabajo futuro*.

<div style="page-break-after: always;"></div>

# 7. Conclusiones y trabajo futuro

## 7.1 Lecciones aprendidas

Hacer la dockerizacion al final fue un error. Cuando arranque el TFG levantaba los servicios a mano con `./start.sh`, y eso me convino para iterar rapido. Pero el enunciado obliga a `docker compose up -d` sin pasos manuales, y empaquetarlo en la ultima semana del proyecto fue prisa innecesaria. Si rehiciera el TFG, empezaria por el `docker-compose.yaml` el primer dia.

Trabajar con tipos JSON en columnas de MariaDB (la niebla, los muros, los contadores de tokens, los slots de hechizo) es comodo en cliente y horrible para auditar en consola. Si volviera a empezar, modelaria al menos los muros como tabla normalizada `wall (id, scene_id, x1, y1, x2, y2)`. El sistema de niebla podria seguir siendo JSON porque las consultas SQL no lo necesitan, pero los muros si.

El sistema de roster crecio mas de lo que pensaba. Empezo siendo una lista plana y termine necesitando carpetas anidadas, control delegado y visibilidades selectivas. Es la pieza con mas valor anadido del producto despues del tablero, y tambien la mas dificil de explicar a un usuario nuevo. Cualquier mejora futura de UX deberia empezar por ahi.

## 7.2 Errores cometidos durante el desarrollo

Tres errores que conviene mencionar porque son los que mas tiempo me costaron:

1. **Hardcodear `http://localhost:8000` en treinta archivos del frontend**. Funcionaba en local hasta que intente cambiar de puerto. La migracion a `VITE_API_URL` la hice tarde y mal; necesite varias pasadas para limpiar todas las ocurrencias.
2. **No filtrar tokens GM en el servidor**. Los filtraba solo en cliente al principio, lo cual es exactamente el patron que cualquier curso de seguridad te ensena a no hacer. Lo descubri auditando con dos navegadores y `Burp`.
3. **Generar claves JWT en disco fuera de un volumen Docker en los primeros intentos**. Al reiniciar el contenedor, los tokens emitidos antes dejaban de ser validos. El volumen `jwt_keys` resuelve eso.

## 7.3 Lo que dejaria para una v2

- Tests automaticos. WebTestCase para el backend, Playwright para el flujo E2E principal.
- Migracion del estado de salas de Workerman a Redis para soportar mas de un *worker* y reconexion sin perdida de estado.
- Reconexion de WebSocket con *replay* de eventos perdidos (hoy hay backoff exponencial pero los eventos entre desconexion y reconexion se pierden).
- `EditCharacterModal` partido en pestanas. El componente tiene mas de mil lineas y mezcla combate, hechizos, inventario y rasgos.
- `VttBoard` partido en subcomponentes Konva memoizados. Hoy es un componente unico responsable de cinco capas, ruler, niebla, muros, eventos globales y autosaves.
- Internacionalizacion. La interfaz solo esta en castellano.
- Sistema de macros para tiradas reutilizables.
- Importacion de hojas desde formatos comunes (D&D Beyond, FoundryVTT) en lugar de teclear todo a mano.

## 7.4 Reflexion final

Empece este TFG sin saber muy bien si era abarcable. Lo es, pero solo si se acepta que algunas piezas tienen que quedar como prototipos funcionales y no como producto. El tablero virtual y la hoja de personaje estan en un nivel que considero suficientemente cercano a un producto real para defenderlo. El roster y el sistema de control delegado tambien. La parte que mas distancia tiene respecto a un producto comercial es la inexistencia de tests automaticos y la dependencia de un unico nodo Workerman; eso lo asumo y lo declaro.

<div style="page-break-after: always;"></div>

# 8. Apendices

## 8.1 Estructura del repositorio

```
/
├── docker-compose.yaml      <- punto de entrada unico
├── docker/
│   ├── php/{Dockerfile, entrypoint.sh}
│   ├── nginx/backend.conf
│   └── frontend/{Dockerfile, nginx.conf}
├── Djinni-B/                <- backend Symfony
│   ├── src/
│   │   ├── Controller/      <- Api*, Scene*, Roster*
│   │   ├── Entity/          <- 23 entidades Doctrine
│   │   ├── Repository/
│   │   ├── Security/        <- SessionAccessChecker, UploadValidator, Voter/
│   │   └── Command/         <- ChatServerCommand (Workerman), LoadDemoCommand
│   ├── config/              <- bundles, packages, security.yaml
│   └── migrations/          <- 20 migraciones autogeneradas
└── Djinni-F/                <- frontend React
    └── src/
        ├── pages/
        ├── ingame/
        ├── components/
        ├── control_user/
        ├── config/api.js
        └── hooks/
```

## 8.2 Endpoints REST principales

Lista resumida; el detalle vive en los controladores:

- `POST /api/login_check` — login, devuelve JWT.
- `POST /api/register` — alta de usuario.
- `GET  /api/user/me` — datos del usuario autenticado.
- `GET  /api/game/sesion/my-games` — partidas del usuario.
- `POST /api/game/sesion/create` — crear partida.
- `POST /api/game/sesion/join/{token}` — unirse a partida por invitacion.
- `GET  /api/game/{gameId}/active-scene` — escena activa.
- `POST /api/game/{gameId}/scenes` — crear escena.
- `PUT  /scene/api/scenes/{id}/fog` — actualizar niebla.
- `PUT  /scene/api/scenes/{id}/walls` — actualizar muros.
- `POST /api/scene-token` — spawnear token.
- `GET  /api/character/my-characters` — personajes propios.
- `GET  /api/game/{gameId}/messages` — historial de chat.
- `GET  /api/game/{gameId}/roster` — panel lateral de roster.

## 8.3 Protocolo WebSocket

Mensajes JSON sobre la conexion WebSocket en `ws://localhost:8081`:

- Cliente -> servidor: `auth`, `message`, `message_gm`, `token_move`, `scene_token_created`, `scene_token_updated`, `scene_token_deleted`, `scene_image_*`, `scene_fog_updated`, `scene_walls_updated`, `token_path_shown`.
- Servidor -> cliente: las mismas con *fan-out* segun la politica de cada evento (todos en la sala, todos excepto el emisor, o solo emisor y director).

El detalle vive en `CLAUDE.md` seccion *Real-time strategy* y en `Djinni-B/src/Command/ChatServerCommand.php`.

## 8.4 Bibliografia

[1] Symfony SAS. *Symfony documentation*, version 8.0. https://symfony.com/doc/8.0

[2] Doctrine Project. *Doctrine ORM documentation*, version 3.6. https://www.doctrine-project.org/projects/doctrine-orm/en/current/

[3] Lexik. *LexikJWTAuthenticationBundle*. https://github.com/lexik/LexikJWTAuthenticationBundle

[4] Workerman Foundation. *Workerman documentation*, version 5. https://www.workerman.net/doc/workerman/

[5] Meta Platforms. *React documentation*, version 19. https://react.dev/

[6] Vite contributors. *Vite documentation*, version 7. https://vite.dev/

[7] Konva contributors. *Konva.js documentation*. https://konvajs.org/

[8] Tailwind Labs. *Tailwind CSS documentation*, version 3.4. https://tailwindcss.com/docs

[9] OWASP Foundation. *Application Security Verification Standard*, version 4.0.3. https://owasp.org/www-project-application-security-verification-standard/

[10] B. Bahree, A. Sermersheim. *JSON Web Token (JWT) — RFC 7519*. IETF, 2015. https://datatracker.ietf.org/doc/html/rfc7519
