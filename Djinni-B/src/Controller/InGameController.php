<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class InGameController extends AbstractController
{
    #[Route('/in/game', name: 'app_in_game')]
    public function index(): Response
    {
        return $this->render('in_game/index.html.twig', [
            'controller_name' => 'InGameController',
        ]);
    }
}
