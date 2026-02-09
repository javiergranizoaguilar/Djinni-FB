<?php

namespace App\Controller;

use App\Entity\MonsterUser;
use App\Form\MonsterUserType;
use App\Repository\MonsterUserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/monster/user')]
final class MonsterUserController extends AbstractController
{
    #[Route(name: 'app_monster_user_index', methods: ['GET'])]
    public function index(MonsterUserRepository $monsterUserRepository): Response
    {
        return $this->render('monster_user/index.html.twig', [
            'monster_users' => $monsterUserRepository->findAll(),
        ]);
    }

    #[Route('/new', name: 'app_monster_user_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $monsterUser = new MonsterUser();
        $form = $this->createForm(MonsterUserType::class, $monsterUser);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($monsterUser);
            $entityManager->flush();

            return $this->redirectToRoute('app_monster_user_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('monster_user/new.html.twig', [
            'monster_user' => $monsterUser,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_monster_user_show', methods: ['GET'])]
    public function show(MonsterUser $monsterUser): Response
    {
        return $this->render('monster_user/show.html.twig', [
            'monster_user' => $monsterUser,
        ]);
    }

    #[Route('/{id}/edit', name: 'app_monster_user_edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, MonsterUser $monsterUser, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(MonsterUserType::class, $monsterUser);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            return $this->redirectToRoute('app_monster_user_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('monster_user/edit.html.twig', [
            'monster_user' => $monsterUser,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_monster_user_delete', methods: ['POST'])]
    public function delete(Request $request, MonsterUser $monsterUser, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete'.$monsterUser->getId(), $request->getPayload()->getString('_token'))) {
            $entityManager->remove($monsterUser);
            $entityManager->flush();
        }

        return $this->redirectToRoute('app_monster_user_index', [], Response::HTTP_SEE_OTHER);
    }
}
