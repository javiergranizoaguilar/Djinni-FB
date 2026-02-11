<?php

namespace App\Controller;

use App\Entity\GameSesion;
use App\Entity\User;
use App\Entity\UserGameSession;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/game/sesion')]
class ApiGameSesionController extends AbstractController
{
    #[Route('/create', name: 'api_game_sesion_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function create(Request $request, EntityManagerInterface $entityManager, LoggerInterface $logger): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->getUser();

        if (!$user) {
             return $this->json(['error' => 'User not authenticated'], 401);
        }

        if (!$user instanceof User) {
            $logger->error('DEBUG: User is not an instance of App\Entity\User. It is: ' . get_class($user));
            return $this->json(['error' => 'User not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        $title = $data['title'] ?? null;

        if (!$title) {
            return $this->json(['error' => 'Title is required'], 400);
        }

        $gameSesion = new GameSesion();
        $gameSesion->setTitle($title);
        $gameSesion->setIsActive(true);
        $gameSesion->setCreatedAt(new \DateTimeImmutable());
        // El token se genera en el constructor

        $entityManager->persist($gameSesion);

        // Crear la relación en la tabla intermedia UserGameSession
        $userGameSession = new UserGameSession();
        $userGameSession->setUser($user);
        $userGameSession->setGameSession($gameSesion);
        $userGameSession->setIsDm(true); // El creador es el DM

        $entityManager->persist($userGameSession);
        $entityManager->flush();

        return $this->json([
            'id' => $gameSesion->getId(),
            'title' => $gameSesion->getTitle(),
            'invitation_token' => $gameSesion->getInvitationToken(),
            'message' => 'Game session created successfully'
        ], 201);
    }

    #[Route('/my-games', name: 'api_game_sesion_my_games', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function myGames(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'User not authenticated'], 401);
        }

        $userGameSessions = $user->getUserGameSessions();
        $games = [];

        foreach ($userGameSessions as $ugs) {
            $session = $ugs->getGameSession();
            $games[] = [
                'id' => $session->getId(),
                'title' => $session->getTitle(),
                'is_active' => $session->isActive(),
                'created_at' => $session->getCreatedAt()->format('Y-m-d H:i:s'),
                'is_dm' => $ugs->isDm(),
                'invitation_token' => $session->getInvitationToken(),
            ];
        }

        return $this->json($games);
    }

    #[Route('/join/{token}', name: 'api_game_sesion_join', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function join(string $token, EntityManagerInterface $entityManager): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'User not authenticated'], 401);
        }

        // Buscar la sesión por el token
        $gameSesion = $entityManager->getRepository(GameSesion::class)->findOneBy(['invitation_token' => $token]);

        if (!$gameSesion) {
            return $this->json(['error' => 'Invalid invitation token'], 404);
        }

        // Verificar si el usuario ya está en la partida
        $existingUserSession = $entityManager->getRepository(UserGameSession::class)->findOneBy([
            'user' => $user,
            'gameSession' => $gameSesion
        ]);

        if ($existingUserSession) {
            return $this->json([
                'message' => 'You are already in this game',
                'game_id' => $gameSesion->getId()
            ], 200);
        }

        // Añadir al usuario a la partida como jugador (no DM)
        $userGameSession = new UserGameSession();
        $userGameSession->setUser($user);
        $userGameSession->setGameSession($gameSesion);
        $userGameSession->setIsDm(false);

        $entityManager->persist($userGameSession);
        $entityManager->flush();

        return $this->json([
            'message' => 'Joined game successfully',
            'game_id' => $gameSesion->getId(),
            'title' => $gameSesion->getTitle()
        ], 200);
    }
}
