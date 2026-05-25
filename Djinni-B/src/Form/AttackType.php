<?php

namespace App\Form;

use App\Entity\Attack;
use App\Entity\CharacterSheet;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class AttackType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('name')
            ->add('damage_dice')
            ->add('damage_type')
            ->add('range_')
            ->add('is_saving_throw')
            ->add('description')
            ->add('attack_modifier')
            ->add('saving_throw_tipe')
            ->add('character_attack', EntityType::class, [
                'class' => CharacterSheet::class,
                'choice_label' => 'id',
            ])
        ;
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Attack::class,
        ]);
    }
}
