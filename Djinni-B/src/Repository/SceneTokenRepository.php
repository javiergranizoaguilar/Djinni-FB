<?php

namespace App\Repository;

use App\Entity\SceneToken;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<SceneToken>
 *
 * @method SceneToken|null find($id, $lockMode = null, $lockVersion = null)
 * @method SceneToken|null findOneBy(array $criteria, array $orderBy = null)
 * @method SceneToken[]    findAll()
 * @method SceneToken[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class SceneTokenRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SceneToken::class);
    }
}
