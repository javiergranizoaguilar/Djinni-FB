<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class InGameController extends AbstractController
{
    #[Route('/in/game', name: 'app_in_game')]
    public function index(): Response
    {
        return $this->render('in_game/index.html.twig', [
            'controller_name' => 'InGameController',
        ]);
    }
    #[Route('/api/mover-token', name: 'api_mover_token', methods: ['POST'])]
    public function moverToken(Request $request): JsonResponse
    {
        // 1. Recibimos el "paquete" (Request) y extraemos el JSON que nos manda React
        $contenido = $request->getContent();

        // 2. Traducimos el JSON a un array de PHP
        $datos = json_decode($contenido, true);

        // 3. Extraemos las coordenadas (y ponemos 0 por defecto si hay un error)
        $x = $datos['x'] ?? 0;
        $y = $datos['y'] ?? 0;

        // Aquí es donde en el futuro guardaremos la posición en la Base de Datos...
        // ... (Falta código de base de datos) ...

        // 4. Preparamos la respuesta para el "camarero" (React)
        return new JsonResponse([
            'status' => 'success',
            'mensaje' => '¡Symfony te escucha! Ficha movida a la posición X: ' . $x . ', Y: ' . $y
        ], 200); // 200 es el código HTTP de "Todo OK"
    }
}
