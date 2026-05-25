# Guion de la demostracion en vivo

Tiempo objetivo: 6 minutos. Cronometrar en ensayo. Si en el minuto 4 no se ha llegado al spawn de tokens, saltar la parte del chat privado.

## Preparacion antes de empezar

1. Tener dos ventanas de navegador abiertas, una al lado de la otra (mejor que dos pestanas), redimensionadas a la mitad de la pantalla. Una para el director, otra para el jugador.
2. Tener una terminal visible con `docker compose ps` ejecutado, mostrando los cinco contenedores en `running`.
3. Tener una imagen JPG o PNG en el escritorio para arrastrarla como mapa de escena (cualquier imagen vale; un mapa de mazmorra queda mejor para la audiencia).
4. Asegurarse de que `docker compose down -v && docker compose up -d` se hizo al menos una vez antes del ensayo. El primer arranque tarda 2-3 minutos por la build; el segundo, 15 segundos.

## Paso a paso

### 0:00 - 0:30. Punto de partida

> "Antes de empezar quiero ensenar que la aplicacion ya esta corriendo en mi maquina con un unico comando."

Mostrar la terminal con `docker compose ps`. Senalar los cinco contenedores: db, php, nginx, ws, frontend. Mencionar que el tribunal solo necesito ejecutar `docker compose up -d`.

### 0:30 - 1:00. Login director

Abrir la primera ventana en `http://localhost:5173`. Mostrar la pagina de login. Introducir `dm@djinni.local` / `DungeonMaster1!`. Senalar al cargar la lista de partidas:

> "Estos usuarios los carga automaticamente el contenedor de PHP en el primer arranque mediante el comando `app:load-demo`. El tribunal no tiene que registrarlos."

### 1:00 - 1:30. Entrar en la partida

Click en "Partida de demostracion". Se abre el tablero virtual. Senalar:

- La barra lateral derecha con escenas, tokens, roster, chat.
- El lienzo central, vacio porque aun no hay escena.

### 1:30 - 2:30. Crear escena y pintar muros

Crear escena nueva ("Sala del trono"), poner rejilla 30x20. Subir imagen de fondo. Mostrar como sube el archivo y aparece en el tablero.

Activar la herramienta de muros. Dibujar tres o cuatro segmentos. Senalar:

> "Estos muros solo los ve el director. La capa de muros bloquea la linea de vision del jugador cuando active la niebla en el siguiente paso."

### 2:30 - 3:30. Niebla y vision

Activar herramienta de niebla. Pintar un rectangulo grande tapando toda la escena. Senalar:

> "Lo que esta en niebla, el jugador no lo ve. Cuando un token con vision entre, se calcula el poligono de visibilidad por raycasting en el cliente y se revela solo lo que el token puede ver."

### 3:30 - 4:30. Segunda ventana, jugador

Abrir la segunda ventana en `http://localhost:5173`. Login como `jugador@djinni.local` / `PartyMember1!`. Entrar en la misma partida.

Senalar al tribunal:

- La ventana del jugador no ve los muros.
- La ventana del jugador ve la niebla como un velo, no como un rectangulo descubierto.

### 4:30 - 5:30. Spawn y arrastre

En la ventana del director: spawnear un token de personaje. Arrastrarlo por el tablero. Senalar a la ventana del jugador como se mueve en tiempo real.

> "Esto va por WebSocket. El cliente que mueve manda un evento `token_move` al servidor Workerman, que lo retransmite a todos los conectados en la sala excepto al emisor, para evitar el efecto rebote."

Mover el token hacia los muros. Ensenar como la vision se actualiza y como, desde la ventana del jugador, partes de la sala se revelan.

### 5:30 - 6:00. Chat publico y privado

En la ventana del director: abrir la hoja del personaje (doble click sobre el token). Tirar un ataque al chat publico. Mostrar el mensaje apareciendo en las dos ventanas.

Cambiar el modo de envio a "GM". Tirar de nuevo. Mostrar que el mensaje **solo** aparece en la ventana del director (en su propio chat) y, si hubiera otro director, en la suya. La ventana del jugador no lo ve.

> "Los mensajes en modo GM no se persisten en la base de datos. Son efimeros. Eso es deliberado: a veces el director quiere tirar algo en privado y no quiere que quede en el historial."

## Plan B si algo falla

| Si falla | Que hacer |
|---|---|
| `docker compose up -d` no levanta a tiempo. | Cambiar al backup ya levantado en otra terminal. Tenerlo preparado. |
| WebSocket no conecta. | Mostrar `docker compose logs djinni_ws`. Suele ser que el primer login se hizo antes de que Workerman acabara su arranque. |
| El token no se mueve para el otro usuario. | Refrescar la ventana del jugador (F5). El estado se recarga del backend. Mencionar que la reconexion sin perdida de estado es trabajo futuro. |
| Una imagen no sube. | Mostrar la validacion MIME funcionando. Explicar que ese 400 es deseable, no un bug. |

## Despues de la demo

Saltar a la diapositiva de Conclusiones. No volver a la app a menos que el tribunal lo pida en preguntas.

## Preguntas que casi seguro va a hacer el tribunal

1. **"Por que no usaste Mercure si Symfony lo trae?"** Respuesta en *Arquitectura* de la memoria: control fino del *fan-out* por sala y filtrado antes de emitir.
2. **"Que pasa si dos directores editan la misma escena a la vez?"** El ultimo escribe gana. No hay CRDT ni *locking*. Es una limitacion conocida.
3. **"Como gestionas la sesion en el WebSocket?"** Handshake con el mismo JWT que la API, validacion con la clave publica compartida via volumen Docker.
4. **"Donde estan los tests?"** No hay. Verificacion manual. Es la primera limitacion que reconozco. Plan v2: WebTestCase + Playwright.
5. **"Por que no usas Symfony Forms?"** El stack es API REST. La validacion la hacen `#[Assert]` en entidades mas *clamp* en controladores. Es funcionalmente equivalente.
6. **"Que tipo de roles tienes?"** `ROLE_USER` global, y el rol de director es por partida via `UserGameSession.is_dm`. Explicar por que el dominio pide rol por sesion, no global.
