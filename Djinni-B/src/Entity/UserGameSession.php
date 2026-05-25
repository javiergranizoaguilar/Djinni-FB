<?php

namespace App\Entity;

use App\Repository\UserGameSessionRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UserGameSessionRepository::class)]
class UserGameSession
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'userGameSessions')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\ManyToOne(inversedBy: 'userGameSessions')]
    #[ORM\JoinColumn(nullable: false)]
    private ?GameSesion $gameSession = null;

    #[ORM\Column]
    private ?bool $isDm = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getGameSession(): ?GameSesion
    {
        return $this->gameSession;
    }

    public function setGameSession(?GameSesion $gameSession): static
    {
        $this->gameSession = $gameSession;

        return $this;
    }

    public function isDm(): ?bool
    {
        return $this->isDm;
    }

    public function setIsDm(bool $isDm): static
    {
        $this->isDm = $isDm;

        return $this;
    }
}
