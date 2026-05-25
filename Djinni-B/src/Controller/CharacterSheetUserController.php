<?php

namespace App\Controller;

use App\Entity\CharacterSheetUser;
use App\Form\CharacterSheetUserType;
use App\Repository\CharacterSheetUserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/character/sheet/user')]
final class CharacterSheetUserController extends AbstractController
{
    #[Route(name: 'app_character_sheet_user_index', methods: ['GET'])]
    public function index(CharacterSheetUserRepository $characterSheetUserRepository): Response
    {
        return $this->render('character_sheet_user/index.html.twig', [
            'character_sheet_users' => $characterSheetUserRepository->findAll(),
        ]);
    }

    #[Route('/new', name: 'app_character_sheet_user_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $characterSheetUser = new CharacterSheetUser();
        $form = $this->createForm(CharacterSheetUserType::class, $characterSheetUser);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($characterSheetUser);
            $entityManager->flush();

            return $this->redirectToRoute('app_character_sheet_user_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('character_sheet_user/new.html.twig', [
            'character_sheet_user' => $characterSheetUser,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_character_sheet_user_show', methods: ['GET'])]
    public function show(CharacterSheetUser $characterSheetUser): Response
    {
        return $this->render('character_sheet_user/show.html.twig', [
            'character_sheet_user' => $characterSheetUser,
        ]);
    }

    #[Route('/{id}/edit', name: 'app_character_sheet_user_edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, CharacterSheetUser $characterSheetUser, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(CharacterSheetUserType::class, $characterSheetUser);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            return $this->redirectToRoute('app_character_sheet_user_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('character_sheet_user/edit.html.twig', [
            'character_sheet_user' => $characterSheetUser,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_character_sheet_user_delete', methods: ['POST'])]
    public function delete(Request $request, CharacterSheetUser $characterSheetUser, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete'.$characterSheetUser->getId(), $request->getPayload()->getString('_token'))) {
            $entityManager->remove($characterSheetUser);
            $entityManager->flush();
        }

        return $this->redirectToRoute('app_character_sheet_user_index', [], Response::HTTP_SEE_OTHER);
    }
}
