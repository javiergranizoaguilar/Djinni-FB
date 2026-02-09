<?php

namespace App\Form;

use App\Entity\CharacterSheet;
use App\Entity\Inventory;
use App\Entity\Item;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class InventoryType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('quantity')
            ->add('is_equipped')
            ->add('seet', EntityType::class, [
                'class' => CharacterSheet::class,
                'choice_label' => 'id',
            ])
            ->add('items', EntityType::class, [
                'class' => Item::class,
                'choice_label' => 'id',
            ])
        ;
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Inventory::class,
        ]);
    }
}
