# Djinni-FB-Clase Project Overview

This document provides a comprehensive overview of the Djinni-FB-Clase project, which appears to be a full-stack application consisting of a Symfony backend (Djinni-B) and a React frontend (Djinni-F).

## Project Structure

The project root contains two main directories:
- **Djinni-B**: The backend application built with Symfony.
- **Djinni-F**: The frontend application built with React and Vite.

## Backend (Djinni-B)

### Technology Stack
- **Framework**: Symfony 8.0
- **Language**: PHP >= 8.4
- **Database ORM**: Doctrine ORM 3.6
- **Authentication**: Lexik JWT Authentication Bundle
- **CORS**: Nelmio CORS Bundle
- **Real-time**: Symfony Mercure Bundle
- **Testing**: PHPUnit

### Key Dependencies
- `lexik/jwt-authentication-bundle`: For handling JWT authentication.
- `nelmio/cors-bundle`: For managing Cross-Origin Resource Sharing.
- `symfony/mercure-bundle`: For real-time updates.
- `doctrine/orm`: For database interactions.

### Directory Structure
- `src/`: Contains the application source code (Controllers, Entities, etc.).
- `config/`: Configuration files for packages, routes, and services.
- `migrations/`: Database migration files.
- `templates/`: Twig templates (though likely used less if it's an API-first backend).
- `tests/`: Unit and integration tests.

## Frontend (Djinni-F)

### Technology Stack
- **Framework**: React 19.2
- **Build Tool**: Vite 7.2
- **Language**: JavaScript (ES Modules)
- **Styling**: Tailwind CSS 3.4
- **Routing**: React Router DOM 7.13
- **Graphics**: Konva / React Konva (likely for canvas-based interactions or games).
- **HTTP Client**: Axios

### Key Dependencies
- `react`, `react-dom`: Core React libraries.
- `react-router-dom`: For client-side routing.
- `konva`, `react-konva`: For 2D canvas graphics.
- `axios`: For making API requests to the backend.
- `tailwindcss`: For utility-first CSS styling.

### Directory Structure
- `src/`: Source code for React components, pages, and logic.
  - `control_user/`: Contains `LoginPage.jsx` and `RegisterPage.jsx`.
  - `layout/`: Likely contains layout components (`MainLayout`, `Header`, `Footer`).
  - `VttBoard.jsx`: Likely the main Virtual Tabletop (VTT) component.
  - `App.jsx`: Main application component with routing.
- `public/`: Static assets.
- `vite.config.js`: Vite configuration.
- `tailwind.config.js`: Tailwind CSS configuration.

## Integration

The frontend (Djinni-F) likely communicates with the backend (Djinni-B) via RESTful APIs or GraphQL (though GraphQL isn't explicitly seen in the top-level dependencies, standard REST is assumed). Authentication is handled via JWTs provided by the backend.

## Recent Context

There have been recent changes (and rollbacks) involving:
- Security configuration (`security.yaml`)
- API Controllers (`ApiGameSesionController.php`)
- CORS configuration (`nelmio_cors.yaml`)
- JWT configuration (`lexik_jwt_authentication.yaml`)
- User Entity (`User.php`)

This suggests active development on the authentication and game session management features of the application.

### Specific File Details

#### `security.yaml`
- Configures `app_user_provider` using the `User` entity and `email` property.
- Defines a `login` firewall at `/api/login` using `json_login`.
- Defines an `api` firewall at `/api` using `jwt`.
- Access control allows public access to `/api/game/sesion/create` and `/avatar`.

#### `ApiGameSesionController.php`
- Handles game session creation at `/api/game/sesion/create`.
- Checks for authenticated user.
- Creates a `GameSesion` entity, sets it as active and GM, and adds the user as a player.

#### `nelmio_cors.yaml`
- Configures CORS to allow all origins (`*`) for `/api/` and `/avatar`.
- Allows standard methods (GET, POST, PUT, DELETE, OPTIONS).

#### `lexik_jwt_authentication.yaml`
- Configures JWT secret and public keys from environment variables.
- Sets token TTL to 30 days.
- `user_identity_field` is commented out.

#### `User.php`
- Entity representing a user.
- Implements `UserInterface` and `PasswordAuthenticatedUserInterface`.
- Has fields: `username`, `email`, `password`, `avatar_url`, `datetime`, `roles`.
- Relationships: `player` (GameSesion), `monsters`, `monsterUsers`, `characterSheetUsers`.
- `getUserIdentifier` returns `username`.

#### `GameSesion.php`
- Entity representing a game session.
- Has fields: `title`, `is_active`, `created_at`, `isGm`.
- Relationships: `player` (User), `scenes`, `monsters`, `characterSheets`.
- `isGm` seems to be a boolean flag on the session itself, which might be unusual (usually GM status is per user per session).

#### `App.jsx`
- Sets up routing using `react-router-dom`.
- Defines routes: `/`, `/login`, `/register`, `/Games`.
- `/Games` is protected by a `PrivateRoute` that checks for `vtt_token` in `localStorage`.

#### `LoginPage.jsx`
- Handles user login.
- Sends POST request to `http://127.0.0.1:8000/api/login_check` with `email` and `password`.
- Stores JWT token in `localStorage` as `vtt_token`.
- Dispatches `auth-change` event on success.
- Redirects to `/Games`.

### Other Entities
- `Item`, `Scene`, `Spell`, `Attack`, `Ability`, `Monster`, `Inventory`, `Proficency`, `MonsterUser`, `CharacterSheet`, `CharacterSheetUser`.
- These suggest a role-playing game (RPG) management system.

### Recent Fixes
- **Authentication**: Updated `User.php` to use `email` as the user identifier (`getUserIdentifier`).
- **JWT Configuration**: Enabled `user_identity_field: email` in `lexik_jwt_authentication.yaml` to ensure the token contains the email.
- **Security**: Updated `security.yaml` to require authentication for `/api/game/sesion/create` (`IS_AUTHENTICATED_FULLY`).
- **Frontend**: Updated `CreateGameModal.jsx` to include `Content-Type: application/json` header and better error handling.
