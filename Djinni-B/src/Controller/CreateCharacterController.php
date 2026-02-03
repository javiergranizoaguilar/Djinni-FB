<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class CreateCharacterController extends AbstractController
{
    #[Route('/create/character', name: 'app_create_character')]
    public function index(): Response
    {
        return $this->render('create_character/index.html.twig', [
            'controller_name' => 'CreateCharacterController',
        ]);
    }
}
