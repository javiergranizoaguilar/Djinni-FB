<?php

namespace App\Repository;

use App\Entity\GameMessage;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class GameMessageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, GameMessage::class);
    }

    public function findLast50ByGame(int $gameId): array
    {
        return $this->createQueryBuilder('m')
            ->andWhere('m.gameSesion = :gameId')
            ->setParameter('gameId', $gameId)
            ->orderBy('m.createdAt', 'ASC')
            ->setMaxResults(50)
            ->getQuery()
            ->getResult();
    }
}
