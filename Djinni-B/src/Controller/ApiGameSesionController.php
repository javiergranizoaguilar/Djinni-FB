<?php

namespace App\Controller;

use App\Entity\GameSesion;
use App\Entity\Scene;
use App\Entity\User;
use App\Entity\UserGameSession;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\String\Slugger\SluggerInterface;

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
        $entityManager->persist($gameSesion);

        $userGameSession = new UserGameSession();
        $userGameSession->setUser($user);
        $userGameSession->setGameSession($gameSesion);
        $userGameSession->setIsDm(true);
        $entityManager->persist($userGameSession);

        // --- FIX: Create the default scene ---
        $scene = new Scene();
        $scene->setName('Default Scene');
        $scene->setGridWidth(20); // Default grid size
        $scene->setGridHeight(20);
        $scene->setSessionId($gameSesion);
        $entityManager->persist($scene);
        // --- END FIX ---

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
    public function myGames(EntityManagerInterface $entityManager): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'User not authenticated'], 401);
        }

        $userGameSessions = $user->getUserGameSessions();
        $games = [];
        $needsFlush = false;

        foreach ($userGameSessions as $ugs) {
            $session = $ugs->getGameSession();

            if (!$session->getInvitationToken()) {
                $session->setInvitationToken(bin2hex(random_bytes(16)));
                $needsFlush = true;
            }

            $games[] = [
                'id' => $session->getId(),
                'title' => $session->getTitle(),
                'is_active' => $session->isActive(),
                'created_at' => $session->getCreatedAt()->format('Y-m-d H:i:s'),
                'is_dm' => $ugs->isDm(),
                'invitation_token' => $session->getInvitationToken(),
                'img_path' => $session->getImgPath(),
            ];
        }

        if ($needsFlush) {
            $entityManager->flush();
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

        $gameSesion = $entityManager->getRepository(GameSesion::class)->findOneBy(['invitation_token' => $token]);

        if (!$gameSesion) {
            return $this->json(['error' => 'Invalid invitation token'], 404);
        }

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

    #[Route('/delete/{id}', name: 'api_game_sesion_delete', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function delete(int $id, EntityManagerInterface $entityManager): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'User not authenticated'], 401);
        }

        $gameSesion = $entityManager->getRepository(GameSesion::class)->find($id);

        if (!$gameSesion) {
            return $this->json(['error' => 'Game session not found'], 404);
        }

        $userGameSession = $entityManager->getRepository(UserGameSession::class)->findOneBy([
            'user' => $user,
            'gameSession' => $gameSesion
        ]);

        if (!$userGameSession || !$userGameSession->isDm()) {
            return $this->json(['error' => 'You are not authorized to delete this game'], 403);
        }

        $entityManager->remove($gameSesion);
        $entityManager->flush();

        return $this->json(['message' => 'Game session deleted successfully'], 200);
    }

    #[Route('/edit/{id}', name: 'api_game_sesion_edit', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function edit(int $id, Request $request, EntityManagerInterface $entityManager, SluggerInterface $slugger): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'User not authenticated'], 401);
        }

        $gameSesion = $entityManager->getRepository(GameSesion::class)->find($id);

        if (!$gameSesion) {
            return $this->json(['error' => 'Game session not found'], 404);
        }

        $userGameSession = $entityManager->getRepository(UserGameSession::class)->findOneBy([
            'user' => $user,
            'gameSession' => $gameSesion
        ]);

        if (!$userGameSession || !$userGameSession->isDm()) {
            return $this->json(['error' => 'You are not authorized to edit this game'], 403);
        }

        $title = $request->request->get('title');
        $isActive = $request->request->get('is_active');
        $imageFile = $request->files->get('image');

        if ($title) {
            $gameSesion->setTitle($title);
        }

        if ($isActive !== null) {
            $isActiveBool = filter_var($isActive, FILTER_VALIDATE_BOOLEAN);
            $gameSesion->setIsActive($isActiveBool);
        }

        if ($imageFile) {
            $originalFilename = pathinfo($imageFile->getClientOriginalName(), PATHINFO_FILENAME);
            $safeFilename = $slugger->slug($originalFilename);
            $newFilename = $safeFilename . '-' . uniqid() . '.' . $imageFile->guessExtension();

            try {
                $imageFile->move(
                    $this->getParameter('kernel.project_dir') . '/uploads/game_images',
                    $newFilename
                );
                $gameSesion->setImgPath('/uploads/game_images/' . $newFilename);
            } catch (FileException $e) {
                return $this->json(['error' => 'Failed to upload image'], 500);
            }
        }

        $entityManager->flush();

        return $this->json([
            'message' => 'Game session updated successfully',
            'id' => $gameSesion->getId(),
            'title' => $gameSesion->getTitle(),
            'is_active' => $gameSesion->isActive(),
            'img_path' => $gameSesion->getImgPath()
        ], 200);
    }
}
