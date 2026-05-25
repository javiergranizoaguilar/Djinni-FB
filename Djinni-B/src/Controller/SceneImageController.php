<?php

namespace App\Controller;

use App\Entity\SceneImage;
use App\Repository\SceneImageRepository;
use App\Repository\SceneRepository;
use App\Repository\UserGameSessionRepository;
use App\Security\UploadValidator;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/scene-image')]
class SceneImageController extends AbstractController
{
    private function toArray(SceneImage $img): array
    {
        return [
            'id'        => $img->getId(),
            'image_url' => $img->getImageUrl(),
            'x'         => $img->getX(),
            'y'         => $img->getY(),
            'width'     => $img->getWidth(),
            'height'    => $img->getHeight(),
            'layer'     => $img->getLayer(),
        ];
    }

    #[Route('/scene/{sceneId}', name: 'api_scene_image_list', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function list(int $sceneId, SceneRepository $sceneRepository, SceneImageRepository $repo, UserGameSessionRepository $ugsRepo): JsonResponse
    {
        $scene = $sceneRepository->find($sceneId);
        if (!$scene) {
            return $this->json(['error' => 'Scene not found'], 404);
        }

        $isDm = false;
        $user = $this->getUser();
        if ($user && $scene->getSessionId()) {
            $ugs = $ugsRepo->findOneBy(['user' => $user, 'gameSession' => $scene->getSessionId()]);
            if ($ugs) $isDm = $ugs->isDm();
        }

        $images = $repo->findBy(['scene' => $scene]);
        $result = [];
        foreach ($images as $img) {
            if (!$isDm && $img->getLayer() === 'gm') continue;
            $result[] = $this->toArray($img);
        }

        return $this->json($result);
    }

    #[Route('/scene/{sceneId}/upload', name: 'api_scene_image_upload', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function upload(int $sceneId, Request $request, SceneRepository $sceneRepository, UserGameSessionRepository $ugsRepo, EntityManagerInterface $em, UploadValidator $uploadValidator, #[Autowire(service: 'limiter.uploads')] RateLimiterFactory $uploadsLimiter): JsonResponse
    {
        $scene = $sceneRepository->find($sceneId);
        if (!$scene) {
            return $this->json(['error' => 'Scene not found'], 404);
        }

        $ugs = $ugsRepo->findOneBy(['user' => $this->getUser(), 'gameSession' => $scene->getSessionId()]);
        if (!$ugs || !$ugs->isDm()) {
            return $this->json(['error' => 'Only the DM can manage scene images'], 403);
        }

        // Rate-limit by user id: 30 image uploads / minute is generous for normal play.
        $key = 'u' . ($this->getUser()?->getId() ?? 'anon');
        $consumed = $uploadsLimiter->create($key)->consume(1);
        if (!$consumed->isAccepted()) {
            return $this->json(['error' => 'Demasiadas subidas, inténtalo en un momento.'], 429);
        }

        $file = $request->files->get('image');
        $uploadValidator->assertImage($file);

        $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads/scene-images';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }

        $filename = uniqid('si_') . '.' . $file->guessExtension();
        $file->move($uploadDir, $filename);

        $img = new SceneImage();
        $img->setScene($scene);
        $img->setImageUrl('/uploads/scene-images/' . $filename);
        $img->setX((float)($request->request->get('x') ?? 0));
        $img->setY((float)($request->request->get('y') ?? 0));
        $img->setWidth((float)($request->request->get('width') ?? 200));
        $img->setHeight((float)($request->request->get('height') ?? 200));
        $img->setLayer($request->request->get('layer') ?? 'background');

        $em->persist($img);
        $em->flush();

        return $this->json($this->toArray($img), 201);
    }

    #[Route('/{id}', name: 'api_scene_image_update', methods: ['PUT'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function update(int $id, Request $request, SceneImageRepository $repo, UserGameSessionRepository $ugsRepo, EntityManagerInterface $em): JsonResponse
    {
        $img = $repo->find($id);
        if (!$img) {
            return $this->json(['error' => 'Image not found'], 404);
        }

        $ugs = $ugsRepo->findOneBy(['user' => $this->getUser(), 'gameSession' => $img->getScene()->getSessionId()]);
        if (!$ugs || !$ugs->isDm()) {
            return $this->json(['error' => 'Only the DM can manage scene images'], 403);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['x']))      $img->setX((float)$data['x']);
        if (isset($data['y']))      $img->setY((float)$data['y']);
        if (isset($data['width']))  $img->setWidth((float)$data['width']);
        if (isset($data['height'])) $img->setHeight((float)$data['height']);
        if (isset($data['layer']))  $img->setLayer($data['layer']);

        $em->flush();

        return $this->json($this->toArray($img));
    }

    #[Route('/{id}', name: 'api_scene_image_delete', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function delete(int $id, SceneImageRepository $repo, UserGameSessionRepository $ugsRepo, EntityManagerInterface $em, UploadValidator $uploadValidator): JsonResponse
    {
        $img = $repo->find($id);
        if (!$img) {
            return $this->json(['error' => 'Image not found'], 404);
        }

        $ugs = $ugsRepo->findOneBy(['user' => $this->getUser(), 'gameSession' => $img->getScene()->getSessionId()]);
        if (!$ugs || !$ugs->isDm()) {
            return $this->json(['error' => 'Only the DM can manage scene images'], 403);
        }

        $imageUrl = $img->getImageUrl();

        $em->remove($img);
        $em->flush();

        if ($imageUrl) {
            $uploadsBase = $this->getParameter('kernel.project_dir') . '/public/uploads';
            $filePath = $this->getParameter('kernel.project_dir') . '/public' . $imageUrl;
            // Defence in depth: only unlink files that resolve under public/uploads/ — prevents
            // a forged imageUrl ('/../etc/...') from removing files outside the uploads tree.
            if (file_exists($filePath) && $uploadValidator->pathIsWithin($filePath, $uploadsBase)) {
                unlink($filePath);
            }
        }

        return $this->json(['message' => 'Image deleted']);
    }
}
