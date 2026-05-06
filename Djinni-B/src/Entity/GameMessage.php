<?php

namespace App\Entity;

use App\Repository\GameMessageRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: GameMessageRepository::class)]
class GameMessage
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: GameSesion::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?GameSesion $gameSesion = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $sender = null;

    #[ORM\Column(type: 'text')]
    private ?string $content = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getGameSesion(): ?GameSesion { return $this->gameSesion; }
    public function setGameSesion(?GameSesion $gameSesion): static
    {
        $this->gameSesion = $gameSesion;
        return $this;
    }

    public function getSender(): ?User { return $this->sender; }
    public function setSender(?User $sender): static
    {
        $this->sender = $sender;
        return $this;
    }

    public function getContent(): ?string { return $this->content; }
    public function setContent(string $content): static
    {
        $this->content = $content;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }
}
