<?php

namespace App\Controller;

use App\Entity\CharacterSheet;
use App\Entity\CharacterSheetUser;
use App\Entity\GameSesion;
use App\Entity\Monster;
use App\Entity\MonsterUser;
use App\Entity\Scene;
use App\Entity\User;
use App\Entity\UserGameSession;
use App\Repository\CharacterSheetRepository;
use App\Repository\CharacterSheetUserRepository;
use App\Repository\GameSesionRepository;
use App\Repository\MonsterRepository;
use App\Repository\MonsterUserRepository;
use App\Repository\UserGameSessionRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin')]
#[IsGranted('ROLE_ADMIN')]
class AdminController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {
    }

    // ---------- Users ----------

    #[Route('/users', name: 'admin_users_list', methods: ['GET'])]
    public function listUsers(UserRepository $users): JsonResponse
    {
        $data = array_map(function (User $u) {
            return [
                'id' => $u->getId(),
                'username' => $u->getUsername(),
                'email' => $u->getEmail(),
                'avatar_url' => $u->getAvatarUrl(),
                'roles' => $u->getRoles(),
                'is_admin' => in_array('ROLE_ADMIN', $u->getRoles(), true),
                'created_at' => $u->getDatetime()?->format(\DATE_ATOM),
                'games_count' => $u->getUserGameSessions()->count(),
            ];
        }, $users->findBy([], ['id' => 'ASC']));

        return $this->json($data);
    }

    #[Route('/users/{id}/role', name: 'admin_users_toggle_admin', methods: ['PATCH'])]
    public function toggleAdmin(int $id, Request $request, UserRepository $users): JsonResponse
    {
        $target = $users->find($id);
        if (!$target) {
            return $this->json(['error' => 'Usuario no encontrado'], 404);
        }

        $self = $this->getUser();
        if ($self instanceof User && $self->getId() === $target->getId()) {
            return $this->json(['error' => 'No puedes cambiar tu propio rol'], 409);
        }

        $payload = json_decode((string) $request->getContent(), true) ?? [];
        $shouldBeAdmin = (bool) ($payload['is_admin'] ?? false);

        $roles = array_values(array_filter($target->getRoles(), fn ($r) => $r !== 'ROLE_USER' && $r !== 'ROLE_ADMIN'));
        if ($shouldBeAdmin) {
            $roles[] = 'ROLE_ADMIN';
        }
        $target->setRoles($roles);
        $this->em->flush();

        return $this->json([
            'id' => $target->getId(),
            'is_admin' => in_array('ROLE_ADMIN', $target->getRoles(), true),
        ]);
    }

    #[Route('/users/{id}', name: 'admin_users_delete', methods: ['DELETE'])]
    public function deleteUser(
        int $id,
        UserRepository $users,
        UserGameSessionRepository $userGameSessions,
        MonsterRepository $monsters,
        MonsterUserRepository $monsterUsers,
        CharacterSheetUserRepository $characterSheetUsers,
    ): JsonResponse {
        $target = $users->find($id);
        if (!$target) {
            return $this->json(['error' => 'Usuario no encontrado'], 404);
        }

        $self = $this->getUser();
        if ($self instanceof User && $self->getId() === $target->getId()) {
            return $this->json(['error' => 'No puedes borrar tu propio usuario'], 409);
        }

        foreach ($userGameSessions->findBy(['user' => $target]) as $ugs) {
            $this->em->remove($ugs);
        }
        foreach ($monsterUsers->findBy(['user' => $target]) as $mu) {
            $this->em->remove($mu);
        }
        foreach ($characterSheetUsers->findBy(['user_id' => $target]) as $csu) {
            $this->em->remove($csu);
        }
        foreach ($monsters->findBy(['creador' => $target]) as $monster) {
            $monster->setCreador(null);
        }

        $this->em->remove($target);
        $this->em->flush();

        return $this->json(['message' => 'Usuario borrado'], 200);
    }

    // ---------- Games ----------

    #[Route('/games', name: 'admin_games_list', methods: ['GET'])]
    public function listGames(GameSesionRepository $games): JsonResponse
    {
        $data = array_map(function (GameSesion $g) {
            $dm = null;
            foreach ($g->getUserGameSessions() as $ugs) {
                if ($ugs->isDm()) {
                    $dm = $ugs->getUser();
                    break;
                }
            }
            return [
                'id' => $g->getId(),
                'title' => $g->getTitle(),
                'img_path' => $g->getImgPath(),
                'dm' => $dm ? ['id' => $dm->getId(), 'username' => $dm->getUsername()] : null,
                'players_count' => $g->getUserGameSessions()->count(),
            ];
        }, $games->findBy([], ['id' => 'ASC']));

        return $this->json($data);
    }

    #[Route('/games/{id}', name: 'admin_games_delete', methods: ['DELETE'])]
    public function deleteGame(
        int $id,
        GameSesionRepository $games,
        UserGameSessionRepository $userGameSessions,
        MonsterRepository $monsters,
        CharacterSheetRepository $characterSheets,
    ): JsonResponse {
        $game = $games->find($id);
        if (!$game) {
            return $this->json(['error' => 'Partida no encontrada'], 404);
        }

        foreach ($monsters->findBy(['exist' => $game]) as $m) {
            $m->setExist(null);
        }
        foreach ($characterSheets->findBy(['gamesesion' => $game]) as $cs) {
            $cs->setGamesesion(null);
        }
        foreach ($userGameSessions->findBy(['gameSession' => $game]) as $ugs) {
            $this->em->remove($ugs);
        }
        foreach ($this->em->getRepository(Scene::class)->findBy(['session_id' => $game]) as $scene) {
            $this->em->remove($scene);
        }

        $this->em->remove($game);
        $this->em->flush();

        return $this->json(['message' => 'Partida borrada'], 200);
    }

    // ---------- Monsters ----------

    #[Route('/monsters', name: 'admin_monsters_list', methods: ['GET'])]
    public function listMonsters(MonsterRepository $monsters): JsonResponse
    {
        $data = array_map(function (Monster $m) {
            $creador = $m->getCreador();
            return [
                'id' => $m->getId(),
                'name' => $m->getName(),
                'type' => $m->getType(),
                'cr' => method_exists($m, 'getCr') ? $m->getCr() : null,
                'creador' => $creador ? ['id' => $creador->getId(), 'username' => $creador->getUsername()] : null,
            ];
        }, $monsters->findBy([], ['id' => 'ASC']));

        return $this->json($data);
    }

    #[Route('/monsters/{id}', name: 'admin_monsters_delete', methods: ['DELETE'])]
    public function deleteMonster(
        int $id,
        MonsterRepository $monsters,
        MonsterUserRepository $monsterUsers,
    ): JsonResponse {
        $monster = $monsters->find($id);
        if (!$monster) {
            return $this->json(['error' => 'Monstruo no encontrado'], 404);
        }

        foreach ($monsterUsers->findBy(['monster' => $monster]) as $mu) {
            $this->em->remove($mu);
        }

        $this->em->remove($monster);
        $this->em->flush();

        return $this->json(['message' => 'Monstruo borrado'], 200);
    }

    // ---------- Character Sheets ----------

    #[Route('/characters', name: 'admin_characters_list', methods: ['GET'])]
    public function listCharacters(CharacterSheetRepository $sheets): JsonResponse
    {
        $data = array_map(function (CharacterSheet $cs) {
            $game = $cs->getGamesesion();
            return [
                'id' => $cs->getId(),
                'name' => $cs->getName(),
                'level' => method_exists($cs, 'getLevel') ? $cs->getLevel() : null,
                'class' => method_exists($cs, 'getClass') ? $cs->getClass() : null,
                'game' => $game ? ['id' => $game->getId(), 'title' => $game->getTitle()] : null,
            ];
        }, $sheets->findBy([], ['id' => 'ASC']));

        return $this->json($data);
    }

    #[Route('/characters/{id}', name: 'admin_characters_delete', methods: ['DELETE'])]
    public function deleteCharacter(
        int $id,
        CharacterSheetRepository $sheets,
        CharacterSheetUserRepository $characterSheetUsers,
    ): JsonResponse {
        $sheet = $sheets->find($id);
        if (!$sheet) {
            return $this->json(['error' => 'Personaje no encontrado'], 404);
        }

        foreach ($characterSheetUsers->findBy(['charactersheet_id' => $sheet]) as $csu) {
            $this->em->remove($csu);
        }

        $this->em->remove($sheet);
        $this->em->flush();

        return $this->json(['message' => 'Personaje borrado'], 200);
    }
}
