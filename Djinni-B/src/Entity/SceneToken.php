<?php

namespace App\Entity;

use App\Repository\SceneTokenRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SceneTokenRepository::class)]
class SceneToken
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'sceneTokens')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Scene $scene = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true)]
    private ?Token $token = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true)]
    private ?User $owner = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true)]
    private ?User $controlledBy = null;

    #[ORM\Column]
    private ?int $col = null;

    #[ORM\Column]
    private ?int $row = null;

    #[ORM\Column(length: 50)]
    private ?string $layer = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $color = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $name = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $image_url = null;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $width = null;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $height = null;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $x = null;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $y = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getScene(): ?Scene
    {
        return $this->scene;
    }

    public function setScene(?Scene $scene): static
    {
        $this->scene = $scene;

        return $this;
    }

    public function getToken(): ?Token
    {
        return $this->token;
    }

    public function setToken(?Token $token): static
    {
        $this->token = $token;

        return $this;
    }

    public function getCol(): ?int
    {
        return $this->col;
    }

    public function setCol(int $col): static
    {
        $this->col = $col;

        return $this;
    }

    public function getRow(): ?int
    {
        return $this->row;
    }

    public function setRow(int $row): static
    {
        $this->row = $row;

        return $this;
    }

    public function getLayer(): ?string
    {
        return $this->layer;
    }

    public function setLayer(string $layer): static
    {
        $this->layer = $layer;

        return $this;
    }

    public function getColor(): ?string
    {
        return $this->color;
    }

    public function setColor(?string $color): static
    {
        $this->color = $color;

        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): static
    {
        $this->name = $name;

        return $this;
    }

    #[ORM\Column(nullable: true)]
    private ?array $counters = null;

    #[ORM\Column(nullable: true)]
    private ?array $auras = null;

    #[ORM\Column(length: 20, nullable: true)]
    private ?string $kind = null;

    #[ORM\Column(nullable: true)]
    private ?int $entity_id = null;

    #[ORM\Column(nullable: true)]
    private ?int $visionRadius = null;

    public function getCounters(): ?array { return $this->counters; }
    public function setCounters(?array $counters): static { $this->counters = $counters; return $this; }

    public function getAuras(): ?array { return $this->auras; }
    public function setAuras(?array $auras): static { $this->auras = $auras; return $this; }

    public function getKind(): ?string { return $this->kind; }
    public function setKind(?string $kind): static { $this->kind = $kind; return $this; }

    public function getEntityId(): ?int { return $this->entity_id; }
    public function setEntityId(?int $entity_id): static { $this->entity_id = $entity_id; return $this; }

    public function getImageUrl(): ?string { return $this->image_url; }
    public function setImageUrl(?string $image_url): static { $this->image_url = $image_url; return $this; }

    public function getWidth(): ?float { return $this->width; }
    public function setWidth(?float $width): static { $this->width = $width; return $this; }

    public function getHeight(): ?float { return $this->height; }
    public function setHeight(?float $height): static { $this->height = $height; return $this; }

    public function getX(): ?float { return $this->x; }
    public function setX(?float $x): static { $this->x = $x; return $this; }

    public function getY(): ?float { return $this->y; }
    public function setY(?float $y): static { $this->y = $y; return $this; }

    public function getOwner(): ?User { return $this->owner; }
    public function setOwner(?User $owner): static { $this->owner = $owner; return $this; }

    public function getControlledBy(): ?User { return $this->controlledBy; }
    public function setControlledBy(?User $controlledBy): static { $this->controlledBy = $controlledBy; return $this; }

    public function getVisionRadius(): ?int { return $this->visionRadius; }
    public function setVisionRadius(?int $visionRadius): static { $this->visionRadius = $visionRadius; return $this; }
}
