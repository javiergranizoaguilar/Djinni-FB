<?php

namespace App\Entity;

use App\Repository\CharacterSheetRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CharacterSheetRepository::class)]
class CharacterSheet
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $spellcasting_abillity = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $token_image = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $portrait_image = null;

    #[ORM\Column]
    private ?float $caster_level = null;

    #[ORM\Column]
    private array $stats = [];

    #[ORM\Column(nullable: true)]
    private ?array $bonuses = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $apareance = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $backstory = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $personality_traits = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $ideals = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $bonds = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $flaws = null;

    #[ORM\Column(nullable: true)]
    private ?int $exaustion = null;

    #[ORM\Column]
    private array $currency = [];

    #[ORM\Column(nullable: true)]
    private ?array $custom_counters = null;

    /**
     * @var Collection<int, Inventory>
     */
    #[ORM\OneToMany(targetEntity: Inventory::class, mappedBy: 'seet')]
    private Collection $inventories;

    /**
     * @var Collection<int, Attack>
     */
    #[ORM\OneToMany(targetEntity: Attack::class, mappedBy: 'character_attack')]
    private Collection $attacks;

    /**
     * @var Collection<int, Spell>
     */
    #[ORM\ManyToMany(targetEntity: Spell::class, mappedBy: 'character_id')]
    private Collection $spells;

    #[ORM\Column(nullable: true)]
    private ?array $modifiers = null;

    /**
     * @var Collection<int, Proficency>
     */
    #[ORM\OneToMany(targetEntity: Proficency::class, mappedBy: 'character_id')]
    private Collection $proficencies;

    /**
     * @var Collection<int, Ability>
     */
    #[ORM\OneToMany(targetEntity: Ability::class, mappedBy: 'character_id')]
    private Collection $abilities;

    #[ORM\ManyToOne(inversedBy: 'characterSheets')]
    private ?GameSesion $gamesesion = null;

    /**
     * @var Collection<int, CharacterSheetUser>
     */
    #[ORM\OneToMany(targetEntity: CharacterSheetUser::class, mappedBy: 'charactersheet_id')]
    private Collection $characterSheetUsers;

    public function __construct()
    {
        $this->inventories = new ArrayCollection();
        $this->attacks = new ArrayCollection();
        $this->spells = new ArrayCollection();
        $this->proficencies = new ArrayCollection();
        $this->abilities = new ArrayCollection();
        $this->characterSheetUsers = new ArrayCollection();
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

    public function getSpellcastingAbillity(): ?string
    {
        return $this->spellcasting_abillity;
    }

    public function setSpellcastingAbillity(?string $spellcasting_abillity): static
    {
        $this->spellcasting_abillity = $spellcasting_abillity;

        return $this;
    }

    public function getTokenImage(): ?string
    {
        return $this->token_image;
    }

    public function setTokenImage(?string $token_image): static
    {
        $this->token_image = $token_image;

        return $this;
    }

    public function getPortraitImage(): ?string
    {
        return $this->portrait_image;
    }

    public function setPortraitImage(?string $portrait_image): static
    {
        $this->portrait_image = $portrait_image;

        return $this;
    }

    public function getCasterLevel(): ?float
    {
        return $this->caster_level;
    }

    public function setCasterLevel(float $caster_level): static
    {
        $this->caster_level = $caster_level;

        return $this;
    }

    public function getStats(): array
    {
        return $this->stats;
    }

    public function setStats(array $stats): static
    {
        $this->stats = $stats;

        return $this;
    }

    public function getBonuses(): ?array
    {
        return $this->bonuses;
    }

    public function setBonuses(?array $bonuses): static
    {
        $this->bonuses = $bonuses;

        return $this;
    }

    public function getApareance(): ?string
    {
        return $this->apareance;
    }

    public function setApareance(?string $apareance): static
    {
        $this->apareance = $apareance;

        return $this;
    }

    public function getBackstory(): ?string
    {
        return $this->backstory;
    }

    public function setBackstory(?string $backstory): static
    {
        $this->backstory = $backstory;

        return $this;
    }

    public function getPersonalityTraits(): ?string
    {
        return $this->personality_traits;
    }

    public function setPersonalityTraits(?string $personality_traits): static
    {
        $this->personality_traits = $personality_traits;

        return $this;
    }

    public function getIdeals(): ?string
    {
        return $this->ideals;
    }

    public function setIdeals(?string $ideals): static
    {
        $this->ideals = $ideals;

        return $this;
    }

    public function getBonds(): ?string
    {
        return $this->bonds;
    }

    public function setBonds(?string $bonds): static
    {
        $this->bonds = $bonds;

        return $this;
    }

    public function getFlaws(): ?string
    {
        return $this->flaws;
    }

    public function setFlaws(?string $flaws): static
    {
        $this->flaws = $flaws;

        return $this;
    }

    public function getExaustion(): ?int
    {
        return $this->exaustion;
    }

    public function setExaustion(?int $exaustion): static
    {
        $this->exaustion = $exaustion;

        return $this;
    }

    public function getCurrency(): array
    {
        return $this->currency;
    }

    public function setCurrency(array $currency): static
    {
        $this->currency = $currency;

        return $this;
    }

    public function getCustomCounters(): ?array
    {
        return $this->custom_counters;
    }

    public function setCustomCounters(?array $custom_counters): static
    {
        $this->custom_counters = $custom_counters;

        return $this;
    }

    /**
     * @return Collection<int, Inventory>
     */
    public function getInventories(): Collection
    {
        return $this->inventories;
    }

    public function addInventory(Inventory $inventory): static
    {
        if (!$this->inventories->contains($inventory)) {
            $this->inventories->add($inventory);
            $inventory->setSeet($this);
        }

        return $this;
    }

    public function removeInventory(Inventory $inventory): static
    {
        if ($this->inventories->removeElement($inventory)) {
            // set the owning side to null (unless already changed)
            if ($inventory->getSeet() === $this) {
                $inventory->setSeet(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Attack>
     */
    public function getAttacks(): Collection
    {
        return $this->attacks;
    }

    public function addAttack(Attack $attack): static
    {
        if (!$this->attacks->contains($attack)) {
            $this->attacks->add($attack);
            $attack->setCharacterAttack($this);
        }

        return $this;
    }

    public function removeAttack(Attack $attack): static
    {
        if ($this->attacks->removeElement($attack)) {
            // set the owning side to null (unless already changed)
            if ($attack->getCharacterAttack() === $this) {
                $attack->setCharacterAttack(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Spell>
     */
    public function getSpells(): Collection
    {
        return $this->spells;
    }

    public function addSpell(Spell $spell): static
    {
        if (!$this->spells->contains($spell)) {
            $this->spells->add($spell);
            $spell->addCharacterId($this);
        }

        return $this;
    }

    public function removeSpell(Spell $spell): static
    {
        if ($this->spells->removeElement($spell)) {
            $spell->removeCharacterId($this);
        }

        return $this;
    }

    public function getModifiers(): ?array
    {
        return $this->modifiers;
    }

    public function setModifiers(?array $modifiers): static
    {
        $this->modifiers = $modifiers;

        return $this;
    }

    /**
     * @return Collection<int, Proficency>
     */
    public function getProficencies(): Collection
    {
        return $this->proficencies;
    }

    public function addProficency(Proficency $proficency): static
    {
        if (!$this->proficencies->contains($proficency)) {
            $this->proficencies->add($proficency);
            $proficency->setCharacterId($this);
        }

        return $this;
    }

    public function removeProficency(Proficency $proficency): static
    {
        if ($this->proficencies->removeElement($proficency)) {
            // set the owning side to null (unless already changed)
            if ($proficency->getCharacterId() === $this) {
                $proficency->setCharacterId(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Ability>
     */
    public function getAbilities(): Collection
    {
        return $this->abilities;
    }

    public function addAbility(Ability $ability): static
    {
        if (!$this->abilities->contains($ability)) {
            $this->abilities->add($ability);
            $ability->setCharacterId($this);
        }

        return $this;
    }

    public function removeAbility(Ability $ability): static
    {
        if ($this->abilities->removeElement($ability)) {
            // set the owning side to null (unless already changed)
            if ($ability->getCharacterId() === $this) {
                $ability->setCharacterId(null);
            }
        }

        return $this;
    }

    public function getGamesesion(): ?GameSesion
    {
        return $this->gamesesion;
    }

    public function setGamesesion(?GameSesion $gamesesion): static
    {
        $this->gamesesion = $gamesesion;

        return $this;
    }

    /**
     * @return Collection<int, CharacterSheetUser>
     */
    public function getCharacterSheetUsers(): Collection
    {
        return $this->characterSheetUsers;
    }

    public function addCharacterSheetUser(CharacterSheetUser $characterSheetUser): static
    {
        if (!$this->characterSheetUsers->contains($characterSheetUser)) {
            $this->characterSheetUsers->add($characterSheetUser);
            $characterSheetUser->setCharactersheetId($this);
        }

        return $this;
    }

    public function removeCharacterSheetUser(CharacterSheetUser $characterSheetUser): static
    {
        if ($this->characterSheetUsers->removeElement($characterSheetUser)) {
            // set the owning side to null (unless already changed)
            if ($characterSheetUser->getCharactersheetId() === $this) {
                $characterSheetUser->setCharactersheetId(null);
            }
        }

        return $this;
    }
}
