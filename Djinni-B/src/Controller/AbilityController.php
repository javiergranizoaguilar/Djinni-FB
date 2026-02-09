<?php

namespace App\Controller;

use App\Entity\Ability;
use App\Form\AbilityType;
use App\Repository\AbilityRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/ability')]
final class AbilityController extends AbstractController
{
    #[Route(name: 'app_ability_index', methods: ['GET'])]
    public function index(AbilityRepository $abilityRepository): Response
    {
        return $this->render('ability/index.html.twig', [
            'abilities' => $abilityRepository->findAll(),
        ]);
    }

    #[Route('/new', name: 'app_ability_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $ability = new Ability();
        $form = $this->createForm(AbilityType::class, $ability);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($ability);
            $entityManager->flush();

            return $this->redirectToRoute('app_ability_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('ability/new.html.twig', [
            'ability' => $ability,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_ability_show', methods: ['GET'])]
    public function show(Ability $ability): Response
    {
        return $this->render('ability/show.html.twig', [
            'ability' => $ability,
        ]);
    }

    #[Route('/{id}/edit', name: 'app_ability_edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, Ability $ability, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(AbilityType::class, $ability);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            return $this->redirectToRoute('app_ability_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('ability/edit.html.twig', [
            'ability' => $ability,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_ability_delete', methods: ['POST'])]
    public function delete(Request $request, Ability $ability, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete'.$ability->getId(), $request->getPayload()->getString('_token'))) {
            $entityManager->remove($ability);
            $entityManager->flush();
        }

        return $this->redirectToRoute('app_ability_index', [], Response::HTTP_SEE_OTHER);
    }
}
