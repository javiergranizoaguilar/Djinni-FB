<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class UploadsController extends AbstractController
{
    #[Route('/uploads/{folder}/{filename}', name: 'get_upload', methods: ['GET'], requirements: ['folder' => 'avatars|game_images|character_images'])]
    public function getUpload(string $folder, string $filename): Response
    {
        $path = $this->getParameter('kernel.project_dir') . '/uploads/' . $folder . '/' . $filename;

        if (!file_exists($path)) {
            throw $this->createNotFoundException('File not found');
        }

        return new BinaryFileResponse($path);
    }
}
