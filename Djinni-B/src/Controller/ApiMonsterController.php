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
                    'type' => $monster->getType(),
                    'size' => $monster->getSize(),
                    'cr' => $monster->getChallengeRating(),
                    'ac' => $monster->getArmorClass(),
                    'hp' => $monster->getHitPointsAverage(),
                    'is_editable' => $mu->isEditable(),
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
}
