<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Security\UploadValidator;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\String\Slugger\SluggerInterface;

#[Route('/api/user')]
class ApiUserController extends AbstractController
{
    #[Route('/me', name: 'api_user_me', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function me(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        return $this->json([
            'id' => $user->getId(),
            'username' => $user->getUsername(),
            'email' => $user->getEmail(),
            'avatar_url' => $user->getAvatarUrl(),
            'roles' => $user->getRoles(),
            'is_admin' => in_array('ROLE_ADMIN', $user->getRoles(), true),
        ]);
    }

    #[Route('/me', name: 'api_user_update', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function update(
        Request $request,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
        UserRepository $userRepository,
        SluggerInterface $slugger,
        UploadValidator $uploadValidator
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        $username = trim((string) $request->request->get('username', ''));
        $email = trim((string) $request->request->get('email', ''));
        $newPassword = (string) $request->request->get('newPassword', '');
        $avatarFile = $request->files->get('avatar');

        if ($username === '' || $email === '') {
            return new JsonResponse(['error' => 'Usuario y email son obligatorios'], 400);
        }

        if (mb_strlen($username) > 50) {
            return new JsonResponse(['error' => 'El nombre de usuario es demasiado largo (máx 50).'], 400);
        }
        if (mb_strlen($email) > 180) {
            return new JsonResponse(['error' => 'El email es demasiado largo (máx 180).'], 400);
        }

        if ($email !== $user->getEmail()) {
            $existing = $userRepository->findOneBy(['email' => $email]);
            if ($existing && $existing->getId() !== $user->getId()) {
                return new JsonResponse(['error' => 'Ese email ya está en uso'], 409);
            }
        }

        $user->setUsername($username);
        $user->setEmail($email);

        if ($newPassword !== '') {
            if (strlen($newPassword) < 12) {
                return new JsonResponse(['error' => 'La contraseña debe tener al menos 12 caracteres'], 400);
            }
            $user->setPassword($passwordHasher->hashPassword($user, $newPassword));
        }

        if ($avatarFile) {
            $uploadValidator->assertImage($avatarFile);
            $originalFilename = pathinfo($avatarFile->getClientOriginalName(), PATHINFO_FILENAME);
            $safeFilename = $slugger->slug($originalFilename);
            $newFilename = $safeFilename . '-' . uniqid() . '.' . $avatarFile->guessExtension();

            try {
                $destination = $this->getParameter('kernel.project_dir') . '/uploads/avatars';
                $avatarFile->move($destination, $newFilename);
                $user->setAvatarUrl('/uploads/avatars/' . $newFilename);
            } catch (FileException $e) {
                return new JsonResponse(['error' => 'Error al subir el avatar'], 500);
            }
        }

        try {
            $entityManager->flush();
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'No se pudo guardar: ' . $e->getMessage()], 500);
        }

        return $this->json([
            'id' => $user->getId(),
            'username' => $user->getUsername(),
            'email' => $user->getEmail(),
            'avatar_url' => $user->getAvatarUrl(),
        ]);
    }
}
