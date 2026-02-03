<?php

namespace App\Entity;

use App\Repository\AttackRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AttackRepository::class)]
class Attack
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(nullable: true)]
    private ?array $damage_dice = null;

    #[ORM\Column(nullable: true)]
    private ?array $damage_type = null;

    #[ORM\Column(length: 255)]
    private ?string $range_ = null;

    #[ORM\Column]
    private ?bool $is_saving_throw = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $description = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $attack_modifier = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $saving_throw_tipe = null;

    #[ORM\ManyToOne(inversedBy: 'attacks')]
    private ?CharacterSheet $character_attack = null;

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

    public function getDamageDice(): ?array
    {
        return $this->damage_dice;
    }

    public function setDamageDice(?array $damage_dice): static
    {
        $this->damage_dice = $damage_dice;

        return $this;
    }

    public function getDamageType(): ?array
    {
        return $this->damage_type;
    }

    public function setDamageType(?array $damage_type): static
    {
        $this->damage_type = $damage_type;

        return $this;
    }

    public function getRange(): ?string
    {
        return $this->range_;
    }

    public function setRange(string $range_): static
    {
        $this->range_ = $range_;

        return $this;
    }

    public function isSavingThrow(): ?bool
    {
        return $this->is_saving_throw;
    }

    public function setIsSavingThrow(bool $is_saving_throw): static
    {
        $this->is_saving_throw = $is_saving_throw;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getAttackModifier(): ?string
    {
        return $this->attack_modifier;
    }

    public function setAttackModifier(?string $attack_modifier): static
    {
        $this->attack_modifier = $attack_modifier;

        return $this;
    }

    public function getSavingThrowTipe(): ?string
    {
        return $this->saving_throw_tipe;
    }

    public function setSavingThrowTipe(?string $saving_throw_tipe): static
    {
        $this->saving_throw_tipe = $saving_throw_tipe;

        return $this;
    }

    public function getCharacterAttack(): ?CharacterSheet
    {
        return $this->character_attack;
    }

    public function setCharacterAttack(?CharacterSheet $character_attack): static
    {
        $this->character_attack = $character_attack;

        return $this;
    }
}
