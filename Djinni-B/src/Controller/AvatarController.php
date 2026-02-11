<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class AvatarController extends AbstractController
{
    #[Route('/uploads/avatars/{filename}', name: 'get_avatar', methods: ['GET'])]
    public function getAvatar(string $filename): Response
    {
        $path = $this->getParameter('kernel.project_dir') . '/uploads/avatars/' . $filename;

        if (!file_exists($path)) {
            throw $this->createNotFoundException('Avatar not found');
        }

        return new BinaryFileResponse($path);
    }
}
