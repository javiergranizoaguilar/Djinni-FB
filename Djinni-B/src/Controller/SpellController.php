<?php

namespace App\Controller;

use App\Entity\Spell;
use App\Form\SpellType;
use App\Repository\SpellRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/spell')]
final class SpellController extends AbstractController
{
    #[Route(name: 'app_spell_index', methods: ['GET'])]
    public function index(SpellRepository $spellRepository): Response
    {
        return $this->render('spell/index.html.twig', [
            'spells' => $spellRepository->findAll(),
        ]);
    }

    #[Route('/new', name: 'app_spell_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $spell = new Spell();
        $form = $this->createForm(SpellType::class, $spell);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($spell);
            $entityManager->flush();

            return $this->redirectToRoute('app_spell_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('spell/new.html.twig', [
            'spell' => $spell,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_spell_show', methods: ['GET'])]
    public function show(Spell $spell): Response
    {
        return $this->render('spell/show.html.twig', [
            'spell' => $spell,
        ]);
    }

    #[Route('/{id}/edit', name: 'app_spell_edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, Spell $spell, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(SpellType::class, $spell);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            return $this->redirectToRoute('app_spell_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('spell/edit.html.twig', [
            'spell' => $spell,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_spell_delete', methods: ['POST'])]
    public function delete(Request $request, Spell $spell, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete'.$spell->getId(), $request->getPayload()->getString('_token'))) {
            $entityManager->remove($spell);
            $entityManager->flush();
        }

        return $this->redirectToRoute('app_spell_index', [], Response::HTTP_SEE_OTHER);
    }
}
