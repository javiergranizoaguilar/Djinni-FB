<?php

namespace App\Entity;

use App\Repository\InventoryRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: InventoryRepository::class)]
class Inventory
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'inventories')]
    private ?CharacterSheet $seet = null;

    #[ORM\ManyToOne(inversedBy: 'inventories')]
    private ?Item $items = null;

    #[ORM\Column]
    private ?float $quantity = null;

    #[ORM\Column]
    private ?bool $is_equipped = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSeet(): ?CharacterSheet
    {
        return $this->seet;
    }

    public function setSeet(?CharacterSheet $seet): static
    {
        $this->seet = $seet;

        return $this;
    }

    public function getItems(): ?Item
    {
        return $this->items;
    }

    public function setItems(?Item $items): static
    {
        $this->items = $items;

        return $this;
    }

    public function getQuantity(): ?float
    {
        return $this->quantity;
    }

    public function setQuantity(float $quantity): static
    {
        $this->quantity = $quantity;

        return $this;
    }

    public function isEquipped(): ?bool
    {
        return $this->is_equipped;
    }

    public function setIsEquipped(bool $is_equipped): static
    {
        $this->is_equipped = $is_equipped;

        return $this;
    }
}
