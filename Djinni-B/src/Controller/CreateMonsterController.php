<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class CreateMonsterController extends AbstractController
{
    #[Route('/create/monster', name: 'app_create_monster')]
    public function index(): Response
    {
        return $this->render('create_monster/index.html.twig', [
            'controller_name' => 'CreateMonsterController',
        ]);
    }
}
