<?php

namespace App\Entity;

use App\Repository\RosterItemRepository;
use App\Entity\User;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RosterItemRepository::class)]
class RosterItem
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?GameSesion $gameSession = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?RosterFolder $folder = null;

    #[ORM\Column(length: 20)]
    private string $kind = 'custom';

    #[ORM\Column(nullable: true)]
    private ?int $entityId = null;

    #[ORM\Column(length: 255)]
    private string $name = '';

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $color = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $imageUrl = null;

    #[ORM\Column]
    private int $position = 0;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $createdBy = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $controlledByUser = null;

    #[ORM\Column]
    private bool $isPublic = false;

    public function getId(): ?int { return $this->id; }

    public function getGameSession(): ?GameSesion { return $this->gameSession; }
    public function setGameSession(?GameSesion $g): static { $this->gameSession = $g; return $this; }

    public function getFolder(): ?RosterFolder { return $this->folder; }
    public function setFolder(?RosterFolder $f): static { $this->folder = $f; return $this; }

    public function getKind(): string { return $this->kind; }
    public function setKind(string $k): static { $this->kind = $k; return $this; }

    public function getEntityId(): ?int { return $this->entityId; }
    public function setEntityId(?int $id): static { $this->entityId = $id; return $this; }

    public function getName(): string { return $this->name; }
    public function setName(string $n): static { $this->name = $n; return $this; }

    public function getColor(): ?string { return $this->color; }
    public function setColor(?string $c): static { $this->color = $c; return $this; }

    public function getImageUrl(): ?string { return $this->imageUrl; }
    public function setImageUrl(?string $u): static { $this->imageUrl = $u; return $this; }

    public function getPosition(): int { return $this->position; }
    public function setPosition(int $p): static { $this->position = $p; return $this; }

    public function getCreatedBy(): ?User { return $this->createdBy; }
    public function setCreatedBy(?User $u): static { $this->createdBy = $u; return $this; }

    public function isPublic(): bool { return $this->isPublic; }
    public function setIsPublic(bool $v): static { $this->isPublic = $v; return $this; }

    public function getControlledByUser(): ?User { return $this->controlledByUser; }
    public function setControlledByUser(?User $u): static { $this->controlledByUser = $u; return $this; }
}
