<?php

namespace App\Form;

use App\Entity\Ability;
use App\Entity\CharacterSheet;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class AbilityType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('name')
            ->add('description')
            ->add('source_tipe')
            ->add('is_active')
            ->add('has_limited_uses')
            ->add('max_uses')
            ->add('current_uses')
            ->add('recharge_type')
            ->add('character_id', EntityType::class, [
                'class' => CharacterSheet::class,
                'choice_label' => 'id',
            ])
        ;
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Ability::class,
        ]);
    }
}
