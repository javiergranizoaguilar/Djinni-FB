<?php

namespace App\Controller;

use App\Entity\Proficency;
use App\Form\ProficencyType;
use App\Repository\ProficencyRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/proficency')]
final class ProficencyController extends AbstractController
{
    #[Route(name: 'app_proficency_index', methods: ['GET'])]
    public function index(ProficencyRepository $proficencyRepository): Response
    {
        return $this->render('proficency/index.html.twig', [
            'proficencies' => $proficencyRepository->findAll(),
        ]);
    }

    #[Route('/new', name: 'app_proficency_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $proficency = new Proficency();
        $form = $this->createForm(ProficencyType::class, $proficency);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($proficency);
            $entityManager->flush();

            return $this->redirectToRoute('app_proficency_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('proficency/new.html.twig', [
            'proficency' => $proficency,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_proficency_show', methods: ['GET'])]
    public function show(Proficency $proficency): Response
    {
        return $this->render('proficency/show.html.twig', [
            'proficency' => $proficency,
        ]);
    }

    #[Route('/{id}/edit', name: 'app_proficency_edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, Proficency $proficency, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(ProficencyType::class, $proficency);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            return $this->redirectToRoute('app_proficency_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('proficency/edit.html.twig', [
            'proficency' => $proficency,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_proficency_delete', methods: ['POST'])]
    public function delete(Request $request, Proficency $proficency, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete'.$proficency->getId(), $request->getPayload()->getString('_token'))) {
            $entityManager->remove($proficency);
            $entityManager->flush();
        }

        return $this->redirectToRoute('app_proficency_index', [], Response::HTTP_SEE_OTHER);
    }
}
