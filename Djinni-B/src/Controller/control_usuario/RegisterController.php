<?php

namespace App\Controller\control_usuario;

use App\Entity\User;
use App\Security\UploadValidator;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\String\Slugger\SluggerInterface;
use Symfony\Component\HttpFoundation\File\Exception\FileException;

class RegisterController extends AbstractController
{
    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function register(
        Request $request,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $entityManager,
        SluggerInterface $slugger,
        UploadValidator $uploadValidator,
        #[Autowire(service: 'limiter.register')] RateLimiterFactory $registerLimiter
    ): JsonResponse
    {
        // Rate-limit by IP: defeats brute-force account creation.
        $limiter = $registerLimiter->create($request->getClientIp() ?? 'anon');
        $consumed = $limiter->consume(1);
        if (!$consumed->isAccepted()) {
            $retryAfter = (int)max(1, $consumed->getRetryAfter()->getTimestamp() - time());
            return new JsonResponse(
                ['error' => 'Demasiadas peticiones de registro. Inténtalo más tarde.'],
                429,
                ['Retry-After' => $retryAfter]
            );
        }

        // 1. Recibir los datos de React (FormData llega como $request->request y $request->files)
        $email = $request->request->get('email');
        $password = $request->request->get('password');
        $username = $request->request->get('username');
        $avatarFile = $request->files->get('avatar');

        if (!$email || !$password || !$username) {
            return new JsonResponse(['error' => 'Faltan datos obligatorios (email, password, username)'], 400);
        }

        if (mb_strlen($username) > 50) {
            return new JsonResponse(['error' => 'El nombre de usuario es demasiado largo (máx 50).'], 400);
        }
        if (mb_strlen($email) > 180) {
            return new JsonResponse(['error' => 'El email es demasiado largo (máx 180).'], 400);
        }
        if (strlen($password) < 12) {
            return new JsonResponse(['error' => 'La contraseña debe tener al menos 12 caracteres.'], 400);
        }

        // 2. Crear el objeto Usuario
        $user = new User();
        $user->setEmail($email);
        $user->setUsername($username);
        $user->setDatetime(new \DateTimeImmutable()); // Guardar fecha de creación

        // 3. ENCRIPTAR la contraseña
        $hashedPassword = $passwordHasher->hashPassword($user, $password);
        $user->setPassword($hashedPassword);

        // 4. Manejar la subida de imagen (Avatar)
        if ($avatarFile) {
            $uploadValidator->assertImage($avatarFile);
            $originalFilename = pathinfo($avatarFile->getClientOriginalName(), PATHINFO_FILENAME);
            // Incluye el nombre del archivo de forma segura en la URL
            $safeFilename = $slugger->slug($originalFilename);
            $newFilename = $safeFilename.'-'.uniqid().'.'.$avatarFile->guessExtension();

            try {
                // Mueve el archivo al directorio configurado (asegúrate de tener 'avatars_directory' en services.yaml o usar una ruta directa)
                // Para simplificar, usaremos una ruta relativa a public/uploads/avatars
                $destination = $this->getParameter('kernel.project_dir').'/uploads/avatars';

                $avatarFile->move(
                    $destination,
                    $newFilename
                );

                // Guardar la ruta relativa en la base de datos
                $user->setAvatarUrl('/uploads/avatars/'.$newFilename);

            } catch (FileException $e) {
                return new JsonResponse(['error' => 'Error al subir la imagen'], 500);
            }
        }

        // 5. Guardar en Base de Datos
        try {
            $entityManager->persist($user);
            $entityManager->flush();
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'El usuario o email ya existe: ' . $e->getMessage()], 409);
        }

        return new JsonResponse(['message' => 'Usuario creado correctamente'], 201);
    }
}
