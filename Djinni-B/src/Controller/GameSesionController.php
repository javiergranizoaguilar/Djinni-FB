<?php

namespace App\Controller;

use App\Entity\GameSesion;
use App\Entity\Scene;
use App\Form\GameSesionType;
use App\Repository\GameSesionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/game/sesion')]
final class GameSesionController extends AbstractController
{
    #[Route(name: 'app_game_sesion_index', methods: ['GET'])]
    public function index(GameSesionRepository $gameSesionRepository): Response
    {
        return $this->render('game_sesion/index.html.twig', [
            'game_sesions' => $gameSesionRepository->findAll(),
        ]);
    }

    #[Route('/new', name: 'app_game_sesion_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $gameSesion = new GameSesion();
        $form = $this->createForm(GameSesionType::class, $gameSesion);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($gameSesion);
            $entityManager->flush();

            // Create a default scene for the new game session
            $scene = new Scene();
            $scene->setName('Default Scene');
            $scene->setGridWidth(10);
            $scene->setGridHeight(10);
            $scene->setSessionId($gameSesion);

            $entityManager->persist($scene);
            $entityManager->flush();

            return $this->redirectToRoute('app_game_sesion_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('game_sesion/new.html.twig', [
            'game_sesion' => $gameSesion,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_game_sesion_show', methods: ['GET'])]
    public function show(GameSesion $gameSesion): Response
    {
        return $this->render('game_sesion/show.html.twig', [
            'game_sesion' => $gameSesion,
        ]);
    }

    #[Route('/{id}/edit', name: 'app_game_sesion_edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, GameSesion $gameSesion, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(GameSesionType::class, $gameSesion);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            return $this->redirectToRoute('app_game_sesion_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('game_sesion/edit.html.twig', [
            'game_sesion' => $gameSesion,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_game_sesion_delete', methods: ['POST'])]
    public function delete(Request $request, GameSesion $gameSesion, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete'.$gameSesion->getId(), $request->getPayload()->getString('_token'))) {
            $entityManager->remove($gameSesion);
            $entityManager->flush();
        }

        return $this->redirectToRoute('app_game_sesion_index', [], Response::HTTP_SEE_OTHER);
    }
}
