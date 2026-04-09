<?php

namespace App\Controller;

use App\Entity\Scene;
use App\Entity\SceneToken;
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
                'id' => $st->getId(),
                'col' => $st->getCol(),
                'row' => $st->getRow(),
                'layer' => $st->getLayer(),
                'color' => $st->getColor(),
            ];

            if ($st->getToken()) {
                $data['token_id'] = $st->getToken()->getId();
                $data['image_url'] = $st->getToken()->getImageUrl();
                $data['name'] = $st->getToken()->getName();
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

        if (isset($data['token_id'])) {
            $token = $tokenRepository->find($data['token_id']);
            if ($token) {
                $sceneToken->setToken($token);
            }
        }

        $em->persist($sceneToken);
        $em->flush();

        return $this->json([
            'id' => $sceneToken->getId(),
            'col' => $sceneToken->getCol(),
            'row' => $sceneToken->getRow(),
            'layer' => $sceneToken->getLayer(),
            'color' => $sceneToken->getColor()
        ], 201);
    }

    #[Route('/{id}', name: 'api_scene_token_update', methods: ['PUT'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function updateSceneToken(int $id, Request $request, SceneTokenRepository $sceneTokenRepository, EntityManagerInterface $em): JsonResponse
    {
        $sceneToken = $sceneTokenRepository->find($id);
        if (!$sceneToken) {
            return $this->json(['error' => 'Scene token not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['col'])) {
            $sceneToken->setCol($data['col']);
        }
        if (isset($data['row'])) {
            $sceneToken->setRow($data['row']);
        }
        if (isset($data['layer'])) {
            $sceneToken->setLayer($data['layer']);
        }

        $em->flush();

        return $this->json([
            'id' => $sceneToken->getId(),
            'col' => $sceneToken->getCol(),
            'row' => $sceneToken->getRow(),
            'layer' => $sceneToken->getLayer()
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
