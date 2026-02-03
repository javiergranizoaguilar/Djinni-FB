<?php

namespace App\Entity;

use App\Repository\ProficencyRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ProficencyRepository::class)]
class Proficency
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(length: 255)]
    private ?string $type = null;

    #[ORM\Column]
    private ?int $value_modifier = null;

    #[ORM\ManyToOne(inversedBy: 'proficencies')]
    private ?CharacterSheet $character_id = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function getValueModifier(): ?int
    {
        return $this->value_modifier;
    }

    public function setValueModifier(int $value_modifier): static
    {
        $this->value_modifier = $value_modifier;

        return $this;
    }

    public function getCharacterId(): ?CharacterSheet
    {
        return $this->character_id;
    }

    public function setCharacterId(?CharacterSheet $character_id): static
    {
        $this->character_id = $character_id;

        return $this;
    }
}
