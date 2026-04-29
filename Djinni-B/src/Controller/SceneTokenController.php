<?php

namespace App\Controller;

use App\Entity\Scene;
use App\Entity\SceneToken;
use App\Entity\User;
use App\Repository\GameSesionRepository;
use App\Repository\UserRepository;
use App\Repository\SceneRepository;
use App\Repository\SceneTokenRepository;
use App\Repository\TokenRepository;
use App\Repository\UserGameSessionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/scene-token')]
class SceneTokenController extends AbstractController
{
    #[Route('/scene/{sceneId}', name: 'api_scene_token_get', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function getSceneTokens(int $sceneId, SceneRepository $sceneRepository, SceneTokenRepository $sceneTokenRepository, UserGameSessionRepository $userGameSessionRepository): JsonResponse
    {
        $scene = $sceneRepository->find($sceneId);
        if (!$scene) {
            return $this->json(['error' => 'Scene not found'], 404);
        }

        $isDm = false;
        $user = $this->getUser();
        if ($user && $scene->getSessionId()) {
            $userGameSession = $userGameSessionRepository->findOneBy([
                'user' => $user,
                'gameSession' => $scene->getSessionId()
            ]);
            if ($userGameSession) {
                $isDm = $userGameSession->isDm();
            }
        }

        $tokens = $sceneTokenRepository->findBy(['scene' => $scene]);

        $tokensData = [];
        foreach ($tokens as $st) {
            if (!$isDm && $st->getLayer() === 'gm') {
                continue;
            }

            $data = [
                'id'        => $st->getId(),
                'col'       => $st->getCol(),
                'row'       => $st->getRow(),
                'x'         => $st->getX(),
                'y'         => $st->getY(),
                'layer'     => $st->getLayer(),
                'color'     => $st->getColor(),
                'name'      => $st->getName(),
                'image_url' => $st->getImageUrl(),
                'width'     => $st->getWidth(),
                'height'    => $st->getHeight(),
                'counters'  => $st->getCounters(),
                'auras'     => $st->getAuras() ?? [],
                'kind'           => $st->getKind(),
                'entity_id'      => $st->getEntityId(),
                'owner_id'       => $st->getOwner()?->getId(),
                'controlled_by_id' => $st->getControlledBy()?->getId(),
            ];

            if ($st->getToken()) {
                $data['token_id']  = $st->getToken()->getId();
                $data['image_url'] = $st->getToken()->getImageUrl();
                $data['name']      = $st->getToken()->getName();
            }

            $tokensData[] = $data;
        }

        return $this->json($tokensData);
    }

    #[Route('/scene/{sceneId}', name: 'api_scene_token_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function createSceneToken(int $sceneId, Request $request, SceneRepository $sceneRepository, TokenRepository $tokenRepository, EntityManagerInterface $em): JsonResponse
    {
        $scene = $sceneRepository->find($sceneId);
        if (!$scene) {
            return $this->json(['error' => 'Scene not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        $sceneToken = new SceneToken();
        $sceneToken->setScene($scene);
        $sceneToken->setCol($data['col'] ?? 0);
        $sceneToken->setRow($data['row'] ?? 0);
        $sceneToken->setLayer($data['layer'] ?? 'user');
        $sceneToken->setColor($data['color'] ?? 'gray');
        $sceneToken->setName($data['name'] ?? null);
        $sceneToken->setImageUrl($data['image_url'] ?? null);
        $sceneToken->setWidth(isset($data['width']) ? (float)$data['width'] : null);
        $sceneToken->setHeight(isset($data['height']) ? (float)$data['height'] : null);
        $sceneToken->setX(isset($data['x']) ? (float)$data['x'] : null);
        $sceneToken->setY(isset($data['y']) ? (float)$data['y'] : null);
        $sceneToken->setCounters($data['counters'] ?? null);
        $sceneToken->setAuras($data['auras'] ?? null);
        $sceneToken->setKind($data['kind'] ?? null);
        $sceneToken->setEntityId(isset($data['entity_id']) ? (int)$data['entity_id'] : null);
        $sceneToken->setOwner($this->getUser());

        if (isset($data['token_id'])) {
            $token = $tokenRepository->find($data['token_id']);
            if ($token) {
                $sceneToken->setToken($token);
            }
        }

        $em->persist($sceneToken);
        $em->flush();

        return $this->json([
            'id'        => $sceneToken->getId(),
            'col'       => $sceneToken->getCol(),
            'row'       => $sceneToken->getRow(),
            'x'         => $sceneToken->getX(),
            'y'         => $sceneToken->getY(),
            'layer'     => $sceneToken->getLayer(),
            'color'     => $sceneToken->getColor(),
            'name'      => $sceneToken->getName(),
            'image_url' => $sceneToken->getImageUrl(),
            'width'     => $sceneToken->getWidth(),
            'height'    => $sceneToken->getHeight(),
            'counters'  => $sceneToken->getCounters(),
            'auras'     => $sceneToken->getAuras() ?? [],
            'kind'             => $sceneToken->getKind(),
            'entity_id'        => $sceneToken->getEntityId(),
            'owner_id'         => $sceneToken->getOwner()?->getId(),
            'controlled_by_id' => $sceneToken->getControlledBy()?->getId(),
        ], 201);
    }

    #[Route('/session/{sessionId}/used', name: 'api_scene_token_used', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function usedBySession(int $sessionId, GameSesionRepository $gameSesionRepository, SceneTokenRepository $sceneTokenRepository, UserGameSessionRepository $userGameSessionRepository): JsonResponse
    {
        $session = $gameSesionRepository->find($sessionId);
        if (!$session) {
            return $this->json(['error' => 'Session not found'], 404);
        }

        $isDm = false;
        $user = $this->getUser();
        if ($user) {
            $ugs = $userGameSessionRepository->findOneBy(['user' => $user, 'gameSession' => $session]);
            if ($ugs) $isDm = $ugs->isDm();
        }

        $sceneTokens = $sceneTokenRepository->findUsedBySession($sessionId);

        // Deduplicar: tokens enlazados por token_id, custom por nombre+color
        $seen    = [];
        $result  = [];

        foreach ($sceneTokens as $st) {
            if (!$isDm && $st->getLayer() === 'gm') continue;

            if ($st->getToken()) {
                $key = 'token_' . $st->getToken()->getId();
                if (isset($seen[$key])) continue;
                $seen[$key] = true;
                $result[] = [
                    'kind'      => 'linked',
                    'token_id'  => $st->getToken()->getId(),
                    'name'      => $st->getToken()->getName(),
                    'image_url' => $st->getToken()->getImageUrl(),
                    'color'     => $st->getColor(),
                ];
            } else {
                $key = 'custom_' . $st->getName() . '_' . $st->getColor();
                if (isset($seen[$key])) continue;
                $seen[$key] = true;
                $result[] = [
                    'kind'  => 'custom',
                    'name'  => $st->getName(),
                    'color' => $st->getColor(),
                ];
            }
        }

        return $this->json($result);
    }

    #[Route('/{id}', name: 'api_scene_token_update', methods: ['PUT'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function updateSceneToken(int $id, Request $request, SceneTokenRepository $sceneTokenRepository, UserGameSessionRepository $userGameSessionRepository, EntityManagerInterface $em): JsonResponse
    {
        $sceneToken = $sceneTokenRepository->find($id);
        if (!$sceneToken) {
            return $this->json(['error' => 'Scene token not found'], 404);
        }

        $currentUser = $this->getUser();
        $isDm = false;
        $gameSession = $sceneToken->getScene()?->getSessionId();
        if ($gameSession) {
            $ugs = $userGameSessionRepository->findOneBy(['user' => $currentUser, 'gameSession' => $gameSession]);
            if ($ugs) $isDm = $ugs->isDm();
        }

        $isOwner      = $sceneToken->getOwner()?->getId() === $currentUser?->getId();
        $isController = $sceneToken->getControlledBy()?->getId() === $currentUser?->getId();

        $data = json_decode($request->getContent(), true);

        $isPositionChange = isset($data['col']) || isset($data['row']) || isset($data['layer'])
            || isset($data['width']) || isset($data['height'])
            || array_key_exists('x', $data) || array_key_exists('y', $data);

        if ($isPositionChange && !$isDm && !$isOwner && !$isController) {
            return $this->json(['error' => 'Forbidden'], 403);
        }

        if (isset($data['col'])) {
            $sceneToken->setCol($data['col']);
        }
        if (isset($data['row'])) {
            $sceneToken->setRow($data['row']);
        }
        if (array_key_exists('x', $data)) $sceneToken->setX($data['x'] !== null ? (float)$data['x'] : null);
        if (array_key_exists('y', $data)) $sceneToken->setY($data['y'] !== null ? (float)$data['y'] : null);
        if (isset($data['layer']))    $sceneToken->setLayer($data['layer']);
        if (isset($data['width']))    $sceneToken->setWidth((float)$data['width']);
        if (isset($data['height']))   $sceneToken->setHeight((float)$data['height']);
        if (array_key_exists('counters', $data)) $sceneToken->setCounters($data['counters']);
        if (array_key_exists('auras', $data))    $sceneToken->setAuras($data['auras']);

        $em->flush();

        return $this->json([
            'id'        => $sceneToken->getId(),
            'col'       => $sceneToken->getCol(),
            'row'       => $sceneToken->getRow(),
            'x'         => $sceneToken->getX(),
            'y'         => $sceneToken->getY(),
            'layer'     => $sceneToken->getLayer(),
            'image_url' => $sceneToken->getImageUrl(),
            'width'     => $sceneToken->getWidth(),
            'height'    => $sceneToken->getHeight(),
            'counters'  => $sceneToken->getCounters(),
            'auras'     => $sceneToken->getAuras() ?? [],
        ]);
    }

    #[Route('/{id}/control', name: 'api_scene_token_set_control', methods: ['PUT'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function setControl(int $id, Request $request, SceneTokenRepository $sceneTokenRepository, UserGameSessionRepository $userGameSessionRepository, UserRepository $userRepository, EntityManagerInterface $em): JsonResponse
    {
        $sceneToken = $sceneTokenRepository->find($id);
        if (!$sceneToken) {
            return $this->json(['error' => 'Scene token not found'], 404);
        }

        $currentUser = $this->getUser();
        $isDm = false;
        $gameSession = $sceneToken->getScene()?->getSessionId();
        if ($gameSession) {
            $ugs = $userGameSessionRepository->findOneBy(['user' => $currentUser, 'gameSession' => $gameSession]);
            if ($ugs) $isDm = $ugs->isDm();
        }

        if (!$isDm) {
            return $this->json(['error' => 'Forbidden'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $userId = $data['user_id'] ?? null;

        $sceneToken->setControlledBy($userId ? $userRepository->find($userId) : null);
        $em->flush();

        return $this->json([
            'id'               => $sceneToken->getId(),
            'controlled_by_id' => $sceneToken->getControlledBy()?->getId(),
        ]);
    }

    #[Route('/{id}', name: 'api_scene_token_delete', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function deleteSceneToken(int $id, SceneTokenRepository $sceneTokenRepository, EntityManagerInterface $em): JsonResponse
    {
        $sceneToken = $sceneTokenRepository->find($id);
        if (!$sceneToken) {
            return $this->json(['error' => 'Scene token not found'], 404);
        }

        $em->remove($sceneToken);
        $em->flush();

        return $this->json(['message' => 'Token deleted']);
    }
}
