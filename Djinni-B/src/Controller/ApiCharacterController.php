<?php

namespace App\Controller;

use App\Entity\CharacterSheet;
use App\Entity\CharacterSheetUser;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\String\Slugger\SluggerInterface;

#[Route('/api/character')]
class ApiCharacterController extends AbstractController
{
    #[Route('/create', name: 'api_character_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function create(Request $request, EntityManagerInterface $entityManager, LoggerInterface $logger): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'User not authenticated'], 401);
        }

        $data = json_decode($request->getContent(), true);
        $name = $data['name'] ?? null;

        if (!$name) {
            return $this->json(['error' => 'Character name is required'], 400);
        }

        // 1. Crear la hoja de personaje
        $characterSheet = new CharacterSheet();
        $characterSheet->setName($name);

        // Inicializar valores por defecto mínimos necesarios
        $characterSheet->setCasterLevel(0);
        $characterSheet->setStats([
            'strength' => 10,
            'dexterity' => 10,
            'constitution' => 10,
            'intelligence' => 10,
            'wisdom' => 10,
            'charisma' => 10
        ]);
        $characterSheet->setCurrency(['gp' => 0, 'sp' => 0, 'cp' => 0]);
        $characterSheet->setLevel(['class' => '', 'level' => 1, 'subclass' => '']);

        $entityManager->persist($characterSheet);

        // 2. Asociar al usuario mediante la tabla intermedia CharacterSheetUser
        $characterSheetUser = new CharacterSheetUser();
        $characterSheetUser->setUserId($user);
        $characterSheetUser->setCharactersheetId($characterSheet);
        $characterSheetUser->setVisible(true); // Visible para el dueño
        $characterSheetUser->setEdit(true);    // Editable por el dueño

        $entityManager->persist($characterSheetUser);
        $entityManager->flush();

        return $this->json([
            'message' => 'Character created successfully',
            'id' => $characterSheet->getId(),
            'name' => $characterSheet->getName()
        ], 201);
    }

    #[Route('/my-characters', name: 'api_character_list', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function list(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'User not authenticated'], 401);
        }

        $characterSheetUsers = $user->getCharacterSheetUsers();
        $characters = [];

        foreach ($characterSheetUsers as $csu) {
            $sheet = $csu->getCharactersheetId();
            if ($sheet) {
                $levelData = $sheet->getLevel();
                $level = isset($levelData['level']) ? $levelData['level'] : 1;

                $characters[] = [
                    'id' => $sheet->getId(),
                    'name' => $sheet->getName(),
                    'caster_level' => $sheet->getCasterLevel(),
                    'level' => $sheet->getLevel(), // Devuelve el objeto completo
                    'display_level' => $level,     // Devuelve solo el número para la lista
                    'token_image' => $sheet->getTokenImage(),
                    'portrait_image' => $sheet->getPortraitImage(),
                    'stats' => $sheet->getStats(),
                    'currency' => $sheet->getCurrency(),
                    'is_editable' => $csu->isEdit(),
                    'spellcasting_abillity' => $sheet->getSpellcastingAbillity(),
                    'apareance' => $sheet->getApareance(),
                    'backstory' => $sheet->getBackstory(),
                    'personality_traits' => $sheet->getPersonalityTraits(),
                    'ideals' => $sheet->getIdeals(),
                    'bonds' => $sheet->getBonds(),
                    'flaws' => $sheet->getFlaws(),
                    'exaustion' => $sheet->getExaustion(),
                ];
            }
        }

        return $this->json($characters);
    }

    #[Route('/edit/{id}', name: 'api_character_edit', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function edit(int $id, Request $request, EntityManagerInterface $entityManager, SluggerInterface $slugger): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'User not authenticated'], 401);
        }

        $characterSheet = $entityManager->getRepository(CharacterSheet::class)->find($id);

        if (!$characterSheet) {
            return $this->json(['error' => 'Character not found'], 404);
        }

        // Verificar permisos
        $csu = $entityManager->getRepository(CharacterSheetUser::class)->findOneBy([
            'user_id' => $user,
            'charactersheet_id' => $characterSheet
        ]);

        if (!$csu || !$csu->isEdit()) {
            return $this->json(['error' => 'You do not have permission to edit this character'], 403);
        }

        // Procesar campos simples
        $fields = ['name', 'spellcasting_abillity', 'apareance', 'backstory', 'personality_traits', 'ideals', 'bonds', 'flaws'];
        foreach ($fields as $field) {
            if ($request->request->has($field)) {
                $setter = 'set' . str_replace('_', '', ucwords($field, '_'));
                $characterSheet->$setter($request->request->get($field));
            }
        }

        if ($request->request->has('caster_level')) {
            $characterSheet->setCasterLevel((float)$request->request->get('caster_level'));
        }

        if ($request->request->has('exaustion')) {
            $characterSheet->setExaustion((int)$request->request->get('exaustion'));
        }

        // Procesar JSON fields
        if ($request->request->has('stats')) {
            $stats = json_decode($request->request->get('stats'), true);
            if (is_array($stats)) {
                $characterSheet->setStats($stats);
            }
        }

        if ($request->request->has('currency')) {
            $currency = json_decode($request->request->get('currency'), true);
            if (is_array($currency)) {
                $characterSheet->setCurrency($currency);
            }
        }

        if ($request->request->has('level')) {
            $level = json_decode($request->request->get('level'), true);
            if (is_array($level)) {
                $characterSheet->setLevel($level);
            }
        }

        // Procesar imágenes
        $uploadDir = $this->getParameter('kernel.project_dir') . '/uploads/character_images';

        $tokenFile = $request->files->get('token_image');
        if ($tokenFile) {
            $originalFilename = pathinfo($tokenFile->getClientOriginalName(), PATHINFO_FILENAME);
            $safeFilename = $slugger->slug($originalFilename);
            $newFilename = $safeFilename . '-token-' . uniqid() . '.' . $tokenFile->guessExtension();

            try {
                $tokenFile->move($uploadDir, $newFilename);
                $characterSheet->setTokenImage('/uploads/character_images/' . $newFilename);
            } catch (FileException $e) {
                // Handle error
            }
        }

        $portraitFile = $request->files->get('portrait_image');
        if ($portraitFile) {
            $originalFilename = pathinfo($portraitFile->getClientOriginalName(), PATHINFO_FILENAME);
            $safeFilename = $slugger->slug($originalFilename);
            $newFilename = $safeFilename . '-portrait-' . uniqid() . '.' . $portraitFile->guessExtension();

            try {
                $portraitFile->move($uploadDir, $newFilename);
                $characterSheet->setPortraitImage('/uploads/character_images/' . $newFilename);
            } catch (FileException $e) {
                // Handle error
            }
        }

        $entityManager->flush();

        return $this->json(['message' => 'Character updated successfully']);
    }

    #[Route('/delete/{id}', name: 'api_character_delete', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function delete(int $id, EntityManagerInterface $entityManager): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'User not authenticated'], 401);
        }

        $characterSheet = $entityManager->getRepository(CharacterSheet::class)->find($id);

        if (!$characterSheet) {
            return $this->json(['error' => 'Character not found'], 404);
        }

        // Verificar permisos
        $csu = $entityManager->getRepository(CharacterSheetUser::class)->findOneBy([
            'user_id' => $user,
            'charactersheet_id' => $characterSheet
        ]);

        if (!$csu || !$csu->isEdit()) {
            return $this->json(['error' => 'You do not have permission to delete this character'], 403);
        }

        // Eliminar la relación y la hoja de personaje
        // Nota: Si hay otras relaciones (como items, spells, etc.), Doctrine debería encargarse si están configuradas con cascade={"remove"} o orphanRemoval=true
        // Si no, habría que eliminarlas manualmente o ajustar la configuración de la entidad.

        $entityManager->remove($characterSheet);
        $entityManager->flush();

        return $this->json(['message' => 'Character deleted successfully']);
    }
}
