<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UserRepository::class)]
class User
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $username = null;

    #[ORM\Column(length: 255)]
    private ?string $email = null;

    #[ORM\Column(length: 255)]
    private ?string $password = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $avatar_url = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $datetime = null;

    #[ORM\Column]
    private array $roles = [];

    /**
     * @var Collection<int, GameSesion>
     */
    #[ORM\OneToMany(targetEntity: GameSesion::class, mappedBy: 'gm')]
    private Collection $gm;

    /**
     * @var Collection<int, GameSesion>
     */
    #[ORM\ManyToMany(targetEntity: GameSesion::class, mappedBy: 'player')]
    private Collection $player;

    /**
     * @var Collection<int, Monster>
     */
    #[ORM\OneToMany(targetEntity: Monster::class, mappedBy: 'creador', orphanRemoval: true)]
    private Collection $monsters;

    /**
     * @var Collection<int, MonsterUser>
     */
    #[ORM\OneToMany(targetEntity: MonsterUser::class, mappedBy: 'user')]
    private Collection $monsterUsers;

    /**
     * @var Collection<int, CharacterSheetUser>
     */
    #[ORM\OneToMany(targetEntity: CharacterSheetUser::class, mappedBy: 'user_id')]
    private Collection $characterSheetUsers;

    public function __construct()
    {
        $this->gm = new ArrayCollection();
        $this->player = new ArrayCollection();
        $this->monsters = new ArrayCollection();
        $this->monsterUsers = new ArrayCollection();
        $this->characterSheetUsers = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUsername(): ?string
    {
        return $this->username;
    }

    public function setUsername(string $username): static
    {
        $this->username = $username;

        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    public function getAvatarUrl(): ?string
    {
        return $this->avatar_url;
    }

    public function setAvatarUrl(?string $avatar_url): static
    {
        $this->avatar_url = $avatar_url;

        return $this;
    }

    public function getDatetime(): ?\DateTimeImmutable
    {
        return $this->datetime;
    }

    public function setDatetime(\DateTimeImmutable $datetime): static
    {
        $this->datetime = $datetime;

        return $this;
    }

    public function getRoles(): array
    {
        return $this->roles;
    }

    public function setRoles(array $roles): static
    {
        $this->roles = $roles;

        return $this;
    }

    /**
     * @return Collection<int, GameSesion>
     */
    public function getGm(): Collection
    {
        return $this->gm;
    }

    public function addGm(GameSesion $gmId): static
    {
        if (!$this->gm->contains($gmId)) {
            $this->gm->add($gmId);
            $gmId->setGm($this);
        }

        return $this;
    }

    public function removeGm(GameSesion $gmId): static
    {
        if ($this->gm->removeElement($gmId)) {
            // set the owning side to null (unless already changed)
            if ($gmId->getGm() === $this) {
                $gmId->setGm(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, GameSesion>
     */
    public function getPlayer(): Collection
    {
        return $this->player;
    }

    public function addPlayer(GameSesion $userId): static
    {
        if (!$this->player->contains($userId)) {
            $this->player->add($userId);
            $userId->addPlayer($this);
        }

        return $this;
    }

    public function removePlayer(GameSesion $userId): static
    {
        if ($this->player->removeElement($userId)) {
            $userId->removePlayer($this);
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
            $monster->setCreador($this);
        }

        return $this;
    }

    public function removeMonster(Monster $monster): static
    {
        if ($this->monsters->removeElement($monster)) {
            // set the owning side to null (unless already changed)
            if ($monster->getCreador() === $this) {
                $monster->setCreador(null);
            }
        }

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
            $monsterUser->setUser($this);
        }

        return $this;
    }

    public function removeMonsterUser(MonsterUser $monsterUser): static
    {
        if ($this->monsterUsers->removeElement($monsterUser)) {
            // set the owning side to null (unless already changed)
            if ($monsterUser->getUser() === $this) {
                $monsterUser->setUser(null);
            }
        }

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
            $characterSheetUser->setUserId($this);
        }

        return $this;
    }

    public function removeCharacterSheetUser(CharacterSheetUser $characterSheetUser): static
    {
        if ($this->characterSheetUsers->removeElement($characterSheetUser)) {
            // set the owning side to null (unless already changed)
            if ($characterSheetUser->getUserId() === $this) {
                $characterSheetUser->setUserId(null);
            }
        }

        return $this;
    }
}
