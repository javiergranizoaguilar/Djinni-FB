<?php

namespace App\Entity;

use App\Repository\AbilityRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AbilityRepository::class)]
class Ability
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $description = null;

    #[ORM\Column(length: 255)]
    private ?string $source_tipe = null;

    #[ORM\Column]
    private ?bool $is_active = null;

    #[ORM\Column]
    private ?bool $has_limited_uses = null;

    #[ORM\Column(nullable: true)]
    private ?int $max_uses = null;

    #[ORM\Column(nullable: true)]
    private ?int $current_uses = null;

    #[ORM\Column(length: 255)]
    private ?string $recharge_type = null;

    #[ORM\ManyToOne(inversedBy: 'abilities')]
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

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getSourceTipe(): ?string
    {
        return $this->source_tipe;
    }

    public function setSourceTipe(string $source_tipe): static
    {
        $this->source_tipe = $source_tipe;

        return $this;
    }

    public function isActive(): ?bool
    {
        return $this->is_active;
    }

    public function setIsActive(bool $is_active): static
    {
        $this->is_active = $is_active;

        return $this;
    }

    public function hasLimitedUses(): ?bool
    {
        return $this->has_limited_uses;
    }

    public function setHasLimitedUses(bool $has_limited_uses): static
    {
        $this->has_limited_uses = $has_limited_uses;

        return $this;
    }

    public function getMaxUses(): ?int
    {
        return $this->max_uses;
    }

    public function setMaxUses(?int $max_uses): static
    {
        $this->max_uses = $max_uses;

        return $this;
    }

    public function getCurrentUses(): ?int
    {
        return $this->current_uses;
    }

    public function setCurrentUses(?int $current_uses): static
    {
        $this->current_uses = $current_uses;

        return $this;
    }

    public function getRechargeType(): ?string
    {
        return $this->recharge_type;
    }

    public function setRechargeType(string $recharge_type): static
    {
        $this->recharge_type = $recharge_type;

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
