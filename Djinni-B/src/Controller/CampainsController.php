<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class CampainsController extends AbstractController
{
    #[Route('/campains', name: 'app_campains')]
    public function index(): Response
    {
        return $this->render('campains/index.html.twig', [
            'controller_name' => 'CampainsController',
        ]);
    }
}
