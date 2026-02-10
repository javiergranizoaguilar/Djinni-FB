<?php

namespace App\Controller\control_usuario;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
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
        SluggerInterface $slugger
    ): JsonResponse
    {
        // 1. Recibir los datos de React (FormData llega como $request->request y $request->files)
        $email = $request->request->get('email');
        $password = $request->request->get('password');
        $username = $request->request->get('username');
        $avatarFile = $request->files->get('avatar');

        if (!$email || !$password || !$username) {
            return new JsonResponse(['error' => 'Faltan datos obligatorios (email, password, username)'], 400);
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
