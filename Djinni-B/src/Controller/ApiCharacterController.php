<?php

namespace App\Controller;

use App\Entity\Ability;
use App\Entity\Attack;
use App\Entity\CharacterSheet;
use App\Entity\CharacterSheetUser;
use App\Entity\Inventory;
use App\Entity\Item;
use App\Entity\Proficency;
use App\Entity\Spell;
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

        // CAMBIO: Inicializar como un array de clases para soportar multiclase
        $characterSheet->setLevel([
            ['class' => 'Commoner', 'level' => 1, 'subclass' => '']
        ]);

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
                // Lógica para calcular el nivel total
                $levelData = $sheet->getLevel();
                $totalLevel = 0;

                // Manejar compatibilidad hacia atrás (si es objeto antiguo o array nuevo)
                if (isset($levelData['level'])) {
                    // Formato antiguo (un solo objeto)
                    $totalLevel = (int)$levelData['level'];
                    // Normalizar para el frontend
                    $levelData = [$levelData];
                } elseif (is_array($levelData)) {
                    // Formato nuevo (array de clases)
                    foreach ($levelData as $classInfo) {
                        $totalLevel += (int)($classInfo['level'] ?? 0);
                    }
                }

                // Helper to format collections
                $formatCollection = function($collection, $callback) {
                    $result = [];
                    foreach ($collection as $item) {
                        $result[] = $callback($item);
                    }
                    return $result;
                };

                $characters[] = [
                    'id' => $sheet->getId(),
                    'name' => $sheet->getName(),
                    'hp' => $sheet->getHp(),
                    'max_hp' => $sheet->getMaxHp(),
                    'caster_level' => $sheet->getCasterLevel(),
                    'level' => $levelData, // Devolvemos la estructura normalizada (array)
                    'display_level' => $totalLevel,
                    'token_image' => $sheet->getTokenImage(),
                    'default_auras' => $sheet->getDefaultAuras() ?? [],
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
                    // Saving Throws
                    'sav_str' => $sheet->isSavStr(), 'sav_str_mod' => $sheet->getSavStrMod(),
                    'sav_dex' => $sheet->isSavDex(), 'sav_dex_mod' => $sheet->getSavDexMod(),
                    'sav_int' => $sheet->isSavInt(), 'sav_int_mod' => $sheet->getSavIntMod(),
                    'sav_wis' => $sheet->isSavWis(), 'sav_wis_mod' => $sheet->getSavWisMod(),
                    'sav_cha' => $sheet->isSavCha(), 'sav_cha_mod' => $sheet->getSavChaMod(),
                    // Skills
                    'acrobatics' => $sheet->getAcrobatics(), 'acrobatics_mod' => $sheet->getAcrobaticsMod(),
                    'animal_handling' => $sheet->getAnimalHandling(), 'animal_handling_mod' => $sheet->getAnimalHandlingMod(),
                    'arcana' => $sheet->getArcana(), 'arcana_mod' => $sheet->getArcanaMod(),
                    'athletics' => $sheet->getAthletics(), 'athletics_mod' => $sheet->getAthleticsMod(),
                    'deception' => $sheet->getDeception(), 'deception_mod' => $sheet->getDeceptionMod(),
                    'history' => $sheet->getHistory(), 'history_mod' => $sheet->getHistoryMod(),
                    'insight' => $sheet->getInsight(), 'insight_mod' => $sheet->getInsightMod(),
                    'intimidation' => $sheet->getIntimidation(), 'intimidation_mod' => $sheet->getIntimidationMod(),
                    'investigation' => $sheet->getInvestigation(), 'investigation_mod' => $sheet->getInvestigationMod(),
                    'medicine' => $sheet->getMedicine(), 'medicine_mod' => $sheet->getMedicineMod(),
                    'nature' => $sheet->getNature(), 'nature_mod' => $sheet->getNatureMod(),
                    'perception' => $sheet->getPerception(), 'perception_mod' => $sheet->getPerceptionMod(),
                    'performance' => $sheet->getPerformance(), 'performance_mod' => $sheet->getPerformanceMod(),
                    'persuasion' => $sheet->getPersuasion(), 'persuasion_mod' => $sheet->getPersuasionMod(),
                    'religion' => $sheet->getReligion(), 'religion_mod' => $sheet->getReligionMod(),
                    'sleight_of_hand' => $sheet->getSleightOfHand(), 'sleight_of_hand_mod' => $sheet->getSleightOfHandMod(),
                    'stealth' => $sheet->getStealth(), 'stealth_mod' => $sheet->getStealthMod(),
                    'survival' => $sheet->getSurvival(), 'survival_mod' => $sheet->getSurvivalMod(),

                    // Collections
                    'attacks' => $formatCollection($sheet->getAttacks(), fn(Attack $a) => [
                        'id' => $a->getId(),
                        'name' => $a->getName(),
                        'damage_dice' => $a->getDamageDice(),
                        'damage_type' => $a->getDamageType(),
                        'range' => $a->getRange(),
                        'description' => $a->getDescription(),
                        'attack_modifier' => $a->getAttackModifier(),
                        'is_saving_throw' => $a->isSavingThrow(),
                        'saving_throw_tipe' => $a->getSavingThrowTipe()
                    ]),
                    'abilities' => $formatCollection($sheet->getAbilities(), fn(Ability $a) => [
                        'id' => $a->getId(),
                        'name' => $a->getName(),
                        'description' => $a->getDescription(),
                        'source_tipe' => $a->getSourceTipe(),
                        'is_active' => $a->isActive(),
                        'has_limited_uses' => $a->hasLimitedUses(),
                        'max_uses' => $a->getMaxUses(),
                        'current_uses' => $a->getCurrentUses(),
                        'recharge_type' => $a->getRechargeType()
                    ]),
                    'spells' => $formatCollection($sheet->getSpells(), fn(Spell $s) => [
                        'id' => $s->getId(),
                        'name' => $s->getName(),
                        'level' => $s->getLevel(),
                        'school' => $s->getSchool(),
                        'description' => $s->getDescription(),
                        'is_prepared' => $s->isPrepared(),
                        'casting_time' => $s->getCastingTime(),
                        'range' => $s->getSpellRange(),
                        'components' => $s->getComponents(),
                        'duration' => $s->getDuration()
                    ]),
                    'inventory' => $formatCollection($sheet->getInventories(), fn(Inventory $i) => [
                        'id' => $i->getId(),
                        'item_name' => $i->getItems() ? $i->getItems()->getName() : 'Unknown Item',
                        'item_description' => $i->getItems() ? $i->getItems()->getDescription() : '',
                        'quantity' => $i->getQuantity(),
                        'is_equipped' => $i->isEquipped()
                    ]),
                    'proficencies' => $formatCollection($sheet->getProficencies(), fn(Proficency $p) => [
                        'id' => $p->getId(),
                        'name' => $p->getName(),
                        'type' => $p->getType(),
                        'value_modifier' => $p->getValueModifier()
                    ])
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

        if ($request->request->has('hp')) {
            $characterSheet->setHp((int)$request->request->get('hp'));
        }

        if ($request->request->has('max_hp')) {
            $characterSheet->setMaxHp((int)$request->request->get('max_hp'));
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
            // Asegurarnos de que sea un array (lista de clases)
            if (is_array($level)) {
                $characterSheet->setLevel($level);
            }
        }

        // Saving Throws
        $savingThrows = ['sav_str', 'sav_dex', 'sav_int', 'sav_wis', 'sav_cha'];
        foreach ($savingThrows as $st) {
            if ($request->request->has($st)) {
                $val = $request->request->get($st);
                $boolVal = filter_var($val, FILTER_VALIDATE_BOOLEAN);
                $setter = 'set' . str_replace('_', '', ucwords($st, '_'));
                $characterSheet->$setter($boolVal);
            }
            if ($request->request->has($st . '_mod')) {
                $setterMod = 'set' . str_replace('_', '', ucwords($st . '_mod', '_'));
                $characterSheet->$setterMod((int)$request->request->get($st . '_mod'));
            }
        }

        // Skills
        $skills = [
            'acrobatics', 'animal_handling', 'arcana', 'athletics', 'deception',
            'history', 'insight', 'intimidation', 'investigation', 'medicine',
            'nature', 'perception', 'performance', 'persuasion', 'religion',
            'sleight_of_hand', 'stealth', 'survival'
        ];
        foreach ($skills as $skill) {
            if ($request->request->has($skill)) {
                $setter = 'set' . str_replace('_', '', ucwords($skill, '_'));
                $characterSheet->$setter($request->request->get($skill));
            }
            if ($request->request->has($skill . '_mod')) {
                $setterMod = 'set' . str_replace('_', '', ucwords($skill . '_mod', '_'));
                $characterSheet->$setterMod((int)$request->request->get($skill . '_mod'));
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

    // ... (delete and sub-entity methods remain the same) ...
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

        $entityManager->remove($characterSheet);
        $entityManager->flush();

        return $this->json(['message' => 'Character deleted successfully']);
    }

    #[Route('/{id}/set-default-auras', name: 'api_character_set_default_auras', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function setDefaultAuras(int $id, Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $characterSheet = $entityManager->getRepository(CharacterSheet::class)->find($id);

        if (!$characterSheet) {
            return $this->json(['error' => 'Character not found'], 404);
        }

        $csu = $entityManager->getRepository(CharacterSheetUser::class)->findOneBy([
            'user_id' => $user,
            'charactersheet_id' => $characterSheet,
        ]);

        if (!$csu || !$csu->isEdit()) {
            return $this->json(['error' => 'No permission'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $characterSheet->setDefaultAuras($data['auras'] ?? []);
        $entityManager->flush();

        return $this->json(['default_auras' => $characterSheet->getDefaultAuras()]);
    }

    #[Route('/{id}/set-default-token', name: 'api_character_set_default_token', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function setDefaultToken(int $id, Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $characterSheet = $entityManager->getRepository(CharacterSheet::class)->find($id);

        if (!$characterSheet) {
            return $this->json(['error' => 'Character not found'], 404);
        }

        $csu = $entityManager->getRepository(CharacterSheetUser::class)->findOneBy([
            'user_id' => $user,
            'charactersheet_id' => $characterSheet,
        ]);

        if (!$csu || !$csu->isEdit()) {
            return $this->json(['error' => 'No permission'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $imageUrl = $data['image_url'] ?? null;

        if (!$imageUrl) {
            return $this->json(['error' => 'image_url required'], 400);
        }

        $characterSheet->setTokenImage($imageUrl);
        $entityManager->flush();

        return $this->json(['token_image' => $characterSheet->getTokenImage()]);
    }

    // --- Sub-Entity Endpoints ---

    #[Route('/{id}/attack/create', name: 'api_character_attack_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function createAttack(int $id, Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        $user = $this->getUser();
        $characterSheet = $entityManager->getRepository(CharacterSheet::class)->find($id);

        if (!$characterSheet) return $this->json(['error' => 'Character not found'], 404);

        // Verificar permisos (reutilizar lógica o servicio)
        $csu = $entityManager->getRepository(CharacterSheetUser::class)->findOneBy(['user_id' => $user, 'charactersheet_id' => $characterSheet]);
        if (!$csu || !$csu->isEdit()) return $this->json(['error' => 'Permission denied'], 403);

        $data = json_decode($request->getContent(), true);

        $attack = new Attack();
        $attack->setName($data['name'] ?? 'New Attack');
        $attack->setDamageDice($data['damage_dice'] ?? []); // e.g. ["1d8", "2d6"]
        $attack->setDamageType($data['damage_type'] ?? []); // e.g. ["slashing", "fire"]
        $attack->setRange($data['range'] ?? '5ft');
        $attack->setIsSavingThrow($data['is_saving_throw'] ?? false);
        $attack->setDescription($data['description'] ?? '');
        $attack->setAttackModifier($data['attack_modifier'] ?? '+0');
        $attack->setSavingThrowTipe($data['saving_throw_tipe'] ?? null);
        $attack->setCharacterAttack($characterSheet);

        $entityManager->persist($attack);
        $entityManager->flush();

        return $this->json(['message' => 'Attack created', 'id' => $attack->getId()]);
    }

    #[Route('/{id}/attack/delete/{attackId}', name: 'api_character_attack_delete', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function deleteAttack(int $id, int $attackId, EntityManagerInterface $entityManager): JsonResponse
    {
        $user = $this->getUser();
        $characterSheet = $entityManager->getRepository(CharacterSheet::class)->find($id);
        if (!$characterSheet) return $this->json(['error' => 'Character not found'], 404);

        $csu = $entityManager->getRepository(CharacterSheetUser::class)->findOneBy(['user_id' => $user, 'charactersheet_id' => $characterSheet]);
        if (!$csu || !$csu->isEdit()) return $this->json(['error' => 'Permission denied'], 403);

        $attack = $entityManager->getRepository(Attack::class)->find($attackId);
        if (!$attack || $attack->getCharacterAttack() !== $characterSheet) {
            return $this->json(['error' => 'Attack not found or does not belong to character'], 404);
        }

        $entityManager->remove($attack);
        $entityManager->flush();

        return $this->json(['message' => 'Attack deleted']);
    }

    #[Route('/{id}/ability/create', name: 'api_character_ability_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function createAbility(int $id, Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        $user = $this->getUser();
        $characterSheet = $entityManager->getRepository(CharacterSheet::class)->find($id);
        if (!$characterSheet) return $this->json(['error' => 'Character not found'], 404);

        $csu = $entityManager->getRepository(CharacterSheetUser::class)->findOneBy(['user_id' => $user, 'charactersheet_id' => $characterSheet]);
        if (!$csu || !$csu->isEdit()) return $this->json(['error' => 'Permission denied'], 403);

        $data = json_decode($request->getContent(), true);

        $ability = new Ability();
        $ability->setName($data['name'] ?? 'New Ability');
        $ability->setDescription($data['description'] ?? '');
        $ability->setSourceTipe($data['source_tipe'] ?? 'Race');
        $ability->setIsActive($data['is_active'] ?? true);
        $ability->setHasLimitedUses($data['has_limited_uses'] ?? false);
        $ability->setMaxUses($data['max_uses'] ?? 0);
        $ability->setCurrentUses($data['current_uses'] ?? 0);
        $ability->setRechargeType($data['recharge_type'] ?? 'Long Rest');
        $ability->setCharacterId($characterSheet);

        $entityManager->persist($ability);
        $entityManager->flush();

        return $this->json(['message' => 'Ability created', 'id' => $ability->getId()]);
    }

    #[Route('/{id}/ability/delete/{abilityId}', name: 'api_character_ability_delete', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function deleteAbility(int $id, int $abilityId, EntityManagerInterface $entityManager): JsonResponse
    {
        $user = $this->getUser();
        $characterSheet = $entityManager->getRepository(CharacterSheet::class)->find($id);
        if (!$characterSheet) return $this->json(['error' => 'Character not found'], 404);

        $csu = $entityManager->getRepository(CharacterSheetUser::class)->findOneBy(['user_id' => $user, 'charactersheet_id' => $characterSheet]);
        if (!$csu || !$csu->isEdit()) return $this->json(['error' => 'Permission denied'], 403);

        $ability = $entityManager->getRepository(Ability::class)->find($abilityId);
        if (!$ability || $ability->getCharacterId() !== $characterSheet) {
            return $this->json(['error' => 'Ability not found or does not belong to character'], 404);
        }

        $entityManager->remove($ability);
        $entityManager->flush();

        return $this->json(['message' => 'Ability deleted']);
    }

    // Similar endpoints for Inventory and Spells would follow here...
    // For brevity, I'll add Inventory create/delete now.

    #[Route('/{id}/inventory/create', name: 'api_character_inventory_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function createInventory(int $id, Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        $user = $this->getUser();
        $characterSheet = $entityManager->getRepository(CharacterSheet::class)->find($id);
        if (!$characterSheet) return $this->json(['error' => 'Character not found'], 404);

        $csu = $entityManager->getRepository(CharacterSheetUser::class)->findOneBy(['user_id' => $user, 'charactersheet_id' => $characterSheet]);
        if (!$csu || !$csu->isEdit()) return $this->json(['error' => 'Permission denied'], 403);

        $data = json_decode($request->getContent(), true);

        // Create Item first (simplified logic: create new item for each inventory entry)
        $item = new Item();
        $item->setName($data['item_name'] ?? 'New Item');
        $item->setDescription($data['item_description'] ?? '');
        $entityManager->persist($item);

        $inventory = new Inventory();
        $inventory->setSeet($characterSheet);
        $inventory->setItems($item);
        $inventory->setQuantity($data['quantity'] ?? 1);
        $inventory->setIsEquipped($data['is_equipped'] ?? false);

        $entityManager->persist($inventory);
        $entityManager->flush();

        return $this->json(['message' => 'Item added to inventory', 'id' => $inventory->getId()]);
    }

    #[Route('/{id}/inventory/delete/{inventoryId}', name: 'api_character_inventory_delete', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function deleteInventory(int $id, int $inventoryId, EntityManagerInterface $entityManager): JsonResponse
    {
        $user = $this->getUser();
        $characterSheet = $entityManager->getRepository(CharacterSheet::class)->find($id);
        if (!$characterSheet) return $this->json(['error' => 'Character not found'], 404);

        $csu = $entityManager->getRepository(CharacterSheetUser::class)->findOneBy(['user_id' => $user, 'charactersheet_id' => $characterSheet]);
        if (!$csu || !$csu->isEdit()) return $this->json(['error' => 'Permission denied'], 403);

        $inventory = $entityManager->getRepository(Inventory::class)->find($inventoryId);
        if (!$inventory || $inventory->getSeet() !== $characterSheet) {
            return $this->json(['error' => 'Inventory item not found'], 404);
        }

        // Optionally remove the Item entity if it's not shared
        // $entityManager->remove($inventory->getItems());

        $entityManager->remove($inventory);
        $entityManager->flush();

        return $this->json(['message' => 'Item removed from inventory']);
    }

    #[Route('/{id}/spell/create', name: 'api_character_spell_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function createSpell(int $id, Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        $user = $this->getUser();
        $characterSheet = $entityManager->getRepository(CharacterSheet::class)->find($id);
        if (!$characterSheet) return $this->json(['error' => 'Character not found'], 404);

        $csu = $entityManager->getRepository(CharacterSheetUser::class)->findOneBy(['user_id' => $user, 'charactersheet_id' => $characterSheet]);
        if (!$csu || !$csu->isEdit()) return $this->json(['error' => 'Permission denied'], 403);

        $data = json_decode($request->getContent(), true);

        $spell = new Spell();
        $spell->setName($data['name'] ?? 'New Spell');
        $spell->setLevel($data['level'] ?? 0);
        $spell->setSchool($data['school'] ?? 'Evocation');
        $spell->setDescription($data['description'] ?? '');
        $spell->setIsPrepared($data['is_prepared'] ?? false);
        $spell->setHasLimitedUses($data['has_limited_uses'] ?? false);
        $spell->setMaxCharges($data['max_charges'] ?? 0);
        $spell->setCurrentCharges($data['current_charges'] ?? 0);
        $spell->setCastingTime($data['casting_time'] ?? '1 action');
        $spell->setSpellRange($data['range'] ?? '60 feet');
        $spell->setComponents($data['components'] ?? 'V, S');
        $spell->setDuration($data['duration'] ?? 'Instantaneous');

        $spell->addCharacterId($characterSheet);

        $entityManager->persist($spell);
        $entityManager->flush();

        return $this->json(['message' => 'Spell created', 'id' => $spell->getId()]);
    }

    #[Route('/{id}/spell/delete/{spellId}', name: 'api_character_spell_delete', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function deleteSpell(int $id, int $spellId, EntityManagerInterface $entityManager): JsonResponse
    {
        $user = $this->getUser();
        $characterSheet = $entityManager->getRepository(CharacterSheet::class)->find($id);
        if (!$characterSheet) return $this->json(['error' => 'Character not found'], 404);

        $csu = $entityManager->getRepository(CharacterSheetUser::class)->findOneBy(['user_id' => $user, 'charactersheet_id' => $characterSheet]);
        if (!$csu || !$csu->isEdit()) return $this->json(['error' => 'Permission denied'], 403);

        $spell = $entityManager->getRepository(Spell::class)->find($spellId);
        if (!$spell) return $this->json(['error' => 'Spell not found'], 404);

        // Check if spell is associated with this character
        if (!$spell->getCharacterId()->contains($characterSheet)) {
            return $this->json(['error' => 'Spell does not belong to character'], 404);
        }

        // Remove association
        $spell->removeCharacterId($characterSheet);

        // If spell is not used by anyone else (and not a global spell), delete it
        // For now, assuming spells are unique per character instance or we just remove the link
        if ($spell->getCharacterId()->isEmpty() && $spell->getMonsterSpell()->isEmpty()) {
             $entityManager->remove($spell);
        }

        $entityManager->flush();

        return $this->json(['message' => 'Spell deleted']);
    }
}
