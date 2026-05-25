<?php

namespace App\Entity;

use App\Repository\RosterVisibilityRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RosterVisibilityRepository::class)]
#[ORM\UniqueConstraint(columns: ['roster_item_id', 'user_id'])]
class RosterVisibility
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?RosterItem $rosterItem = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    public function getId(): ?int { return $this->id; }

    public function getRosterItem(): ?RosterItem { return $this->rosterItem; }
    public function setRosterItem(?RosterItem $item): static { $this->rosterItem = $item; return $this; }

    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): static { $this->user = $user; return $this; }
}
