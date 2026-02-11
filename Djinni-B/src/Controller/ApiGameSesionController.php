<?php

namespace App\Controller;

use App\Entity\GameSesion;
use App\Entity\User;
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
        $gameSesion->setIsGm(true);

        $gameSesion->addPlayer($user);

        $entityManager->persist($gameSesion);
        $entityManager->flush();

        return $this->json([
            'id' => $gameSesion->getId(),
            'title' => $gameSesion->getTitle(),
            'message' => 'Game session created successfully'
        ], 201);
    }
}
