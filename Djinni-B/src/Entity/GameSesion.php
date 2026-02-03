<?php

namespace App\Entity;

use App\Repository\GameSesionRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: GameSesionRepository::class)]
class GameSesion
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $title = null;

    #[ORM\Column]
    private ?bool $is_active = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\ManyToOne(inversedBy: 'gm')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $gm = null;

    /**
     * @var Collection<int, User>
     */
    #[ORM\ManyToMany(targetEntity: User::class, inversedBy: 'player')]
    private Collection $player;

    /**
     * @var Collection<int, Scene>
     */
    #[ORM\OneToMany(targetEntity: Scene::class, mappedBy: 'session_id')]
    private Collection $scenes;

    /**
     * @var Collection<int, Monster>
     */
    #[ORM\OneToMany(targetEntity: Monster::class, mappedBy: 'exist')]
    private Collection $monsters;

    /**
     * @var Collection<int, CharacterSheet>
     */
    #[ORM\OneToMany(targetEntity: CharacterSheet::class, mappedBy: 'gamesesion')]
    private Collection $characterSheets;

    public function __construct()
    {
        $this->player = new ArrayCollection();
        $this->scenes = new ArrayCollection();
        $this->monsters = new ArrayCollection();
        $this->characterSheets = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;

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

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->created_at;
    }

    public function setCreatedAt(\DateTimeImmutable $created_at): static
    {
        $this->created_at = $created_at;

        return $this;
    }

    public function getGm(): ?User
    {
        return $this->gm;
    }

    public function setGm(?User $gm_id): static
    {
        $this->gm = $gm_id;

        return $this;
    }

    /**
     * @return Collection<int, User>
     */
    public function getPlayer(): Collection
    {
        return $this->player;
    }

    public function addPlayer(User $userId): static
    {
        if (!$this->player->contains($userId)) {
            $this->player->add($userId);
        }

        return $this;
    }

    public function removePlayer(User $userId): static
    {
        $this->player->removeElement($userId);

        return $this;
    }

    /**
     * @return Collection<int, Scene>
     */
    public function getScenes(): Collection
    {
        return $this->scenes;
    }

    public function addScene(Scene $scene): static
    {
        if (!$this->scenes->contains($scene)) {
            $this->scenes->add($scene);
            $scene->setSessionId($this);
        }

        return $this;
    }

    public function removeScene(Scene $scene): static
    {
        if ($this->scenes->removeElement($scene)) {
            // set the owning side to null (unless already changed)
            if ($scene->getSessionId() === $this) {
                $scene->setSessionId(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Monster>
     */
    public function getMonsters(): Collection
    {
        return $this->monsters;
    }

    public function addMonster(Monster $monster): static
    {
        if (!$this->monsters->contains($monster)) {
            $this->monsters->add($monster);
            $monster->setExist($this);
        }

        return $this;
    }

    public function removeMonster(Monster $monster): static
    {
        if ($this->monsters->removeElement($monster)) {
            // set the owning side to null (unless already changed)
            if ($monster->getExist() === $this) {
                $monster->setExist(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, CharacterSheet>
     */
    public function getCharacterSheets(): Collection
    {
        return $this->characterSheets;
    }

    public function addCharacterSheet(CharacterSheet $characterSheet): static
    {
        if (!$this->characterSheets->contains($characterSheet)) {
            $this->characterSheets->add($characterSheet);
            $characterSheet->setGamesesion($this);
        }

        return $this;
    }

    public function removeCharacterSheet(CharacterSheet $characterSheet): static
    {
        if ($this->characterSheets->removeElement($characterSheet)) {
            // set the owning side to null (unless already changed)
            if ($characterSheet->getGamesesion() === $this) {
                $characterSheet->setGamesesion(null);
            }
        }

        return $this;
    }
}
