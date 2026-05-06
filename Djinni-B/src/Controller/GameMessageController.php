<?php

namespace App\Controller;

use App\Repository\GameMessageRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('IS_AUTHENTICATED_FULLY')]
class GameMessageController extends AbstractController
{
    #[Route('/api/game/{gameId}/messages', name: 'api_game_messages', methods: ['GET'])]
    public function history(int $gameId, GameMessageRepository $repo): JsonResponse
    {
        $messages = $repo->findLast50ByGame($gameId);

        $data = array_map(fn($m) => [
            'id'         => $m->getId(),
            'senderName' => $m->getSender()->getUsername() ?? $m->getSender()->getEmail(),
            'content'    => $m->getContent(),
            'createdAt'  => $m->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ], $messages);

        return $this->json($data);
    }
}
