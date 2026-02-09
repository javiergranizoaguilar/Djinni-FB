<?php

namespace App\Controller;

use App\Entity\Attack;
use App\Form\AttackType;
use App\Repository\AttackRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/attack')]
final class AttackController extends AbstractController
{
    #[Route(name: 'app_attack_index', methods: ['GET'])]
    public function index(AttackRepository $attackRepository): Response
    {
        return $this->render('attack/index.html.twig', [
            'attacks' => $attackRepository->findAll(),
        ]);
    }

    #[Route('/new', name: 'app_attack_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $attack = new Attack();
        $form = $this->createForm(AttackType::class, $attack);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($attack);
            $entityManager->flush();

            return $this->redirectToRoute('app_attack_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('attack/new.html.twig', [
            'attack' => $attack,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_attack_show', methods: ['GET'])]
    public function show(Attack $attack): Response
    {
        return $this->render('attack/show.html.twig', [
            'attack' => $attack,
        ]);
    }

    #[Route('/{id}/edit', name: 'app_attack_edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, Attack $attack, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(AttackType::class, $attack);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            return $this->redirectToRoute('app_attack_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('attack/edit.html.twig', [
            'attack' => $attack,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_attack_delete', methods: ['POST'])]
    public function delete(Request $request, Attack $attack, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete'.$attack->getId(), $request->getPayload()->getString('_token'))) {
            $entityManager->remove($attack);
            $entityManager->flush();
        }

        return $this->redirectToRoute('app_attack_index', [], Response::HTTP_SEE_OTHER);
    }
}
