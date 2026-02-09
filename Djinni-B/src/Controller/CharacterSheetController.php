<?php

namespace App\Controller;

use App\Entity\CharacterSheet;
use App\Form\CharacterSheetType;
use App\Repository\CharacterSheetRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/character/sheet')]
final class CharacterSheetController extends AbstractController
{
    #[Route(name: 'app_character_sheet_index', methods: ['GET'])]
    public function index(CharacterSheetRepository $characterSheetRepository): Response
    {
        return $this->render('character_sheet/index.html.twig', [
            'character_sheets' => $characterSheetRepository->findAll(),
        ]);
    }

    #[Route('/new', name: 'app_character_sheet_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $characterSheet = new CharacterSheet();
        $form = $this->createForm(CharacterSheetType::class, $characterSheet);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($characterSheet);
            $entityManager->flush();

            return $this->redirectToRoute('app_character_sheet_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('character_sheet/new.html.twig', [
            'character_sheet' => $characterSheet,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_character_sheet_show', methods: ['GET'])]
    public function show(CharacterSheet $characterSheet): Response
    {
        return $this->render('character_sheet/show.html.twig', [
            'character_sheet' => $characterSheet,
        ]);
    }

    #[Route('/{id}/edit', name: 'app_character_sheet_edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, CharacterSheet $characterSheet, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(CharacterSheetType::class, $characterSheet);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            return $this->redirectToRoute('app_character_sheet_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('character_sheet/edit.html.twig', [
            'character_sheet' => $characterSheet,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_character_sheet_delete', methods: ['POST'])]
    public function delete(Request $request, CharacterSheet $characterSheet, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete'.$characterSheet->getId(), $request->getPayload()->getString('_token'))) {
            $entityManager->remove($characterSheet);
            $entityManager->flush();
        }

        return $this->redirectToRoute('app_character_sheet_index', [], Response::HTTP_SEE_OTHER);
    }
}
