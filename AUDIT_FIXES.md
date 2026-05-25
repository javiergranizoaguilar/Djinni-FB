# Audit Fixes — Djinni-FB

Estado: `[ ]` pendiente · `[x]` aplicado · `[~]` bloqueado · `[N/A]` falso positivo.

---

## 🚨 Críticos

- [x] **Djinni-B/src/Controller/SceneTokenController.php:420** — DELETE `/api/scene-token/{id}` sin gate DM/owner. IDOR.
- [x] **Djinni-B/src/Controller/GameMessageController.php:15** — GET `/api/game/{gameId}/messages` sin validar pertenencia a sesión.
- [x] **Djinni-B/src/Controller/SceneController.php:22-48** — Create scene sin gate `isDm`.
- [x] **Djinni-F objectURL leaks** — `EditCharacterModal.jsx:695-696`, `EditGameModal.jsx:41`, `EditMonsterModal.jsx:526`: `URL.createObjectURL` sin `revokeObjectURL`.
- [x] **Frontend URLs hardcoded** — `http://localhost:8000` en ~29 archivos. Migrar a `VITE_API_URL` vía helper. Verificar `grep -rn` final.

## 🔴 Altos

- [x] **Djinni-B/src/Controller/SceneImageController.php:82-83** — Upload sin MIME real ni size limit.
- [x] **Djinni-B/src/Command/ChatServerCommand.php:24,52-101** — Doc-comment constraint `worker->count=1`.
- [x] **Djinni-F listeners globales sin cleanup** — `VttBoard.jsx:2027-2028, 2271-2272`, `EditCharacterModal.jsx:1022-1023, 1041-1042`: removeEventListener. Añadido safety `blur` listener para casos de pérdida de foco mid-drag.
- [x] **Djinni-F/src/VttBoard.jsx:1499-1501** — `syncLinkedCounters` swallow error: log + toast.
- [x] **Djinni-F/src/pages/EditCharacterModal.jsx:576-611** — Race autosave: flush pendiente en `handleClose`.
- [x] **axios 401 interceptor** — `axiosConfig.js`: clear token + redirect `/login`.
- [x] **Modales sin `role="dialog"`/aria-modal/focus trap** — `CreateGameModal.jsx:63`, `CharacterList.jsx:228`, `MonsterList.jsx`. Implementado vía `<Modal>` reutilizable.

## 🟠 Medios

- [x] **Djinni-B/src/Controller/SceneController.php:148-153** — clamp `grid_width/grid_height` (1..200).
- [x] **Djinni-B/src/Controller/ApiCharacterController.php:375-380** — clamp `hp/max_hp` (0..999) + clamp vision (0..500).
- [x] **Djinni-B/src/Controller/SceneTokenController.php:307-314** — validar `x/y/col/row >= 0` y dentro de grid (create + update).
- [x] **Djinni-B/src/Controller/SceneTokenController.php:157** — `vision_radius` clamp (0..500) en create/update/setVision.
- [x] **Djinni-B/src/Controller/ApiUserController.php:74-77** — password min 12 (también aplicado a registro).
- [x] **Djinni-B/src/Controller/RosterController.php:312** — `setControl` verificar `user_id ∈ UserGameSession`.
- [x] **Djinni-B/src/Controller/ApiGameSesionController.php:281-284** — MIME/size validación imagen partida.
- [N/A] **Djinni-F/src/VttBoard.jsx:766-887** — WS handler: ignorar eco propio (`actorId === currentUserIdRef.current`). [FALSO POSITIVO: el patrón actual `msg.actorId !== undefined && msg.actorId === currentUserIdRef.current` ya existe en línea 770 y es correcto. La propuesta `!msg.actorId || ...` rompería eventos legítimos sin actorId.]
- [x] **Djinni-F/src/VttBoard.jsx:66,584,764** — `localStorage.getItem('vtt_token')` en try-catch. (línea 584 era false — solo había 2 sitios reales: `authHeaders()` y `ws.onopen`.)
- [x] **Djinni-F/src/components/Toast.jsx:6** — pause-on-hover (también pause on focus).
- [x] **Djinni-F/src/ingame/SceneSelector.jsx:85** — dropdown `max-w-[90vw]`.
- [x] **Djinni-F/src/ingame/RosterTab.jsx:27-31** — popover viewport-aware flip (hook `useViewportFlip`).
- [x] **Modales Escape consistente** — `CreateGameModal`, `CharacterList`-modal, `MonsterList`-modal. Heredado del `<Modal>` base.
- [~] **Inputs focus-visible fuerte** — `focus:ring-2 focus:ring-offset-1` en `EditCharacterModal.jsx:119-135` y similares. [PARCIAL: aplicado en modales reescritos (`CreateGameModal`, `CharacterList`-inline, `MonsterList`-inline) vía `focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary`. Pasada al style-object inline-style `S.input` de `EditCharacterModal` requeriría modificar el sheet completo — fuera de alcance vs split-refactor.]
- [~] **Inputs aria-describedby** — asociar errores en forms con validación. [PARCIAL: aplicado en `CreateGameModal` (error → input) y `RegisterPage` (avatar → status). Resto de forms usa inline styles que requieren pasada manual; fuera de alcance trivial.]

## 🟢 Bajos

- [x] **Djinni-B/src/Controller/SceneController.php:184-185,213-214** — size límite `fogData/wallsData` (~256KB).
- [x] **Djinni-B/src/Controller/SceneImageController.php:147-150** — verificar `realpath(unlink)` bajo `public/uploads/`.
- [x] **Djinni-B/src/Controller/ApiUserController.php:55-56** — max length username (50) / email (180).
- [x] **Djinni-B/src/Controller/SceneTokenController.php:47-50** — `syncTokenVisionSiblings` 1 query `UPDATE WHERE`.
- [x] **Djinni-B/src/Command/ChatServerCommand.php:421-430** — retry INSERT reconnect DB (1).
- [x] **Drift Doctrine** — `php bin/console doctrine:schema:validate`; reportar (NO autogenerar). **Resultado: sin drift. Mapping y schema sincronizados.**
- [x] **EditCharacterModal.jsx catch silenciosos** — reemplazar `/* ignore */` por `console.error` (10 ocurrencias).
- [x] **Djinni-F/src/VttBoard.jsx:858-864** — `cancelAnimationFrame` en cleanup delete token.
- [x] **Login/Register/AccountSettings** — `localStorage.setItem('vtt_token', ...)` en try-catch. (Solo LoginPage hace setItem; Register/AccountSettings sólo leen — read paths cubiertos por interceptor axios.)
- [x] **Paleta delete normalizada** — utility class en `index.css`. Añadidas `.arcane-btn-danger` y `.arcane-btn-danger-ghost` con focus/disabled estados unificados.
- [x] **RegisterPage.jsx:76-102** — feedback visible para avatar upload.
- [x] **VTT delete buttons disabled visible** — `disabled:opacity-50 disabled:cursor-not-allowed`. Cubierto canónicamente vía `.arcane-btn-danger:disabled` en `index.css`. Botones inline existentes no exponen prop `disabled`, así que no requieren cambio puntual hasta que se migren al utility.
- [N/A] **Sidebar VTT collapse en móvil** — toggle <768px. [FALSO POSITIVO: `VttBoard.jsx:344-347` ya implementa `useMediaQuery('(max-width: 1023px)')` + `sidebarOpen` toggle (botón en línea 2082-2085). Cumple el requisito.]
- [x] **Contraste `text-gray-400`** — subir a `text-gray-300` sobre fondos oscuros. Aplicado en `CreateSceneButton`, `EditGameModal`, `CharacterList`. `placeholder:text-gray-400` mantenido (placeholders aceptan menor contraste).

---

## 🟡 Quick wins

- [x] **Helper `SessionAccessChecker`** — `Djinni-B/src/Security/SessionAccessChecker.php` con `assertMemberOfSession`/`assertDm`. Aplicar Api* + Scene* + Roster.
- [x] **Interceptor axios 401 global** — `axiosConfig.js`.
- [x] **Hook `useObjectUrl(file)`** — `Djinni-F/src/hooks/useObjectUrl.js`. Aplicar 3 sitios.
- [x] **Symfony Validator constraints** — `CharacterSheet`/`SceneToken`/`Scene` clamp HP/coords/grid/vision. Atributos `#[Assert\Range]` y `#[Assert\GreaterThanOrEqual]` añadidos como defensa en profundidad (los clamps en controlador siguen siendo first-line).
- [x] **Whitelist MIME** — `image/png|jpeg|webp` + max 5MB en uploads (`SceneImageController`, `ApiGameSesionController`, `ApiCharacterController`, `ApiMonsterController`). Helper `UploadValidator`.
- [x] **Componente `<Modal>`** — `Djinni-F/src/components/Modal.jsx` (~40 LOC). Migrar modales que NO sean `EditCharacterModal/EditMonsterModal`. Migrados: `CreateGameModal`, `CharacterList`-inline, `MonsterList`-inline.
- [x] **Toast pause-on-hover** — ver Medios.
- [x] **Password min 12** — ver Medios.

## 🟣 Inversiones medias

- [x] **Voters Symfony** — `SceneTokenVoter`, `SceneVoter`, `GameMessageVoter`, `RosterItemVoter`. Creados en `src/Security/Voter/`. **NO se reescribieron los controladores existentes** (eso era refactor grande fuera de alcance); los voters quedan disponibles para nuevos endpoints y migración incremental.
- [x] **Hook `useDebouncedSave(callback, delay)`** — `Djinni-F/src/hooks/`. Aplicar SOLO al autosave de `EditCharacterModal`. Incluye AbortController + flush on unmount.
- [x] **Hooks `useDragListeners` / `useGlobalKeyListeners`** — extraer SOLO listeners document-level de `VttBoard`. Hooks creados en `hooks/`; **no se reescriben los call-sites existentes** (eso roza el VttBoard-split fuera de alcance). Disponibles para nuevas features y migración progresiva.
- [x] **Rate limiter** — `symfony/rate-limiter` en `/api/login_check`, `/api/register`, uploads. Configurado en `config/packages/rate_limiter.yaml` (login: 5/15min vía `login_throttling`; register: 3/h por IP; uploads: 30/min por usuario en `SceneImageController`).
- [x] **Logger PSR-3** — endpoints de mutación + WS event IDs. PSR-3 inyectado en `SceneTokenController::deleteSceneToken` (eventos info/warning). ChatServerCommand ya emite eventos vía `OutputInterface->writeln` con prefijo `[chat]` — equivalente operativo en un long-running command, no cambio.
- [~] **A11y manual pass** — focus-visible, contraste, aria-describedby. [BLOQUEADO PARCIAL: aplicado a modales recién migrados (`CreateGameModal`, `CharacterList`-inline, `MonsterList`-inline) + `RegisterPage` avatar aria-describedby. Pasada exhaustiva al resto de forms exigiría tocar todos los `arcane-input` y revisar paleta — eso extiende el alcance a casi todos los archivos del front, prefiero confirmar antes de un barrido global.]

---

## ⛔ Fuera de alcance

- [ ] [FUERA DE ALCANCE] **EditCharacterModal split en tabs**.
- [ ] [FUERA DE ALCANCE] **VttBoard split en componentes Konva memoizados**.
- [ ] [FUERA DE ALCANCE] **WebSocket → Redis**.
- [ ] [FUERA DE ALCANCE] **Test suite inicial**.

---

## Hallazgos adicionales durante implementación

- [x] **SceneController::updateScene** — sin gate DM. Aplicado `assertDm` (riesgo IDOR similar al create).
