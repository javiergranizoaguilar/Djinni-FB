<?php

namespace App\Entity;

use App\Repository\SceneRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
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

    #[ORM\ManyToOne(inversedBy: 'scenes')]
    private ?GameSesion $session_id = null;

    #[ORM\OneToMany(mappedBy: 'scene', targetEntity: SceneToken::class, orphanRemoval: true)]
    private Collection $sceneTokens;

    #[ORM\OneToMany(mappedBy: 'scene', targetEntity: SceneImage::class, cascade: ['remove'], orphanRemoval: true)]
    private Collection $sceneImages;

    public function __construct()
    {
        $this->sceneTokens  = new ArrayCollection();
        $this->sceneImages  = new ArrayCollection();
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

    public function getSessionId(): ?GameSesion
    {
        return $this->session_id;
    }

    public function setSessionId(?GameSesion $session_id): static
    {
        $this->session_id = $session_id;

        return $this;
    }

    /**
     * @return Collection<int, SceneToken>
     */
    public function getSceneTokens(): Collection
    {
        return $this->sceneTokens;
    }

    public function addSceneToken(SceneToken $sceneToken): static
    {
        if (!$this->sceneTokens->contains($sceneToken)) {
            $this->sceneTokens->add($sceneToken);
            $sceneToken->setScene($this);
        }

        return $this;
    }

    public function removeSceneToken(SceneToken $sceneToken): static
    {
        if ($this->sceneTokens->removeElement($sceneToken)) {
            // set the owning side to null (unless already changed)
            if ($sceneToken->getScene() === $this) {
                $sceneToken->setScene(null);
            }
        }

        return $this;
    }
}
