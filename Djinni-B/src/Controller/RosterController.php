<?php

namespace App\Controller;

use App\Entity\RosterFolder;
use App\Entity\RosterItem;
use App\Entity\RosterVisibility;
use App\Repository\CharacterSheetRepository;
use App\Repository\SceneRepository;
use App\Repository\CharacterSheetUserRepository;
use App\Repository\GameSesionRepository;
use App\Repository\MonsterRepository;
use App\Repository\RosterFolderRepository;
use App\Repository\RosterItemRepository;
use App\Repository\RosterVisibilityRepository;
use App\Repository\SceneTokenRepository;
use App\Repository\UserGameSessionRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/game/{gameId}/roster')]
class RosterController extends AbstractController
{
    private function getSessionAndDmFlag(int $gameId, GameSesionRepository $gameRepo, UserGameSessionRepository $ugsRepo): array
    {
        $session = $gameRepo->find($gameId);
        if (!$session) return [null, false];
        $user = $this->getUser();
        $isDm = false;
        if ($user) {
            $ugs = $ugsRepo->findOneBy(['user' => $user, 'gameSession' => $session]);
            if ($ugs) $isDm = $ugs->isDm();
        }
        return [$session, $isDm];
    }

    /** IDs de usuarios con grant explícito para este item */
    private function getGrantedIds(RosterItem $item, RosterVisibilityRepository $visRepo): array
    {
        $grants = $visRepo->findBy(['rosterItem' => $item]);
        return array_map(fn($g) => $g->getUser()->getId(), $grants);
    }

    private function canSeeItem(RosterItem $item, $user, bool $isDm, array $grantedIds): bool
    {
        if ($isDm) return true;
        if ($user && $item->getCreatedBy()?->getId() === $user->getId()) return true;
        if ($user && in_array($user->getId(), $grantedIds, true)) return true;
        return false;
    }

    private function folderHasVisibleItems(RosterFolder $folder, array $allFolders, array $allItems, array $grantMap, $user, bool $isDm): bool
    {
        if ($isDm) return true;
        foreach ($allItems as $item) {
            if ($item->getFolder()?->getId() === $folder->getId()) {
                $grants = $grantMap[$item->getId()] ?? [];
                if ($this->canSeeItem($item, $user, $isDm, $grants)) return true;
            }
        }
        foreach ($allFolders as $child) {
            if ($child->getParent()?->getId() === $folder->getId()) {
                if ($this->folderHasVisibleItems($child, $allFolders, $allItems, $grantMap, $user, $isDm)) return true;
            }
        }
        return false;
    }

    private function itemToArray(RosterItem $item, $user, bool $isDm, array $grantedIds, array $entityExtra = []): array
    {
        $data = [
            'id'               => $item->getId(),
            'folder_id'        => $item->getFolder()?->getId(),
            'kind'             => $item->getKind(),
            'entity_id'        => $item->getEntityId(),
            'name'             => $item->getName(),
            'color'            => $item->getColor(),
            'image_url'        => $item->getImageUrl(),
            'position'         => $item->getPosition(),
            'is_mine'          => $user && $item->getCreatedBy()?->getId() === $user->getId(),
            'controlled_by_id' => $item->getControlledByUser()?->getId(),
            'hp'                 => $entityExtra['hp'] ?? null,
            'max_hp'             => $entityExtra['max_hp'] ?? null,
            'default_auras'      => $entityExtra['default_auras'] ?? [],
            'default_token_data' => $entityExtra['default_token_data'] ?? null,
        ];
        if ($isDm) {
            $data['visible_to']    = $grantedIds;
            $data['created_by_id'] = $item->getCreatedBy()?->getId();
        }
        return $data;
    }

    private function folderToArray(RosterFolder $f, array $allFolders, array $allItems, array $grantMap, $user, bool $isDm, array $entityMap = []): array
    {
        $children = array_values(array_filter(
            $allFolders,
            fn($cf) => $cf->getParent()?->getId() === $f->getId()
                && $this->folderHasVisibleItems($cf, $allFolders, $allItems, $grantMap, $user, $isDm)
        ));
        usort($children, fn($a, $b) => $a->getPosition() <=> $b->getPosition());

        $items = array_values(array_filter(
            $allItems,
            fn($i) => $i->getFolder()?->getId() === $f->getId()
                && $this->canSeeItem($i, $user, $isDm, $grantMap[$i->getId()] ?? [])
        ));
        usort($items, fn($a, $b) => $a->getPosition() <=> $b->getPosition());

        return [
            'id'        => $f->getId(),
            'parent_id' => $f->getParent()?->getId(),
            'name'      => $f->getName(),
            'position'  => $f->getPosition(),
            'children'  => array_map(fn($cf) => $this->folderToArray($cf, $allFolders, $allItems, $grantMap, $user, $isDm, $entityMap), $children),
            'items'     => array_map(fn($i) => $this->itemToArray($i, $user, $isDm, $grantMap[$i->getId()] ?? [], $entityMap[$i->getId()] ?? []), $items),
        ];
    }

    #[Route('', name: 'api_roster_get', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function getRoster(
        int $gameId,
        GameSesionRepository $gameRepo,
        UserGameSessionRepository $ugsRepo,
        RosterFolderRepository $folderRepo,
        RosterItemRepository $itemRepo,
        RosterVisibilityRepository $visRepo,
        SceneTokenRepository $stRepo,
        CharacterSheetRepository $charRepo,
        CharacterSheetUserRepository $charUserRepo,
        MonsterRepository $monsterRepo,
        EntityManagerInterface $em,
    ): JsonResponse {
        [$session, $isDm] = $this->getSessionAndDmFlag($gameId, $gameRepo, $ugsRepo);
        if (!$session) return $this->json(['error' => 'Not found'], 404);

        $currentUser = $this->getUser();

        // Auto-sync used tokens → RosterItems
        $usedTokens    = $stRepo->findUsedBySession($gameId);
        $existingItems = $itemRepo->findBy(['gameSession' => $session]);

        $seen = [];
        foreach ($existingItems as $ri) {
            $key = $ri->getKind() . '_' . ($ri->getEntityId() ?? $ri->getName() . '_' . $ri->getColor());
            $seen[$key] = true;
        }

        $seenUsed = [];
        foreach ($usedTokens as $st) {
            if ($st->getToken()) {
                $token = $st->getToken();
                $key = 'character_' . $token->getId();
                if (isset($seenUsed[$key]) || isset($seen[$key])) continue;
                $seenUsed[$key] = true;
                $charUser = $charUserRepo->findOneBy(['characterSheet' => $token->getId()]);
                $ri = new RosterItem();
                $ri->setGameSession($session)->setKind('character')
                   ->setEntityId($token->getId())->setName($token->getName() ?? '')
                   ->setImageUrl($token->getImageUrl());
                if ($charUser) $ri->setCreatedBy($charUser->getUserId());
                $em->persist($ri);
            } elseif ($st->getEntityId() && $st->getKind() === 'monster') {
                $key = 'monster_' . $st->getEntityId();
                if (isset($seenUsed[$key]) || isset($seen[$key])) continue;
                $seenUsed[$key] = true;
                $monster = $monsterRepo->find($st->getEntityId());
                $ri = new RosterItem();
                $ri->setGameSession($session)->setKind('monster')
                   ->setEntityId($st->getEntityId())
                   ->setName($monster ? $monster->getName() : ($st->getName() ?? ''))
                   ->setImageUrl($monster ? $monster->getImageUrl() : $st->getImageUrl());
                $em->persist($ri);
            } elseif ($st->getEntityId() && $st->getKind() === 'character') {
                $key = 'character_' . $st->getEntityId();
                if (isset($seenUsed[$key]) || isset($seen[$key])) continue;
                $seenUsed[$key] = true;
                $char = $charRepo->find($st->getEntityId());
                $charUser = $charUserRepo->findOneBy(['characterSheet' => $st->getEntityId()]);
                $ri = new RosterItem();
                $ri->setGameSession($session)->setKind('character')
                   ->setEntityId($st->getEntityId())
                   ->setName($char ? $char->getName() : ($st->getName() ?? ''))
                   ->setImageUrl($char ? ($char->getTokenImage() ?? $char->getPortraitImage()) : null);
                if ($charUser) $ri->setCreatedBy($charUser->getUserId());
                $em->persist($ri);
            } elseif (!$st->getToken() && !$st->getEntityId()) {
                $key = 'custom_' . $st->getName() . '_' . $st->getColor();
                if (isset($seenUsed[$key]) || isset($seen[$key])) continue;
                $seenUsed[$key] = true;
                $ri = new RosterItem();
                $ri->setGameSession($session)->setKind('custom')
                   ->setName($st->getName() ?? '')->setColor($st->getColor());
                $em->persist($ri);
            }
        }
        $em->flush();

        $allFolders = $folderRepo->findBy(['gameSession' => $session]);
        $allItems   = $itemRepo->findBy(['gameSession' => $session]);

        // Build grantMap: itemId → [userId, ...]
        $allGrants = $visRepo->findBy(['rosterItem' => $allItems]);
        $grantMap  = [];
        foreach ($allGrants as $grant) {
            $grantMap[$grant->getRosterItem()->getId()][] = $grant->getUser()->getId();
        }

        // Session members for DM (non-DM players)
        $sessionMembers = [];
        if ($isDm) {
            $allUgs = $ugsRepo->findBy(['gameSession' => $session]);
            foreach ($allUgs as $ugs) {
                if (!$ugs->isDm()) {
                    $sessionMembers[] = ['id' => $ugs->getUser()->getId(), 'username' => $ugs->getUser()->getUsername()];
                }
            }
        }

        // Build entity data map for token spawning (hp, max_hp, default_auras)
        $entityMap = [];
        $charIds    = [];
        $monsterIds = [];
        foreach ($allItems as $item) {
            if ($item->getKind() === 'character' && $item->getEntityId()) $charIds[]    = $item->getEntityId();
            elseif ($item->getKind() === 'monster' && $item->getEntityId())  $monsterIds[] = $item->getEntityId();
        }
        if ($charIds) {
            $charById = [];
            foreach ($charRepo->findBy(['id' => array_unique($charIds)]) as $c) $charById[$c->getId()] = $c;
            foreach ($allItems as $item) {
                if ($item->getKind() === 'character' && isset($charById[$item->getEntityId()])) {
                    $c = $charById[$item->getEntityId()];
                    $entityMap[$item->getId()] = [
                        'hp'                 => $c->getHp() ?? 0,
                        'max_hp'             => $c->getMaxHp() ?? ($c->getHp() ?? 0),
                        'default_auras'      => $c->getDefaultAuras() ?? [],
                        'default_token_data' => $c->getDefaultTokenData(),
                    ];
                }
            }
        }
        if ($monsterIds) {
            $monsterById = [];
            foreach ($monsterRepo->findBy(['id' => array_unique($monsterIds)]) as $m) $monsterById[$m->getId()] = $m;
            foreach ($allItems as $item) {
                if ($item->getKind() === 'monster' && isset($monsterById[$item->getEntityId()])) {
                    $m = $monsterById[$item->getEntityId()];
                    $entityMap[$item->getId()] = [
                        'hp'                 => $m->getHp() ?? 0,
                        'max_hp'             => $m->getMaxHp() ?? ($m->getHp() ?? 0),
                        'default_auras'      => $m->getDefaultAuras() ?? [],
                        'default_token_data' => $m->getDefaultTokenData(),
                    ];
                }
            }
        }

        $rootFolders = array_values(array_filter(
            $allFolders,
            fn($f) => $f->getParent() === null
                && $this->folderHasVisibleItems($f, $allFolders, $allItems, $grantMap, $currentUser, $isDm)
        ));
        usort($rootFolders, fn($a, $b) => $a->getPosition() <=> $b->getPosition());

        $rootItems = array_values(array_filter(
            $allItems,
            fn($i) => $i->getFolder() === null
                && $this->canSeeItem($i, $currentUser, $isDm, $grantMap[$i->getId()] ?? [])
        ));
        usort($rootItems, fn($a, $b) => $a->getPosition() <=> $b->getPosition());

        return $this->json([
            'folders'         => array_map(fn($f) => $this->folderToArray($f, $allFolders, $allItems, $grantMap, $currentUser, $isDm, $entityMap), $rootFolders),
            'items'           => array_map(fn($i) => $this->itemToArray($i, $currentUser, $isDm, $grantMap[$i->getId()] ?? [], $entityMap[$i->getId()] ?? []), $rootItems),
            'is_dm'           => $isDm,
            'session_members' => $sessionMembers,
        ]);
    }

    // ── CONTROL ──────────────────────────────────────────────────────────────

    #[Route('/item/{itemId}/control', name: 'api_roster_item_control', methods: ['PUT'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function setControl(
        int $gameId, int $itemId, Request $request,
        GameSesionRepository $gameRepo,
        UserGameSessionRepository $ugsRepo,
        RosterItemRepository $itemRepo,
        RosterVisibilityRepository $visRepo,
        SceneRepository $sceneRepo,
        SceneTokenRepository $stRepo,
        UserRepository $userRepo,
        EntityManagerInterface $em,
    ): JsonResponse {
        [$session, $isDm] = $this->getSessionAndDmFlag($gameId, $gameRepo, $ugsRepo);
        if (!$session || !$isDm) return $this->json(['error' => 'Forbidden'], 403);

        $item = $itemRepo->find($itemId);
        if (!$item || $item->getGameSession()->getId() !== $gameId) {
            return $this->json(['error' => 'Not found'], 404);
        }

        $data   = json_decode($request->getContent(), true);
        $userId = $data['user_id'] ?? null;
        $user   = $userId ? $userRepo->find((int)$userId) : null;

        // Reject assigning control to a user who isn't a member of the session.
        if ($user) {
            $isMember = $ugsRepo->findOneBy(['user' => $user, 'gameSession' => $session]);
            if (!$isMember) {
                return $this->json(['error' => 'User is not a member of this session'], 400);
            }
        }

        $item->setControlledByUser($user);

        // If assigning control, also grant visibility (controller must see the item)
        if ($user) {
            $existingGrant = $visRepo->findOneBy(['rosterItem' => $item, 'user' => $user]);
            if (!$existingGrant) {
                $grant = new RosterVisibility();
                $grant->setRosterItem($item)->setUser($user);
                $em->persist($grant);
            }
        }

        // Sync to matching SceneTokens in active scene
        $scene = $sceneRepo->findOneBy(['session_id' => $gameId]);
        if ($scene && $item->getEntityId()) {
            $tokens = $stRepo->findBy(['scene' => $scene, 'kind' => $item->getKind(), 'entity_id' => $item->getEntityId()]);
            foreach ($tokens as $st) {
                $st->setControlledBy($user);
            }
        }

        $em->flush();

        return $this->json(['controlled_by_id' => $user?->getId()]);
    }

    // ── VISIBILITY ────────────────────────────────────────────────────────────

    #[Route('/item/{itemId}/visibility', name: 'api_roster_item_visibility', methods: ['PUT'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function setVisibility(
        int $gameId, int $itemId, Request $request,
        GameSesionRepository $gameRepo,
        UserGameSessionRepository $ugsRepo,
        RosterItemRepository $itemRepo,
        RosterVisibilityRepository $visRepo,
        UserRepository $userRepo,
        EntityManagerInterface $em,
    ): JsonResponse {
        [$session, $isDm] = $this->getSessionAndDmFlag($gameId, $gameRepo, $ugsRepo);
        if (!$session || !$isDm) return $this->json(['error' => 'Forbidden'], 403);

        $item = $itemRepo->find($itemId);
        if (!$item || $item->getGameSession()->getId() !== $gameId) {
            return $this->json(['error' => 'Not found'], 404);
        }

        $data    = json_decode($request->getContent(), true);
        $userIds = $data['user_ids'] ?? [];

        // Remove all existing grants for this item
        foreach ($visRepo->findBy(['rosterItem' => $item]) as $g) {
            $em->remove($g);
        }

        // Create new grants
        foreach ($userIds as $uid) {
            $user = $userRepo->find((int)$uid);
            if (!$user) continue;
            $g = new RosterVisibility();
            $g->setRosterItem($item)->setUser($user);
            $em->persist($g);
        }

        $em->flush();

        return $this->json(['visible_to' => $userIds]);
    }

    // ── FOLDERS ──────────────────────────────────────────────────────────────

    #[Route('/folder', name: 'api_roster_folder_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function createFolder(
        int $gameId, Request $request,
        GameSesionRepository $gameRepo,
        UserGameSessionRepository $ugsRepo,
        RosterFolderRepository $folderRepo,
        EntityManagerInterface $em,
    ): JsonResponse {
        [$session, $isDm] = $this->getSessionAndDmFlag($gameId, $gameRepo, $ugsRepo);
        if (!$session) return $this->json(['error' => 'Not found'], 404);
        if (!$isDm) return $this->json(['error' => 'Forbidden'], 403);

        $data = json_decode($request->getContent(), true);
        $folder = new RosterFolder();
        $folder->setGameSession($session)->setName($data['name'] ?? 'Nueva carpeta');

        if (!empty($data['parent_id'])) {
            $parent = $folderRepo->find($data['parent_id']);
            if ($parent && $parent->getGameSession()->getId() === $gameId) $folder->setParent($parent);
        }

        $em->persist($folder);
        $em->flush();

        return $this->json(['id' => $folder->getId(), 'parent_id' => $folder->getParent()?->getId(),
            'name' => $folder->getName(), 'position' => $folder->getPosition(), 'children' => [], 'items' => []], 201);
    }

    #[Route('/folder/{folderId}', name: 'api_roster_folder_update', methods: ['PATCH'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function updateFolder(
        int $gameId, int $folderId, Request $request,
        GameSesionRepository $gameRepo,
        UserGameSessionRepository $ugsRepo,
        RosterFolderRepository $folderRepo,
        EntityManagerInterface $em,
    ): JsonResponse {
        [$session, $isDm] = $this->getSessionAndDmFlag($gameId, $gameRepo, $ugsRepo);
        if (!$session || !$isDm) return $this->json(['error' => 'Forbidden'], 403);

        $folder = $folderRepo->find($folderId);
        if (!$folder || $folder->getGameSession()->getId() !== $gameId) return $this->json(['error' => 'Not found'], 404);

        $data = json_decode($request->getContent(), true);
        if (isset($data['name'])) $folder->setName($data['name']);
        if (isset($data['position'])) $folder->setPosition($data['position']);
        if (array_key_exists('parent_id', $data)) {
            if ($data['parent_id'] === null) {
                $folder->setParent(null);
            } else {
                $parent = $folderRepo->find($data['parent_id']);
                if ($parent && $parent->getGameSession()->getId() === $gameId && $parent->getId() !== $folderId) {
                    $folder->setParent($parent);
                }
            }
        }

        $em->flush();
        return $this->json(['id' => $folder->getId(), 'parent_id' => $folder->getParent()?->getId(), 'name' => $folder->getName()]);
    }

    #[Route('/folder/{folderId}', name: 'api_roster_folder_delete', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function deleteFolder(
        int $gameId, int $folderId,
        GameSesionRepository $gameRepo,
        UserGameSessionRepository $ugsRepo,
        RosterFolderRepository $folderRepo,
        RosterItemRepository $itemRepo,
        EntityManagerInterface $em,
    ): JsonResponse {
        [$session, $isDm] = $this->getSessionAndDmFlag($gameId, $gameRepo, $ugsRepo);
        if (!$session || !$isDm) return $this->json(['error' => 'Forbidden'], 403);

        $folder = $folderRepo->find($folderId);
        if (!$folder || $folder->getGameSession()->getId() !== $gameId) return $this->json(['error' => 'Not found'], 404);

        foreach ($itemRepo->findBy(['folder' => $folder]) as $item) $item->setFolder(null);
        foreach ($folderRepo->findBy(['parent' => $folder]) as $child) $child->setParent($folder->getParent());

        $em->remove($folder);
        $em->flush();
        return $this->json(['ok' => true]);
    }

    // ── ITEMS ─────────────────────────────────────────────────────────────────

    #[Route('/item', name: 'api_roster_item_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function createItem(
        int $gameId, Request $request,
        GameSesionRepository $gameRepo,
        UserGameSessionRepository $ugsRepo,
        RosterFolderRepository $folderRepo,
        RosterItemRepository $itemRepo,
        RosterVisibilityRepository $visRepo,
        CharacterSheetRepository $charRepo,
        EntityManagerInterface $em,
    ): JsonResponse {
        [$session, $isDm] = $this->getSessionAndDmFlag($gameId, $gameRepo, $ugsRepo);
        if (!$session) return $this->json(['error' => 'Not found'], 404);

        $currentUser = $this->getUser();
        $data = json_decode($request->getContent(), true);
        $kind = $data['kind'] ?? 'custom';

        if (!$isDm && $kind !== 'character') return $this->json(['error' => 'Forbidden'], 403);

        if (!empty($data['entity_id'])) {
            $existing = $itemRepo->findOneBy(['gameSession' => $session, 'kind' => $kind, 'entityId' => (int)$data['entity_id']]);
            if ($existing) {
                $grants = array_map(fn($g) => $g->getUser()->getId(), $visRepo->findBy(['rosterItem' => $existing]));
                return $this->json($this->itemToArray($existing, $currentUser, $isDm, $grants));
            }
        }

        $item = new RosterItem();
        $item->setGameSession($session)->setKind($kind)->setCreatedBy($currentUser);

        if (!empty($data['entity_id'])) {
            $item->setEntityId((int)$data['entity_id']);
            $char = $charRepo->find((int)$data['entity_id']);
            if ($char) { $item->setName($char->getName() ?? ''); $item->setImageUrl($char->getTokenImage() ?? $char->getPortraitImage()); }
        } else {
            $item->setName($data['name'] ?? '')->setColor($data['color'] ?? null)->setImageUrl($data['image_url'] ?? null);
        }

        if (!empty($data['folder_id'])) {
            $folder = $folderRepo->find($data['folder_id']);
            if ($folder && $folder->getGameSession()->getId() === $gameId) $item->setFolder($folder);
        }

        $em->persist($item);
        $em->flush();

        return $this->json($this->itemToArray($item, $currentUser, $isDm, []), 201);
    }

    #[Route('/item/{itemId}', name: 'api_roster_item_update', methods: ['PATCH'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function updateItem(
        int $gameId, int $itemId, Request $request,
        GameSesionRepository $gameRepo,
        UserGameSessionRepository $ugsRepo,
        RosterFolderRepository $folderRepo,
        RosterItemRepository $itemRepo,
        RosterVisibilityRepository $visRepo,
        EntityManagerInterface $em,
    ): JsonResponse {
        [$session, $isDm] = $this->getSessionAndDmFlag($gameId, $gameRepo, $ugsRepo);
        if (!$session || !$isDm) return $this->json(['error' => 'Forbidden'], 403);

        $item = $itemRepo->find($itemId);
        if (!$item || $item->getGameSession()->getId() !== $gameId) return $this->json(['error' => 'Not found'], 404);

        $data = json_decode($request->getContent(), true);
        if (isset($data['position'])) $item->setPosition($data['position']);
        if (array_key_exists('folder_id', $data)) {
            if ($data['folder_id'] === null) {
                $item->setFolder(null);
            } else {
                $folder = $folderRepo->find($data['folder_id']);
                if ($folder && $folder->getGameSession()->getId() === $gameId) $item->setFolder($folder);
            }
        }

        $em->flush();
        $grants = array_map(fn($g) => $g->getUser()->getId(), $visRepo->findBy(['rosterItem' => $item]));
        return $this->json($this->itemToArray($item, $this->getUser(), $isDm, $grants));
    }

    #[Route('/item/{itemId}', name: 'api_roster_item_delete', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function deleteItem(
        int $gameId, int $itemId,
        GameSesionRepository $gameRepo,
        UserGameSessionRepository $ugsRepo,
        RosterItemRepository $itemRepo,
        EntityManagerInterface $em,
    ): JsonResponse {
        [$session, $isDm] = $this->getSessionAndDmFlag($gameId, $gameRepo, $ugsRepo);
        if (!$session || !$isDm) return $this->json(['error' => 'Forbidden'], 403);

        $item = $itemRepo->find($itemId);
        if (!$item || $item->getGameSession()->getId() !== $gameId) return $this->json(['error' => 'Not found'], 404);

        $em->remove($item);
        $em->flush();
        return $this->json(['ok' => true]);
    }
}
