<?php

namespace App\Controller;

use App\Entity\Monster;
use App\Entity\MonsterUser;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\String\Slugger\SluggerInterface;

#[Route('/api/monster')]
class ApiMonsterController extends AbstractController
{
    #[Route('/create', name: 'api_monster_create', methods: ['POST'])]
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
            return $this->json(['error' => 'Monster name is required'], 400);
        }

        // 1. Crear el monstruo
        $monster = new Monster();
        $monster->setName($name);
        $monster->setCreador($user);

        // Valores por defecto mínimos
        $monster->setSize('Medium');
        $monster->setType('Humanoid');
        $monster->setArmorClass(10);
        $monster->setHitPointsAverage(10);
        $monster->setStr(10);
        $monster->setDex(10);
        $monster->setCon(10);
        $monster->setIntStat(10);
        $monster->setWis(10);
        $monster->setCha(10);

        $entityManager->persist($monster);

        // 2. Asociar al usuario mediante la tabla intermedia MonsterUser
        $monsterUser = new MonsterUser();
        $monsterUser->setUser($user);
        $monsterUser->setMonster($monster);
        $monsterUser->setVisible(true);
        $monsterUser->setEditable(true);

        $entityManager->persist($monsterUser);
        $entityManager->flush();

        return $this->json([
            'message' => 'Monster created successfully',
            'id' => $monster->getId(),
            'name' => $monster->getName()
        ], 201);
    }

    #[Route('/my-monsters', name: 'api_monster_list', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function list(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'User not authenticated'], 401);
        }

        $monsterUsers = $user->getMonsterUsers();
        $monsters = [];

        foreach ($monsterUsers as $mu) {
            $monster = $mu->getMonster();
            if ($monster) {
                $monsters[] = [
                    'id' => $monster->getId(),
                    'name' => $monster->getName(),
                    'max_hp' => $monster->getMaxHp(),
                    'source_book' => $monster->getSourceBook(),
                    'page_number' => $monster->getPageNumber(),
                    'type' => $monster->getType(),
                    'size' => $monster->getSize(),
                    'alignment' => $monster->getAlignment(),
                    'ac' => $monster->getArmorClass(),
                    'ac_description' => $monster->getAcDescription(),
                    'hp' => $monster->getHitPointsAverage(),
                    'hp_formula' => $monster->getHpFormula(),
                    'speed' => $monster->getSpeed(),
                    'str' => $monster->getStr(),
                    'dex' => $monster->getDex(),
                    'con' => $monster->getCon(),
                    'int' => $monster->getIntStat(),
                    'wis' => $monster->getWis(),
                    'cha' => $monster->getCha(),
                    'saving_throws' => $monster->getSavingThrows(),
                    'skills' => $monster->getSkills(),
                    'passive_perception' => $monster->getPassivePerception(),
                    'cr' => $monster->getChallengeRating(),
                    'senses' => $monster->getSenses(),
                    'languages' => $monster->getLanguages(),
                    'traits' => $monster->getTraits(),
                    'spellcasting' => $monster->getSpellcasting(),
                    'actions' => $monster->getActions(),
                    'bonus_actions' => $monster->getBonusActions(),
                    'reactions' => $monster->getReactions(),
                    'legendary_resistances_count' => $monster->getLegendaryResistancesCount(),
                    'legendary_actions_count' => $monster->getLegendaryActionsCount(),
                    'legendary_actions' => $monster->getLegendaryActions(),
                    'mythic_actions' => $monster->getMythicActions(),
                    'lair_actions' => $monster->getLairActions(),
                    'regional_effects' => $monster->getRegionalEffects(),
                    'enviroment' => $monster->getEnviroment(),
                    'treasure' => $monster->getTreasure(),
                    'tags' => $monster->getTags(),
                    'vtt_metadata' => $monster->getVttMetadata(),
                    'image_url'     => $monster->getImageUrl(),
                    'portrait_url'  => $monster->getPortraitUrl(),
                    'is_editable'   => $mu->isEditable(),
                    'default_auras' => $monster->getDefaultAuras() ?? [],
                ];
            }
        }

        return $this->json($monsters);
    }

    #[Route('/delete/{id}', name: 'api_monster_delete', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function delete(int $id, EntityManagerInterface $entityManager): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'User not authenticated'], 401);
        }

        $monster = $entityManager->getRepository(Monster::class)->find($id);

        if (!$monster) {
            return $this->json(['error' => 'Monster not found'], 404);
        }

        // Verificar permisos
        $mu = $entityManager->getRepository(MonsterUser::class)->findOneBy([
            'user' => $user,
            'monster' => $monster
        ]);

        if (!$mu || !$mu->isEditable()) {
            return $this->json(['error' => 'You do not have permission to delete this monster'], 403);
        }

        $entityManager->remove($monster);
        $entityManager->flush();

        return $this->json(['message' => 'Monster deleted successfully']);
    }

    #[Route('/edit/{id}', name: 'api_monster_edit', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function edit(int $id, Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'User not authenticated'], 401);
        }

        $monster = $entityManager->getRepository(Monster::class)->find($id);

        if (!$monster) {
            return $this->json(['error' => 'Monster not found'], 404);
        }

        // Verificar permisos
        $mu = $entityManager->getRepository(MonsterUser::class)->findOneBy([
            'user' => $user,
            'monster' => $monster
        ]);

        if (!$mu || !$mu->isEditable()) {
            return $this->json(['error' => 'You do not have permission to edit this monster'], 403);
        }

        $data = json_decode($request->getContent(), true);

        // Basic Info
        if (isset($data['name'])) $monster->setName($data['name']);
        if (isset($data['source_book'])) $monster->setSourceBook($data['source_book']);
        if (isset($data['page_number'])) $monster->setPageNumber((int)$data['page_number']);
        if (isset($data['type'])) $monster->setType($data['type']);
        if (isset($data['size'])) $monster->setSize($data['size']);
        if (isset($data['alignment'])) $monster->setAlignment($data['alignment']);
        if (isset($data['tags']) && is_array($data['tags'])) $monster->setTags($data['tags']);
        if (isset($data['enviroment']) && is_array($data['enviroment'])) $monster->setEnviroment($data['enviroment']);

        // Combat
        if (isset($data['armor_class'])) $monster->setArmorClass((int)$data['armor_class']);
        if (isset($data['ac_description'])) $monster->setAcDescription($data['ac_description']);
        if (isset($data['hit_points_average'])) $monster->setHitPointsAverage((int)$data['hit_points_average']);
        if (isset($data['max_hp'])) $monster->setMaxHp((int)$data['max_hp']);
        if (isset($data['hp_formula'])) $monster->setHpFormula($data['hp_formula']);
        if (isset($data['speed']) && is_array($data['speed'])) $monster->setSpeed($data['speed']);
        if (isset($data['challenge_rating'])) $monster->setChallengeRating((int)$data['challenge_rating']);

        // Stats
        if (isset($data['str'])) $monster->setStr((int)$data['str']);
        if (isset($data['dex'])) $monster->setDex((int)$data['dex']);
        if (isset($data['con'])) $monster->setCon((int)$data['con']);
        if (isset($data['int'])) $monster->setIntStat((int)$data['int']);
        if (isset($data['wis'])) $monster->setWis((int)$data['wis']);
        if (isset($data['cha'])) $monster->setCha((int)$data['cha']);
        if (isset($data['saving_throws']) && is_array($data['saving_throws'])) $monster->setSavingThrows($data['saving_throws']);
        if (isset($data['skills']) && is_array($data['skills'])) $monster->setSkills($data['skills']);

        // Senses & Languages
        if (isset($data['passive_perception'])) $monster->setPassivePerception((int)$data['passive_perception']);
        if (isset($data['senses'])) $monster->setSenses($data['senses']);
        if (isset($data['languages'])) $monster->setLanguages($data['languages']);

        // Traits & Actions
        if (isset($data['traits']) && is_array($data['traits'])) $monster->setTraits($data['traits']);
        if (isset($data['actions']) && is_array($data['actions'])) $monster->setActions($data['actions']);
        if (isset($data['bonus_actions']) && is_array($data['bonus_actions'])) $monster->setBonusActions($data['bonus_actions']);
        if (isset($data['reactions']) && is_array($data['reactions'])) $monster->setReactions($data['reactions']);
        if (isset($data['spellcasting']) && is_array($data['spellcasting'])) $monster->setSpellcasting($data['spellcasting']);

        // Legendary & Mythic
        if (isset($data['legendary_resistances_count'])) $monster->setLegendaryResistancesCount((int)$data['legendary_resistances_count']);
        if (isset($data['legendary_actions_count'])) $monster->setLegendaryActionsCount((int)$data['legendary_actions_count']);
        if (isset($data['legendary_actions']) && is_array($data['legendary_actions'])) $monster->setLegendaryActions($data['legendary_actions']);
        if (isset($data['mythic_actions']) && is_array($data['mythic_actions'])) $monster->setMythicActions($data['mythic_actions']);
        if (isset($data['lair_actions']) && is_array($data['lair_actions'])) $monster->setLairActions($data['lair_actions']);
        if (isset($data['regional_effects']) && is_array($data['regional_effects'])) $monster->setRegionalEffects($data['regional_effects']);

        // Misc
        if (isset($data['treasure']) && is_array($data['treasure'])) $monster->setTreasure($data['treasure']);
        if (isset($data['vtt_metadata']) && is_array($data['vtt_metadata'])) $monster->setVttMetadata($data['vtt_metadata']);

        $entityManager->flush();

        return $this->json(['message' => 'Monster updated successfully']);
    }

    #[Route('/{id}/set-default-auras', name: 'api_monster_set_default_auras', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function setDefaultAuras(int $id, Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $monster = $entityManager->getRepository(Monster::class)->find($id);

        if (!$monster) {
            return $this->json(['error' => 'Monster not found'], 404);
        }

        $mu = $entityManager->getRepository(MonsterUser::class)->findOneBy([
            'user' => $user,
            'monster' => $monster,
        ]);

        if (!$mu || !$mu->isEditable()) {
            return $this->json(['error' => 'No permission'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $monster->setDefaultAuras($data['auras'] ?? []);
        $entityManager->flush();

        return $this->json(['default_auras' => $monster->getDefaultAuras()]);
    }

    #[Route('/{id}/set-default-token', name: 'api_monster_set_default_token', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function setDefaultToken(int $id, Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $monster = $entityManager->getRepository(Monster::class)->find($id);

        if (!$monster) {
            return $this->json(['error' => 'Monster not found'], 404);
        }

        $mu = $entityManager->getRepository(MonsterUser::class)->findOneBy([
            'user' => $user,
            'monster' => $monster,
        ]);

        if (!$mu || !$mu->isEditable()) {
            return $this->json(['error' => 'No permission'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $imageUrl = $data['image_url'] ?? null;

        if (!$imageUrl) {
            return $this->json(['error' => 'image_url required'], 400);
        }

        $monster->setImageUrl($imageUrl);
        $entityManager->flush();

        return $this->json(['image_url' => $monster->getImageUrl()]);
    }

    #[Route('/{id}/upload-token', name: 'api_monster_upload_token', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function uploadToken(int $id, Request $request, EntityManagerInterface $entityManager, SluggerInterface $slugger): JsonResponse
    {
        return $this->handleImageUpload($id, 'token', $request, $entityManager, $slugger);
    }

    #[Route('/{id}/upload-portrait', name: 'api_monster_upload_portrait', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function uploadPortrait(int $id, Request $request, EntityManagerInterface $entityManager, SluggerInterface $slugger): JsonResponse
    {
        return $this->handleImageUpload($id, 'portrait', $request, $entityManager, $slugger);
    }

    private function handleImageUpload(int $id, string $type, Request $request, EntityManagerInterface $entityManager, SluggerInterface $slugger): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $monster = $entityManager->getRepository(Monster::class)->find($id);
        if (!$monster) {
            return $this->json(['error' => 'Monster not found'], 404);
        }

        $mu = $entityManager->getRepository(MonsterUser::class)->findOneBy(['user' => $user, 'monster' => $monster]);
        if (!$mu || !$mu->isEditable()) {
            return $this->json(['error' => 'Permission denied'], 403);
        }

        $file = $request->files->get('image');
        if (!$file) {
            return $this->json(['error' => 'No image provided'], 400);
        }

        $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads/monster_images';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }

        $safeFilename = $slugger->slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
        $filename = $safeFilename . '-' . $type . '-' . uniqid() . '.' . $file->guessExtension();
        $file->move($uploadDir, $filename);

        $url = '/uploads/monster_images/' . $filename;
        if ($type === 'portrait') {
            $monster->setPortraitUrl($url);
        } else {
            $monster->setImageUrl($url);
        }
        $entityManager->flush();

        return $this->json(['image_url' => $monster->getImageUrl(), 'portrait_url' => $monster->getPortraitUrl()]);
    }
}
