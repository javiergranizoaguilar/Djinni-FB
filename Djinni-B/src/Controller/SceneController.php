<?php

namespace App\Controller;

use App\Entity\Scene;
use App\Repository\GameSesionRepository;
use App\Repository\SceneImageRepository;
use App\Repository\SceneRepository;
use App\Repository\UserGameSessionRepository;
use App\Security\SessionAccessChecker;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/scene')]
final class SceneController extends AbstractController
{
    /**
     * API endpoint to create a new scene for a game session.
     */
    #[Route('/api/game/{gameId}/scenes', name: 'api_create_scene_for_game', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function createSceneForGame(int $gameId, Request $request, EntityManagerInterface $entityManager, GameSesionRepository $gameSesionRepository, SessionAccessChecker $access): JsonResponse
    {
        $game = $gameSesionRepository->find($gameId);
        if (!$game) {
            return $this->json(['error' => 'Game session not found.'], 404);
        }
        $access->assertDm($this->getUser(), $game);

        $data = json_decode($request->getContent(), true);
        $gw = (int)($data['grid_width']  ?? 20);
        $gh = (int)($data['grid_height'] ?? 20);
        $gw = max(1, min(200, $gw));
        $gh = max(1, min(200, $gh));

        $scene = new Scene();
        $scene->setName($data['name'] ?? 'New Scene');
        $scene->setGridWidth($gw);
        $scene->setGridHeight($gh);
        $scene->setSessionId($game);

        $entityManager->persist($scene);
        $entityManager->flush();

        return $this->json([
            'id' => $scene->getId(),
            'name' => $scene->getName(),
            'grid_width' => $scene->getGridWidth(),
            'grid_height' => $scene->getGridHeight(),
            'fog_data' => $scene->getFogData(),
            'walls_data' => $scene->getWallsData(),
        ]);
    }

    /**
     * API endpoint to get the first scene for a given game session.
     */
    #[Route('/api/game/{gameId}/active-scene', name: 'api_get_active_scene_for_game', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function getActiveSceneForGame(int $gameId, SceneRepository $sceneRepository, UserGameSessionRepository $userGameSessionRepository): JsonResponse
    {
        $scene = $sceneRepository->findOneBy(['session_id' => $gameId]);

        if (!$scene) {
            return $this->json(['error' => 'No scene found for this game session.'], 404);
        }

        $isDm = false;
        $user = $this->getUser();
        if ($user) {
            $userGameSession = $userGameSessionRepository->findOneBy([
                'user' => $user,
                'gameSession' => $gameId
            ]);
            if ($userGameSession) {
                $isDm = $userGameSession->isDm();
            }
        }

        return $this->json([
            'id' => $scene->getId(),
            'name' => $scene->getName(),
            'grid_width' => $scene->getGridWidth(),
            'grid_height' => $scene->getGridHeight(),
            'is_dm' => $isDm,
            'current_user_id' => $user?->getId(),
            'fog_data' => $scene->getFogData(),
            'walls_data' => $scene->getWallsData(),
        ]);
    }

    #[Route('/api/game/{gameId}/players', name: 'api_get_game_players', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function getGamePlayers(int $gameId, UserGameSessionRepository $userGameSessionRepository): JsonResponse
    {
        $entries = $userGameSessionRepository->findBy(['gameSession' => $gameId]);

        $players = array_map(fn($ugs) => [
            'id'    => $ugs->getUser()->getId(),
            'name'  => $ugs->getUser()->getUsername() ?? $ugs->getUser()->getEmail(),
            'is_dm' => $ugs->isDm(),
        ], $entries);

        return $this->json($players);
    }

    /**
     * API endpoint to get all scenes for a given game session.
     */
    #[Route('/api/game/{gameId}/scenes', name: 'api_get_scenes_for_game', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function getScenesForGame(int $gameId, SceneRepository $sceneRepository, SceneImageRepository $sceneImageRepository): JsonResponse
    {
        $scenes = $sceneRepository->findBy(['session_id' => $gameId]);

        if (empty($scenes)) {
            return $this->json(['error' => 'No scenes found for this game session.'], 404);
        }

        $scenesData = array_map(function (Scene $scene) use ($sceneImageRepository) {
            $bgImage = $sceneImageRepository->findOneBy(['scene' => $scene, 'layer' => 'background']);

            return [
                'id' => $scene->getId(),
                'name' => $scene->getName(),
                'grid_width' => $scene->getGridWidth(),
                'grid_height' => $scene->getGridHeight(),
                'fog_data' => $scene->getFogData(),
                'walls_data' => $scene->getWallsData(),
                'background_image_url' => $bgImage?->getImageUrl(),
            ];
        }, $scenes);

        return $this->json($scenesData);
    }

    /**
     * API endpoint to delete a scene. DM only.
     */
    #[Route('/api/scenes/{id}', name: 'api_delete_scene', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function deleteScene(int $id, SceneRepository $sceneRepository, EntityManagerInterface $entityManager, SessionAccessChecker $access): JsonResponse
    {
        $scene = $sceneRepository->find($id);
        if (!$scene) {
            return $this->json(['error' => 'Scene not found.'], 404);
        }
        $access->assertDm($this->getUser(), $scene->getSessionId());

        $entityManager->remove($scene);
        $entityManager->flush();

        return $this->json(['message' => 'Scene deleted.']);
    }

    /**
     * API endpoint to update a scene.
     */
    #[Route('/api/scenes/{id}', name: 'api_update_scene', methods: ['PUT'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function updateScene(int $id, Request $request, SceneRepository $sceneRepository, EntityManagerInterface $entityManager, SessionAccessChecker $access): JsonResponse
    {
        $scene = $sceneRepository->find($id);

        if (!$scene) {
            return $this->json(['error' => 'Scene not found.'], 404);
        }
        $access->assertDm($this->getUser(), $scene->getSessionId());

        $data = json_decode($request->getContent(), true);

        if (isset($data['name'])) {
            $scene->setName($data['name']);
        }
        if (isset($data['grid_width'])) {
            $scene->setGridWidth(max(1, min(200, (int)$data['grid_width'])));
        }
        if (isset($data['grid_height'])) {
            $scene->setGridHeight(max(1, min(200, (int)$data['grid_height'])));
        }

        $entityManager->flush();

        return $this->json([
            'id' => $scene->getId(),
            'name' => $scene->getName(),
            'grid_width' => $scene->getGridWidth(),
            'grid_height' => $scene->getGridHeight(),
        ]);
    }

    #[Route('/api/scenes/{id}/fog', name: 'api_update_scene_fog', methods: ['PUT'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function updateSceneFog(int $id, Request $request, SceneRepository $sceneRepository, EntityManagerInterface $entityManager, UserGameSessionRepository $userGameSessionRepository): JsonResponse
    {
        $scene = $sceneRepository->find($id);
        if (!$scene) {
            return $this->json(['error' => 'Scene not found.'], 404);
        }

        $session = $scene->getSessionId();
        if (!$session) {
            return $this->json(['error' => 'Scene has no session.'], 400);
        }

        $ugs = $userGameSessionRepository->findOneBy(['user' => $this->getUser(), 'gameSession' => $session->getId()]);
        if (!$ugs || !$ugs->isDm()) {
            return $this->json(['error' => 'Forbidden.'], 403);
        }

        $raw = $request->getContent();
        if (strlen($raw) > 262144) {
            return $this->json(['error' => 'fog_data payload too large (max 256KB).'], 413);
        }
        $data = json_decode($raw, true);
        $scene->setFogData($data['fog_data'] ?? null);
        $entityManager->flush();

        return $this->json([
            'id' => $scene->getId(),
            'fog_data' => $scene->getFogData(),
        ]);
    }

    #[Route('/api/scenes/{id}/walls', name: 'api_update_scene_walls', methods: ['PUT'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function updateSceneWalls(int $id, Request $request, SceneRepository $sceneRepository, EntityManagerInterface $entityManager, UserGameSessionRepository $userGameSessionRepository): JsonResponse
    {
        $scene = $sceneRepository->find($id);
        if (!$scene) {
            return $this->json(['error' => 'Scene not found.'], 404);
        }

        $session = $scene->getSessionId();
        if (!$session) {
            return $this->json(['error' => 'Scene has no session.'], 400);
        }

        $ugs = $userGameSessionRepository->findOneBy(['user' => $this->getUser(), 'gameSession' => $session->getId()]);
        if (!$ugs || !$ugs->isDm()) {
            return $this->json(['error' => 'Forbidden.'], 403);
        }

        $raw = $request->getContent();
        if (strlen($raw) > 262144) {
            return $this->json(['error' => 'walls_data payload too large (max 256KB).'], 413);
        }
        $data = json_decode($raw, true);
        $scene->setWallsData($data['walls_data'] ?? null);
        $entityManager->flush();

        return $this->json([
            'id' => $scene->getId(),
            'walls_data' => $scene->getWallsData(),
        ]);
    }

}
