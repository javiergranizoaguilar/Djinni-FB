<?php

namespace App\Entity;

use App\Repository\CharacterSheetUserRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CharacterSheetUserRepository::class)]
class CharacterSheetUser
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'characterSheetUsers')]
    private ?User $user_id = null;

    #[ORM\ManyToOne(inversedBy: 'characterSheetUsers')]
    private ?CharacterSheet $charactersheet_id = null;

    #[ORM\Column]
    private ?bool $visible = null;

    #[ORM\Column]
    private ?bool $edit = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUserId(): ?User
    {
        return $this->user_id;
    }

    public function setUserId(?User $user_id): static
    {
        $this->user_id = $user_id;

        return $this;
    }

    public function getCharactersheetId(): ?CharacterSheet
    {
        return $this->charactersheet_id;
    }

    public function setCharactersheetId(?CharacterSheet $charactersheet_id): static
    {
        $this->charactersheet_id = $charactersheet_id;

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

    public function isEdit(): ?bool
    {
        return $this->edit;
    }

    public function setEdit(bool $edit): static
    {
        $this->edit = $edit;

        return $this;
    }
}
