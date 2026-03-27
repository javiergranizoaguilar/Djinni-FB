# Visión General del Proyecto: Djinni-FB

Djinni-FB es una aplicación web completa para jugar a juegos de rol de mesa online. Está compuesta por un backend de Symfony (`Djinni-B`) y un frontend de React (`Djinni-F`).

## Resumen

- **Backend**: API REST con Symfony que gestiona la lógica de negocio y los datos (partidas, personajes, usuarios).
- **Frontend**: Aplicación de una sola página (SPA) con React que consume la API del backend y proporciona la interfaz de usuario, incluyendo un tablero de juego virtual (VTT).

---

## Backend (`Djinni-B`)

Es una aplicación Symfony que sigue la arquitectura estándar de controlador-entidad-repositorio.

- **Tecnologías Clave**: Symfony, Doctrine, PHP.
- **Ubicación**: `/Djinni-B`

### Componentes Principales                                                           

- **`src/Controller/`**: Contiene la lógica de los endpoints de la API.
    - `SceneController.php`: Gestiona las escenas del juego, incluyendo un endpoint para obtener la escena activa de una partida.
    - Otros controladores gestionan usuarios, personajes, inventario, etc.
- **`src/Entity/`**: Define las entidades de la base de datos (p. ej., `User`, `Game`, `CharacterSheet`).
- **`src/Repository/`**: Contiene la lógica para consultar la base de datos.

---

## Frontend (`Djinni-F`)

Es una aplicación React moderna construida con Vite.

- **Tecnologías Clave**: React, Vite, Konva (para el VTT), Tailwind CSS.
- **Ubicación**: `/Djinni-F`

### Componentes Principales

- **`src/`**: Contiene el código fuente de la aplicación.
    - `VttBoard.jsx`: Un componente clave que renderiza el tablero de juego virtual. Utiliza `react-konva` para dibujar el tablero y los tokens. Se comunica con el backend para obtener datos de la escena y enviar actualizaciones (p. ej., movimiento de tokens).
    - `pages/`: Contiene las diferentes páginas de la aplicación (login, lista de partidas, etc.).
    - `App.jsx`: Define las rutas de la aplicación.

---

## Flujo de Datos

1. El usuario interactúa con la interfaz de React en `Djinni-F`.
2. El frontend realiza peticiones HTTP (usando Axios) a la API del backend `Djinni-B`.
3. El backend procesa la petición, interactúa con la base de datos y devuelve una respuesta en formato JSON.
4. El frontend recibe la respuesta y actualiza la interfaz de usuario.

Por ejemplo, cuando un usuario entra en una partida, el componente `VttBoard.jsx` solicita la escena activa al endpoint `/api/game/{gameId}/active-scene` del backend. El `SceneController.php` responde con los datos de la escena, y el frontend la renderiza.
