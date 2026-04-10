<?php

namespace App\Entity;

use App\Repository\SceneImageRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SceneImageRepository::class)]
class SceneImage
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'sceneImages')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Scene $scene = null;

    #[ORM\Column(length: 500)]
    private ?string $image_url = null;

    #[ORM\Column(type: 'float')]
    private float $x = 0;

    #[ORM\Column(type: 'float')]
    private float $y = 0;

    #[ORM\Column(type: 'float')]
    private float $width = 200;

    #[ORM\Column(type: 'float')]
    private float $height = 200;

    #[ORM\Column(length: 50)]
    private string $layer = 'background';

    public function getId(): ?int { return $this->id; }

    public function getScene(): ?Scene { return $this->scene; }
    public function setScene(?Scene $scene): static { $this->scene = $scene; return $this; }

    public function getImageUrl(): ?string { return $this->image_url; }
    public function setImageUrl(string $image_url): static { $this->image_url = $image_url; return $this; }

    public function getX(): float { return $this->x; }
    public function setX(float $x): static { $this->x = $x; return $this; }

    public function getY(): float { return $this->y; }
    public function setY(float $y): static { $this->y = $y; return $this; }

    public function getWidth(): float { return $this->width; }
    public function setWidth(float $width): static { $this->width = $width; return $this; }

    public function getHeight(): float { return $this->height; }
    public function setHeight(float $height): static { $this->height = $height; return $this; }

    public function getLayer(): string { return $this->layer; }
    public function setLayer(string $layer): static { $this->layer = $layer; return $this; }
}
