<?php

namespace App\Controller;

use App\Entity\Scene;
use App\Form\SceneType;
use App\Repository\GameSesionRepository;
use App\Repository\SceneRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/scene')]
final class SceneController extends AbstractController
{
    #[Route(name: 'app_scene_index', methods: ['GET'])]
    public function index(SceneRepository $sceneRepository): Response
    {
        return $this->render('scene/index.html.twig', [
            'scenes' => $sceneRepository->findAll(),
        ]);
    }

    #[Route('/new', name: 'app_scene_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $scene = new Scene();
        $form = $this->createForm(SceneType::class, $scene);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($scene);
            $entityManager->flush();

            return $this->redirectToRoute('app_scene_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('scene/new.html.twig', [
            'scene' => $scene,
            'form' => $form,
        ]);
    }

    /**
     * API endpoint to create a new scene for a game session.
     */
    #[Route('/api/game/{gameId}/scenes', name: 'api_create_scene_for_game', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function createSceneForGame(int $gameId, Request $request, EntityManagerInterface $entityManager, GameSesionRepository $gameSesionRepository): JsonResponse
    {
        $game = $gameSesionRepository->find($gameId);
        if (!$game) {
            return $this->json(['error' => 'Game session not found.'], 404);
        }

        $data = json_decode($request->getContent(), true);
        $scene = new Scene();
        $scene->setName($data['name'] ?? 'New Scene');
        $scene->setGridWidth($data['grid_width'] ?? 20);
        $scene->setGridHeight($data['grid_height'] ?? 20);
        $scene->setSessionId($game);

        $entityManager->persist($scene);
        $entityManager->flush();

        return $this->json([
            'id' => $scene->getId(),
            'name' => $scene->getName(),
            'grid_width' => $scene->getGridWidth(),
            'grid_height' => $scene->getGridHeight(),
        ]);
    }

    /**
     * API endpoint to get the first scene for a given game session.
     */
    #[Route('/api/game/{gameId}/active-scene', name: 'api_get_active_scene_for_game', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function getActiveSceneForGame(int $gameId, SceneRepository $sceneRepository): JsonResponse
    {
        // Find the first scene associated with the game session
        $scene = $sceneRepository->findOneBy(['session_id' => $gameId]);

        if (!$scene) {
            return $this->json(['error' => 'No scene found for this game session.'], 404);
        }

        return $this->json([
            'id' => $scene->getId(),
            'name' => $scene->getName(),
            'grid_width' => $scene->getGridWidth(),
            'grid_height' => $scene->getGridHeight(),
        ]);
    }

    /**
     * API endpoint to get all scenes for a given game session.
     */
    #[Route('/api/game/{gameId}/scenes', name: 'api_get_scenes_for_game', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function getScenesForGame(int $gameId, SceneRepository $sceneRepository): JsonResponse
    {
        $scenes = $sceneRepository->findBy(['session_id' => $gameId]);

        if (empty($scenes)) {
            return $this->json(['error' => 'No scenes found for this game session.'], 404);
        }

        $scenesData = array_map(function (Scene $scene) {
            return [
                'id' => $scene->getId(),
                'name' => $scene->getName(),
                'grid_width' => $scene->getGridWidth(),
                'grid_height' => $scene->getGridHeight(),
            ];
        }, $scenes);

        return $this->json($scenesData);
    }

    #[Route('/{id}', name: 'app_scene_show', methods: ['GET'])]
    public function show(Scene $scene): Response
    {
        return $this->render('scene/show.html.twig', [
            'scene' => $scene,
        ]);
    }

    #[Route('/{id}/edit', name: 'app_scene_edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, Scene $scene, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(SceneType::class, $scene);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            return $this->redirectToRoute('app_scene_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('scene/edit.html.twig', [
            'scene' => $scene,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_scene_delete', methods: ['POST'])]
    public function delete(Request $request, Scene $scene, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete'.$scene->getId(), $request->getPayload()->getString('_token'))) {
            $entityManager->remove($scene);
            $entityManager->flush();
        }

        return $this->redirectToRoute('app_scene_index', [], Response::HTTP_SEE_OTHER);
    }
}
