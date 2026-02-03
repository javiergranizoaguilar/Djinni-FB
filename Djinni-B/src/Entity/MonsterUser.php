<?php

namespace App\Entity;

use App\Repository\MonsterUserRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: MonsterUserRepository::class)]
class MonsterUser
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'monsterUsers')]
    private ?User $user = null;

    #[ORM\ManyToOne(inversedBy: 'monsterUsers')]
    private ?Monster $monster = null;

    #[ORM\Column]
    private ?bool $editable = null;

    #[ORM\Column]
    private ?bool $visible = null;

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

    public function getMonster(): ?Monster
    {
        return $this->monster;
    }

    public function setMonster(?Monster $monster): static
    {
        $this->monster = $monster;

        return $this;
    }

    public function isEditable(): ?bool
    {
        return $this->editable;
    }

    public function setEditable(bool $editable): static
    {
        $this->editable = $editable;

        return $this;
    }

    public function isVisible(): ?bool
    {
        return $this->visible;
    }

    public function setVisible(bool $visible): static
    {
        $this->visible = $visible;

        return $this;
    }
}
