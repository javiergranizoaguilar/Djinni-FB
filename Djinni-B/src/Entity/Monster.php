<?php

namespace App\Entity;

use App\Repository\MonsterRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: MonsterRepository::class)]
class Monster
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $source_book = null;

    #[ORM\Column(length: 255)]
    private ?string $size = null;

    #[ORM\Column(nullable: true)]
    private ?int $page_number = null;

    #[ORM\Column(length: 255)]
    private ?string $type = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $alignment = null;

    #[ORM\Column]
    private ?int $armor_class = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $ac_description = null;

    #[ORM\Column(nullable: true)]
    private ?int $hit_points_average = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $hp_formula = null;

    #[ORM\Column(nullable: true)]
    private ?array $speed = null;

    #[ORM\Column(nullable: true)]
    private ?int $str = null;

    #[ORM\Column(nullable: true)]
    private ?int $dex = null;

    #[ORM\Column(nullable: true)]
    private ?int $con = null;

    #[ORM\Column(nullable: true)]
    private ?int $int_stat = null;

    #[ORM\Column(nullable: true)]
    private ?int $wis = null;

    #[ORM\Column(nullable: true)]
    private ?int $cha = null;

    #[ORM\Column(nullable: true)]
    private ?array $saving_throws = null;

    #[ORM\Column(nullable: true)]
    private ?array $skills = null;

    #[ORM\Column(nullable: true)]
    private ?int $passive_perception = null;

    #[ORM\Column(nullable: true)]
    private ?int $challenge_rating = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $senses = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $languages = null;

    #[ORM\Column(nullable: true)]
    private ?array $traits = null;

    #[ORM\Column(nullable: true)]
    private ?array $spellcasting = null;

    #[ORM\Column(nullable: true)]
    private ?array $actions = null;

    #[ORM\Column(nullable: true)]
    private ?array $bonus_actions = null;

    #[ORM\Column(nullable: true)]
    private ?array $reactions = null;

    #[ORM\Column(nullable: true)]
    private ?int $legendary_resistances_count = null;

    #[ORM\Column(nullable: true)]
    private ?int $legendary_actions_count = null;

    #[ORM\Column(nullable: true)]
    private ?array $legendary_actions = null;

    #[ORM\Column(nullable: true)]
    private ?array $mythic_actions = null;

    #[ORM\Column(nullable: true)]
    private ?array $lair_actions = null;

    #[ORM\Column(nullable: true)]
    private ?array $regional_effects = null;

    #[ORM\Column(nullable: true)]
    private ?array $enviroment = null;

    #[ORM\Column(nullable: true)]
    private ?array $treasure = null;

    #[ORM\Column(nullable: true)]
    private ?array $tags = null;

    #[ORM\Column(nullable: true)]
    private ?array $vtt_metadata = null;

    #[ORM\ManyToOne(inversedBy: 'monsters')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $creador = null;

    /**
     * @var Collection<int, MonsterUser>
     */
    #[ORM\OneToMany(targetEntity: MonsterUser::class, mappedBy: 'monster')]
    private Collection $monsterUsers;

    #[ORM\ManyToOne(inversedBy: 'monsters')]
    private ?GameSesion $exist = null;

    /**
     * @var Collection<int, Spell>
     */
    #[ORM\ManyToMany(targetEntity: Spell::class, mappedBy: 'monster_spell')]
    private Collection $spells;

    public function __construct()
    {
        $this->monsterUsers = new ArrayCollection();
        $this->spells = new ArrayCollection();
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

    public function getSourceBook(): ?string
    {
        return $this->source_book;
    }

    public function setSourceBook(?string $source_book): static
    {
        $this->source_book = $source_book;

        return $this;
    }

    public function getSize(): ?string
    {
        return $this->size;
    }

    public function setSize(string $size): static
    {
        $this->size = $size;

        return $this;
    }

    public function getPageNumber(): ?int
    {
        return $this->page_number;
    }

    public function setPageNumber(?int $page_number): static
    {
        $this->page_number = $page_number;

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

    public function getAlignment(): ?string
    {
        return $this->alignment;
    }

    public function setAlignment(?string $alignment): static
    {
        $this->alignment = $alignment;

        return $this;
    }

    public function getArmorClass(): ?int
    {
        return $this->armor_class;
    }

    public function setArmorClass(int $armor_class): static
    {
        $this->armor_class = $armor_class;

        return $this;
    }

    public function getAcDescription(): ?string
    {
        return $this->ac_description;
    }

    public function setAcDescription(?string $ac_description): static
    {
        $this->ac_description = $ac_description;

        return $this;
    }

    public function getHitPointsAverage(): ?int
    {
        return $this->hit_points_average;
    }

    public function setHitPointsAverage(?int $hit_points_average): static
    {
        $this->hit_points_average = $hit_points_average;

        return $this;
    }

    public function getHpFormula(): ?string
    {
        return $this->hp_formula;
    }

    public function setHpFormula(?string $hp_formula): static
    {
        $this->hp_formula = $hp_formula;

        return $this;
    }

    public function getSpeed(): ?array
    {
        return $this->speed;
    }

    public function setSpeed(?array $speed): static
    {
        $this->speed = $speed;

        return $this;
    }

    public function getStr(): ?int
    {
        return $this->str;
    }

    public function setStr(?int $str): static
    {
        $this->str = $str;

        return $this;
    }

    public function getDex(): ?int
    {
        return $this->dex;
    }

    public function setDex(?int $dex): static
    {
        $this->dex = $dex;

        return $this;
    }

    public function getCon(): ?int
    {
        return $this->con;
    }

    public function setCon(?int $con): static
    {
        $this->con = $con;

        return $this;
    }

    public function getIntStat(): ?int
    {
        return $this->int_stat;
    }

    public function setIntStat(?int $int_stat): static
    {
        $this->int_stat = $int_stat;

        return $this;
    }

    public function getWis(): ?int
    {
        return $this->wis;
    }

    public function setWis(?int $wis): static
    {
        $this->wis = $wis;

        return $this;
    }

    public function getCha(): ?int
    {
        return $this->cha;
    }

    public function setCha(?int $cha): static
    {
        $this->cha = $cha;

        return $this;
    }

    public function getSavingThrows(): ?array
    {
        return $this->saving_throws;
    }

    public function setSavingThrows(?array $saving_throws): static
    {
        $this->saving_throws = $saving_throws;

        return $this;
    }

    public function getSkills(): ?array
    {
        return $this->skills;
    }

    public function setSkills(?array $skills): static
    {
        $this->skills = $skills;

        return $this;
    }

    public function getPassivePerception(): ?int
    {
        return $this->passive_perception;
    }

    public function setPassivePerception(?int $passive_perception): static
    {
        $this->passive_perception = $passive_perception;

        return $this;
    }

    public function getChallengeRating(): ?int
    {
        return $this->challenge_rating;
    }

    public function setChallengeRating(?int $challenge_rating): static
    {
        $this->challenge_rating = $challenge_rating;

        return $this;
    }

    public function getSenses(): ?string
    {
        return $this->senses;
    }

    public function setSenses(?string $senses): static
    {
        $this->senses = $senses;

        return $this;
    }

    public function getLanguages(): ?string
    {
        return $this->languages;
    }

    public function setLanguages(?string $languages): static
    {
        $this->languages = $languages;

        return $this;
    }

    public function getTraits(): ?array
    {
        return $this->traits;
    }

    public function setTraits(?array $traits): static
    {
        $this->traits = $traits;

        return $this;
    }

    public function getSpellcasting(): ?array
    {
        return $this->spellcasting;
    }

    public function setSpellcasting(?array $spellcasting): static
    {
        $this->spellcasting = $spellcasting;

        return $this;
    }

    public function getActions(): ?array
    {
        return $this->actions;
    }

    public function setActions(?array $actions): static
    {
        $this->actions = $actions;

        return $this;
    }

    public function getBonusActions(): ?array
    {
        return $this->bonus_actions;
    }

    public function setBonusActions(?array $bonus_actions): static
    {
        $this->bonus_actions = $bonus_actions;

        return $this;
    }

    public function getReactions(): ?array
    {
        return $this->reactions;
    }

    public function setReactions(?array $reactions): static
    {
        $this->reactions = $reactions;

        return $this;
    }

    public function getLegendaryResistancesCount(): ?int
    {
        return $this->legendary_resistances_count;
    }

    public function setLegendaryResistancesCount(?int $legendary_resistances_count): static
    {
        $this->legendary_resistances_count = $legendary_resistances_count;

        return $this;
    }

    public function getLegendaryActionsCount(): ?int
    {
        return $this->legendary_actions_count;
    }

    public function setLegendaryActionsCount(?int $legendary_actions_count): static
    {
        $this->legendary_actions_count = $legendary_actions_count;

        return $this;
    }

    public function getLegendaryActions(): ?array
    {
        return $this->legendary_actions;
    }

    public function setLegendaryActions(?array $legendary_actions): static
    {
        $this->legendary_actions = $legendary_actions;

        return $this;
    }

    public function getMythicActions(): ?array
    {
        return $this->mythic_actions;
    }

    public function setMythicActions(?array $mythic_actions): static
    {
        $this->mythic_actions = $mythic_actions;

        return $this;
    }

    public function getLairActions(): ?array
    {
        return $this->lair_actions;
    }

    public function setLairActions(?array $lair_actions): static
    {
        $this->lair_actions = $lair_actions;

        return $this;
    }

    public function getRegionalEffects(): ?array
    {
        return $this->regional_effects;
    }

    public function setRegionalEffects(?array $regional_effects): static
    {
        $this->regional_effects = $regional_effects;

        return $this;
    }

    public function getEnviroment(): ?array
    {
        return $this->enviroment;
    }

    public function setEnviroment(?array $enviroment): static
    {
        $this->enviroment = $enviroment;

        return $this;
    }

    public function getTreasure(): ?array
    {
        return $this->treasure;
    }

    public function setTreasure(?array $treasure): static
    {
        $this->treasure = $treasure;

        return $this;
    }

    public function getTags(): ?array
    {
        return $this->tags;
    }

    public function setTags(?array $tags): static
    {
        $this->tags = $tags;

        return $this;
    }

    public function getVttMetadata(): ?array
    {
        return $this->vtt_metadata;
    }

    public function setVttMetadata(?array $vtt_metadata): static
    {
        $this->vtt_metadata = $vtt_metadata;

        return $this;
    }

    public function getCreador(): ?User
    {
        return $this->creador;
    }

    public function setCreador(?User $creador): static
    {
        $this->creador = $creador;

        return $this;
    }

    /**
     * @return Collection<int, MonsterUser>
     */
    public function getMonsterUsers(): Collection
    {
        return $this->monsterUsers;
    }

    public function addMonsterUser(MonsterUser $monsterUser): static
    {
        if (!$this->monsterUsers->contains($monsterUser)) {
            $this->monsterUsers->add($monsterUser);
            $monsterUser->setMonster($this);
        }

        return $this;
    }

    public function removeMonsterUser(MonsterUser $monsterUser): static
    {
        if ($this->monsterUsers->removeElement($monsterUser)) {
            // set the owning side to null (unless already changed)
            if ($monsterUser->getMonster() === $this) {
                $monsterUser->setMonster(null);
            }
        }

        return $this;
    }

    public function getExist(): ?GameSesion
    {
        return $this->exist;
    }

    public function setExist(?GameSesion $exist): static
    {
        $this->exist = $exist;

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
            $spell->addMonsterSpell($this);
        }

        return $this;
    }

    public function removeSpell(Spell $spell): static
    {
        if ($this->spells->removeElement($spell)) {
            $spell->removeMonsterSpell($this);
        }

        return $this;
    }
}
