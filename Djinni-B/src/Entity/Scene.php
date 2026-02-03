<?php

namespace App\Entity;

use App\Repository\SceneRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SceneRepository::class)]
class Scene
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column]
    private ?int $grid_width = null;

    #[ORM\Column]
    private ?int $grid_height = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $background = null;

    #[ORM\Column(nullable: true)]
    private ?array $data_json = null;

    #[ORM\ManyToOne(inversedBy: 'scenes')]
    private ?GameSesion $session_id = null;

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

    public function getGridWidth(): ?int
    {
        return $this->grid_width;
    }

    public function setGridWidth(int $grid_width): static
    {
        $this->grid_width = $grid_width;

        return $this;
    }

    public function getGridHeight(): ?int
    {
        return $this->grid_height;
    }

    public function setGridHeight(int $grid_height): static
    {
        $this->grid_height = $grid_height;

        return $this;
    }

    public function getBackground(): ?string
    {
        return $this->background;
    }

    public function setBackground(?string $background): static
    {
        $this->background = $background;

        return $this;
    }

    public function getDataJson(): ?array
    {
        return $this->data_json;
    }

    public function setDataJson(?array $data_json): static
    {
        $this->data_json = $data_json;

        return $this;
    }

    public function getSessionId(): ?GameSesion
    {
        return $this->session_id;
    }

    public function setSessionId(?GameSesion $session_id): static
    {
        $this->session_id = $session_id;

        return $this;
    }
}
