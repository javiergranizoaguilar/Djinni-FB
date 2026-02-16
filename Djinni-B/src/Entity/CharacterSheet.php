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
    private ?bool $sav_str = null;

    #[ORM\Column(nullable: true)]
    private ?int $sav_str_mod = null;

    #[ORM\Column(nullable: true)]
    private ?bool $sav_dex = null;

    #[ORM\Column(nullable: true)]
    private ?int $sav_dex_mod = null;

    #[ORM\Column(nullable: true)]
    private ?bool $sav_int = null;

    #[ORM\Column(nullable: true)]
    private ?int $sav_int_mod = null;

    #[ORM\Column(nullable: true)]
    private ?bool $sav_wis = null;

    #[ORM\Column(nullable: true)]
    private ?int $sav_wis_mod = null;

    #[ORM\Column(nullable: true)]
    private ?bool $sav_cha = null;

    #[ORM\Column(nullable: true)]
    private ?int $sav_cha_mod = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $acrobatics = null;

    #[ORM\Column(nullable: true)]
    private ?int $acrobatics_mod = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $animal_handling = null;

    #[ORM\Column(nullable: true)]
    private ?int $animal_handling_mod = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $arcana = null;

    #[ORM\Column(nullable: true)]
    private ?int $arcana_mod = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $athletics = null;

    #[ORM\Column(nullable: true)]
    private ?int $athletics_mod = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $deception = null;

    #[ORM\Column(nullable: true)]
    private ?int $deception_mod = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $history = null;

    #[ORM\Column(nullable: true)]
    private ?int $history_mod = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $insight = null;

    #[ORM\Column(nullable: true)]
    private ?int $insight_mod = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $intimidation = null;

    #[ORM\Column(nullable: true)]
    private ?int $intimidation_mod = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $investigation = null;

    #[ORM\Column(nullable: true)]
    private ?int $investigation_mod = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $medicine = null;

    #[ORM\Column(nullable: true)]
    private ?int $medicine_mod = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $nature = null;

    #[ORM\Column(nullable: true)]
    private ?int $nature_mod = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $perception = null;

    #[ORM\Column(nullable: true)]
    private ?int $perception_mod = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $performance = null;

    #[ORM\Column(nullable: true)]
    private ?int $performance_mod = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $persuasion = null;

    #[ORM\Column(nullable: true)]
    private ?int $persuasion_mod = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $religion = null;

    #[ORM\Column(nullable: true)]
    private ?int $religion_mod = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $sleight_of_hand = null;

    #[ORM\Column(nullable: true)]
    private ?int $sleight_of_hand_mod = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $stealth = null;

    #[ORM\Column(nullable: true)]
    private ?int $stealth_mod = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $survival = null;

    #[ORM\Column(nullable: true)]
    private ?int $survival_mod = null;

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

    #[ORM\Column(nullable: true)]
    private ?array $level = null;

    /**
     * @var Collection<int, Inventory>
     */
    #[ORM\OneToMany(targetEntity: Inventory::class, mappedBy: 'seet', orphanRemoval: true)]
    private Collection $inventories;

    /**
     * @var Collection<int, Attack>
     */
    #[ORM\OneToMany(targetEntity: Attack::class, mappedBy: 'character_attack', orphanRemoval: true)]
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
    #[ORM\OneToMany(targetEntity: Proficency::class, mappedBy: 'character_id', orphanRemoval: true)]
    private Collection $proficencies;

    /**
     * @var Collection<int, Ability>
     */
    #[ORM\OneToMany(targetEntity: Ability::class, mappedBy: 'character_id', orphanRemoval: true)]
    private Collection $abilities;

    #[ORM\ManyToOne(inversedBy: 'characterSheets')]
    private ?GameSesion $gamesesion = null;

    /**
     * @var Collection<int, CharacterSheetUser>
     */
    #[ORM\OneToMany(targetEntity: CharacterSheetUser::class, mappedBy: 'charactersheet_id', orphanRemoval: true)]
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

    public function isSavStr(): ?bool
    {
        return $this->sav_str;
    }

    public function setSavStr(?bool $sav_str): static
    {
        $this->sav_str = $sav_str;

        return $this;
    }

    public function getSavStrMod(): ?int
    {
        return $this->sav_str_mod;
    }

    public function setSavStrMod(?int $sav_str_mod): static
    {
        $this->sav_str_mod = $sav_str_mod;

        return $this;
    }

    public function isSavDex(): ?bool
    {
        return $this->sav_dex;
    }

    public function setSavDex(?bool $sav_dex): static
    {
        $this->sav_dex = $sav_dex;

        return $this;
    }

    public function getSavDexMod(): ?int
    {
        return $this->sav_dex_mod;
    }

    public function setSavDexMod(?int $sav_dex_mod): static
    {
        $this->sav_dex_mod = $sav_dex_mod;

        return $this;
    }

    public function isSavInt(): ?bool
    {
        return $this->sav_int;
    }

    public function setSavInt(?bool $sav_int): static
    {
        $this->sav_int = $sav_int;

        return $this;
    }

    public function getSavIntMod(): ?int
    {
        return $this->sav_int_mod;
    }

    public function setSavIntMod(?int $sav_int_mod): static
    {
        $this->sav_int_mod = $sav_int_mod;

        return $this;
    }

    public function isSavWis(): ?bool
    {
        return $this->sav_wis;
    }

    public function setSavWis(?bool $sav_wis): static
    {
        $this->sav_wis = $sav_wis;

        return $this;
    }

    public function getSavWisMod(): ?int
    {
        return $this->sav_wis_mod;
    }

    public function setSavWisMod(?int $sav_wis_mod): static
    {
        $this->sav_wis_mod = $sav_wis_mod;

        return $this;
    }

    public function isSavCha(): ?bool
    {
        return $this->sav_cha;
    }

    public function setSavCha(?bool $sav_cha): static
    {
        $this->sav_cha = $sav_cha;

        return $this;
    }

    public function getSavChaMod(): ?int
    {
        return $this->sav_cha_mod;
    }

    public function setSavChaMod(?int $sav_cha_mod): static
    {
        $this->sav_cha_mod = $sav_cha_mod;

        return $this;
    }

    public function getAcrobatics(): ?string
    {
        return $this->acrobatics;
    }

    public function setAcrobatics(?string $acrobatics): static
    {
        $this->acrobatics = $acrobatics;

        return $this;
    }

    public function getAcrobaticsMod(): ?int
    {
        return $this->acrobatics_mod;
    }

    public function setAcrobaticsMod(?int $acrobatics_mod): static
    {
        $this->acrobatics_mod = $acrobatics_mod;

        return $this;
    }

    public function getAnimalHandling(): ?string
    {
        return $this->animal_handling;
    }

    public function setAnimalHandling(?string $animal_handling): static
    {
        $this->animal_handling = $animal_handling;

        return $this;
    }

    public function getAnimalHandlingMod(): ?int
    {
        return $this->animal_handling_mod;
    }

    public function setAnimalHandlingMod(?int $animal_handling_mod): static
    {
        $this->animal_handling_mod = $animal_handling_mod;

        return $this;
    }

    public function getArcana(): ?string
    {
        return $this->arcana;
    }

    public function setArcana(?string $arcana): static
    {
        $this->arcana = $arcana;

        return $this;
    }

    public function getArcanaMod(): ?int
    {
        return $this->arcana_mod;
    }

    public function setArcanaMod(?int $arcana_mod): static
    {
        $this->arcana_mod = $arcana_mod;

        return $this;
    }

    public function getAthletics(): ?string
    {
        return $this->athletics;
    }

    public function setAthletics(?string $athletics): static
    {
        $this->athletics = $athletics;

        return $this;
    }

    public function getAthleticsMod(): ?int
    {
        return $this->athletics_mod;
    }

    public function setAthleticsMod(?int $athletics_mod): static
    {
        $this->athletics_mod = $athletics_mod;

        return $this;
    }

    public function getDeception(): ?string
    {
        return $this->deception;
    }

    public function setDeception(?string $deception): static
    {
        $this->deception = $deception;

        return $this;
    }

    public function getDeceptionMod(): ?int
    {
        return $this->deception_mod;
    }

    public function setDeceptionMod(?int $deception_mod): static
    {
        $this->deception_mod = $deception_mod;

        return $this;
    }

    public function getHistory(): ?string
    {
        return $this->history;
    }

    public function setHistory(?string $history): static
    {
        $this->history = $history;

        return $this;
    }

    public function getHistoryMod(): ?int
    {
        return $this->history_mod;
    }

    public function setHistoryMod(?int $history_mod): static
    {
        $this->history_mod = $history_mod;

        return $this;
    }

    public function getInsight(): ?string
    {
        return $this->insight;
    }

    public function setInsight(?string $insight): static
    {
        $this->insight = $insight;

        return $this;
    }

    public function getInsightMod(): ?int
    {
        return $this->insight_mod;
    }

    public function setInsightMod(?int $insight_mod): static
    {
        $this->insight_mod = $insight_mod;

        return $this;
    }

    public function getIntimidation(): ?string
    {
        return $this->intimidation;
    }

    public function setIntimidation(?string $intimidation): static
    {
        $this->intimidation = $intimidation;

        return $this;
    }

    public function getIntimidationMod(): ?int
    {
        return $this->intimidation_mod;
    }

    public function setIntimidationMod(?int $intimidation_mod): static
    {
        $this->intimidation_mod = $intimidation_mod;

        return $this;
    }

    public function getInvestigation(): ?string
    {
        return $this->investigation;
    }

    public function setInvestigation(?string $investigation): static
    {
        $this->investigation = $investigation;

        return $this;
    }

    public function getInvestigationMod(): ?int
    {
        return $this->investigation_mod;
    }

    public function setInvestigationMod(?int $investigation_mod): static
    {
        $this->investigation_mod = $investigation_mod;

        return $this;
    }

    public function getMedicine(): ?string
    {
        return $this->medicine;
    }

    public function setMedicine(?string $medicine): static
    {
        $this->medicine = $medicine;

        return $this;
    }

    public function getMedicineMod(): ?int
    {
        return $this->medicine_mod;
    }

    public function setMedicineMod(?int $medicine_mod): static
    {
        $this->medicine_mod = $medicine_mod;

        return $this;
    }

    public function getNature(): ?string
    {
        return $this->nature;
    }

    public function setNature(?string $nature): static
    {
        $this->nature = $nature;

        return $this;
    }

    public function getNatureMod(): ?int
    {
        return $this->nature_mod;
    }

    public function setNatureMod(?int $nature_mod): static
    {
        $this->nature_mod = $nature_mod;

        return $this;
    }

    public function getPerception(): ?string
    {
        return $this->perception;
    }

    public function setPerception(?string $perception): static
    {
        $this->perception = $perception;

        return $this;
    }

    public function getPerceptionMod(): ?int
    {
        return $this->perception_mod;
    }

    public function setPerceptionMod(?int $perception_mod): static
    {
        $this->perception_mod = $perception_mod;

        return $this;
    }

    public function getPerformance(): ?string
    {
        return $this->performance;
    }

    public function setPerformance(?string $performance): static
    {
        $this->performance = $performance;

        return $this;
    }

    public function getPerformanceMod(): ?int
    {
        return $this->performance_mod;
    }

    public function setPerformanceMod(?int $performance_mod): static
    {
        $this->performance_mod = $performance_mod;

        return $this;
    }

    public function getPersuasion(): ?string
    {
        return $this->persuasion;
    }

    public function setPersuasion(?string $persuasion): static
    {
        $this->persuasion = $persuasion;

        return $this;
    }

    public function getPersuasionMod(): ?int
    {
        return $this->persuasion_mod;
    }

    public function setPersuasionMod(?int $persuasion_mod): static
    {
        $this->persuasion_mod = $persuasion_mod;

        return $this;
    }

    public function getReligion(): ?string
    {
        return $this->religion;
    }

    public function setReligion(?string $religion): static
    {
        $this->religion = $religion;

        return $this;
    }

    public function getReligionMod(): ?int
    {
        return $this->religion_mod;
    }

    public function setReligionMod(?int $religion_mod): static
    {
        $this->religion_mod = $religion_mod;

        return $this;
    }

    public function getSleightOfHand(): ?string
    {
        return $this->sleight_of_hand;
    }

    public function setSleightOfHand(?string $sleight_of_hand): static
    {
        $this->sleight_of_hand = $sleight_of_hand;

        return $this;
    }

    public function getSleightOfHandMod(): ?int
    {
        return $this->sleight_of_hand_mod;
    }

    public function setSleightOfHandMod(?int $sleight_of_hand_mod): static
    {
        $this->sleight_of_hand_mod = $sleight_of_hand_mod;

        return $this;
    }

    public function getStealth(): ?string
    {
        return $this->stealth;
    }

    public function setStealth(?string $stealth): static
    {
        $this->stealth = $stealth;

        return $this;
    }

    public function getStealthMod(): ?int
    {
        return $this->stealth_mod;
    }

    public function setStealthMod(?int $stealth_mod): static
    {
        $this->stealth_mod = $stealth_mod;

        return $this;
    }

    public function getSurvival(): ?string
    {
        return $this->survival;
    }

    public function setSurvival(?string $survival): static
    {
        $this->survival = $survival;

        return $this;
    }

    public function getSurvivalMod(): ?int
    {
        return $this->survival_mod;
    }

    public function setSurvivalMod(?int $survival_mod): static
    {
        $this->survival_mod = $survival_mod;

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

    public function getLevel(): ?array
    {
        return $this->level;
    }

    public function setLevel(?array $level): static
    {
        $this->level = $level;

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
