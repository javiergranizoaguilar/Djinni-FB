<?php

namespace App\Entity;

use App\Repository\SpellRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SpellRepository::class)]
class Spell
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column]
    private ?int $level = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $school = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column]
    private ?bool $is_prepared = null;

    #[ORM\Column]
    private ?bool $has_limited_uses = null;

    #[ORM\Column(nullable: true)]
    private ?int $max_charges = null;

    #[ORM\Column(nullable: true)]
    private ?int $current_charges = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $casting_time = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $spell_range = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $components = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $duration = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $higer_level_description = null;

    /**
     * @var Collection<int, CharacterSheet>
     */
    #[ORM\ManyToMany(targetEntity: CharacterSheet::class, inversedBy: 'spells')]
    private Collection $character_id;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $recharge_type = null;

    /**
     * @var Collection<int, Monster>
     */
    #[ORM\ManyToMany(targetEntity: Monster::class, inversedBy: 'spells')]
    private Collection $monster_spell;

    public function __construct()
    {
        $this->character_id = new ArrayCollection();
        $this->monster_spell = new ArrayCollection();
    }

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

    public function getLevel(): ?int
    {
        return $this->level;
    }

    public function setLevel(int $level): static
    {
        $this->level = $level;

        return $this;
    }

    public function getSchool(): ?string
    {
        return $this->school;
    }

    public function setSchool(?string $school): static
    {
        $this->school = $school;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function isPrepared(): ?bool
    {
        return $this->is_prepared;
    }

    public function setIsPrepared(bool $is_prepared): static
    {
        $this->is_prepared = $is_prepared;

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

    public function getMaxCharges(): ?int
    {
        return $this->max_charges;
    }

    public function setMaxCharges(?int $max_charges): static
    {
        $this->max_charges = $max_charges;

        return $this;
    }

    public function getCurrentCharges(): ?int
    {
        return $this->current_charges;
    }

    public function setCurrentCharges(?int $current_charges): static
    {
        $this->current_charges = $current_charges;

        return $this;
    }

    public function getCastingTime(): ?string
    {
        return $this->casting_time;
    }

    public function setCastingTime(?string $casting_time): static
    {
        $this->casting_time = $casting_time;

        return $this;
    }

    public function getSpellRange(): ?string
    {
        return $this->spell_range;
    }

    public function setSpellRange(?string $spell_range): static
    {
        $this->spell_range = $spell_range;

        return $this;
    }

    public function getComponents(): ?string
    {
        return $this->components;
    }

    public function setComponents(?string $components): static
    {
        $this->components = $components;

        return $this;
    }

    public function getDuration(): ?string
    {
        return $this->duration;
    }

    public function setDuration(?string $duration): static
    {
        $this->duration = $duration;

        return $this;
    }

    public function getHigerLevelDescription(): ?string
    {
        return $this->higer_level_description;
    }

    public function setHigerLevelDescription(?string $higer_level_description): static
    {
        $this->higer_level_description = $higer_level_description;

        return $this;
    }

    /**
     * @return Collection<int, CharacterSheet>
     */
    public function getCharacterId(): Collection
    {
        return $this->character_id;
    }

    public function addCharacterId(CharacterSheet $characterId): static
    {
        if (!$this->character_id->contains($characterId)) {
            $this->character_id->add($characterId);
        }

        return $this;
    }

    public function removeCharacterId(CharacterSheet $characterId): static
    {
        $this->character_id->removeElement($characterId);

        return $this;
    }

    public function getRechargeType(): ?string
    {
        return $this->recharge_type;
    }

    public function setRechargeType(?string $recharge_type): static
    {
        $this->recharge_type = $recharge_type;

        return $this;
    }

    /**
     * @return Collection<int, Monster>
     */
    public function getMonsterSpell(): Collection
    {
        return $this->monster_spell;
    }

    public function addMonsterSpell(Monster $monsterSpell): static
    {
        if (!$this->monster_spell->contains($monsterSpell)) {
            $this->monster_spell->add($monsterSpell);
        }

        return $this;
    }

    public function removeMonsterSpell(Monster $monsterSpell): static
    {
        $this->monster_spell->removeElement($monsterSpell);

        return $this;
    }
}
