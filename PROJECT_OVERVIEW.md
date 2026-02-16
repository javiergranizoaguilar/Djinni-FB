# Djinni-FB-Clase Project Overview

Este documento proporciona una visión general completa del proyecto **Djinni-FB-Clase**, una aplicación full-stack que consta de un backend en Symfony (**Djinni-B**) y un frontend en React (**Djinni-F**). El objetivo del proyecto es crear una plataforma para gestionar partidas de rol (RPG), incluyendo hojas de personaje, sesiones de juego y tableros virtuales (VTT).

## Estructura del Proyecto

La raíz del proyecto contiene dos directorios principales:
- **Djinni-B**: Aplicación backend construida con Symfony.
- **Djinni-F**: Aplicación frontend construida con React y Vite.

---

## Backend (Djinni-B)

### Stack Tecnológico
- **Framework**: Symfony 8.0
- **Lenguaje**: PHP >= 8.4
- **ORM**: Doctrine ORM 3.6
- **Autenticación**: Lexik JWT Authentication Bundle
- **CORS**: Nelmio CORS Bundle
- **Base de Datos**: MySQL/MariaDB (inferido por Doctrine)

### Funcionalidades Clave
1.  **Autenticación y Usuarios**:
    -   Registro e inicio de sesión mediante JWT.
    -   Entidad `User` con roles (`ROLE_USER`, etc.) y relaciones con partidas y personajes.
2.  **Gestión de Partidas (`GameSesion`)**:
    -   Creación, edición y eliminación de partidas.
    -   Sistema de invitación mediante tokens únicos (`invitation_token`).
    -   Relación muchos a muchos con usuarios a través de `UserGameSession`, que define quién es el DM (`isDm`).
3.  **Hojas de Personaje (`CharacterSheet`)**:
    -   Modelo complejo con estadísticas (Fuerza, Destreza, etc.), habilidades, tiradas de salvación, inventario, hechizos y ataques.
    -   Soporte para subida de imágenes (token y retrato).
    -   Relación con usuarios mediante `CharacterSheetUser` (permisos de edición/visibilidad).
4.  **API REST**:
    -   Controladores organizados por entidad (`ApiCharacterController`, `ApiGameSesionController`, etc.).
    -   Rutas protegidas con `#[IsGranted('IS_AUTHENTICATED_FULLY')]`.

### Estructura de Directorios Importante
- `src/Entity/`: Modelos de datos (`User`, `GameSesion`, `CharacterSheet`, `UserGameSession`, etc.).
- `src/Controller/`: Lógica de los endpoints de la API.
- `src/Repository/`: Consultas a la base de datos.
- `config/packages/`: Configuraciones de seguridad (`security.yaml`), JWT y CORS.

---

## Frontend (Djinni-F)

### Stack Tecnológico
- **Framework**: React 19.2
- **Build Tool**: Vite 7.2
- **Estilos**: Tailwind CSS 3.4
- **Enrutamiento**: React Router DOM 7.13
- **Gráficos**: Konva / React Konva (para el tablero virtual).
- **Cliente HTTP**: Axios

### Funcionalidades Clave
1.  **Autenticación**:
    -   Páginas de Login (`LoginPage.jsx`) y Registro (`RegisterPage.jsx`).
    -   Almacenamiento del token JWT en `localStorage` (`vtt_token`).
    -   Protección de rutas con componente `PrivateRoute`.
2.  **Gestión de Partidas**:
    -   Listado de partidas del usuario (`GameList.jsx`).
    -   Creación de nuevas partidas y unión mediante enlaces de invitación (`JoinGamePage.jsx`).
    -   Tablero de juego virtual (`VttBoard.jsx`).
3.  **Gestión de Personajes**:
    -   Listado de personajes (`CharacterList.jsx`).
    -   Modal de edición completo (`EditCharacterModal.jsx`) que permite modificar stats, habilidades, subir imágenes y más.
4.  **Interfaz de Usuario**:
    -   Diseño responsivo con Tailwind CSS.
    -   Modo oscuro soportado (clases `dark:`).

### Estructura de Directorios Importante
- `src/layout/`: Componentes estructurales y páginas principales (`MainLayout`, `Header`, `GameList`, `CharacterList`).
- `src/control_user/`: Páginas de autenticación.
- `src/App.jsx`: Configuración de rutas.
- `src/VttBoard.jsx`: Componente principal del tablero de juego.

---

## Flujos de Trabajo Principales

### 1. Autenticación
El usuario se loguea en el frontend, recibe un JWT del backend y este se usa en el header `Authorization: Bearer <token>` para todas las peticiones subsiguientes.

### 2. Creación de Personaje
-   **Frontend**: `CharacterList` abre un modal simple para crear el personaje (solo nombre).
-   **Backend**: `ApiCharacterController::create` inicializa una `CharacterSheet` con valores por defecto y la asocia al usuario.
-   **Edición**: `EditCharacterModal` carga los datos completos, permite editar campos complejos (JSON) y subir imágenes. `ApiCharacterController::edit` procesa estos datos.

### 3. Sesiones de Juego
-   **Creación**: El usuario crea una partida y se le asigna automáticamente como DM en `UserGameSession`.
-   **Invitación**: Se genera un `invitation_token` único. Otros usuarios pueden unirse usando este token, siendo asignados como jugadores.
-   **Juego**: `VttBoard` (aún en desarrollo/integración) servirá como el espacio de juego compartido.

## Estado Actual y Notas
-   El proyecto está en desarrollo activo.
-   Se ha implementado recientemente la lógica completa de edición de personajes y gestión de sesiones.
-   La seguridad y validación de datos en el backend son prioritarias (uso de `Voters` o comprobaciones en controladores).
