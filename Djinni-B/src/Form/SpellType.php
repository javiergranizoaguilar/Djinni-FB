<?php

namespace App\Form;

use App\Entity\CharacterSheet;
use App\Entity\Monster;
use App\Entity\Spell;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class SpellType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('name')
            ->add('level')
            ->add('school')
            ->add('description')
            ->add('is_prepared')
            ->add('has_limited_uses')
            ->add('max_charges')
            ->add('current_charges')
            ->add('casting_time')
            ->add('spell_range')
            ->add('components')
            ->add('duration')
            ->add('higer_level_description')
            ->add('recharge_type')
            ->add('character_id', EntityType::class, [
                'class' => CharacterSheet::class,
                'choice_label' => 'id',
                'multiple' => true,
            ])
            ->add('monster_spell', EntityType::class, [
                'class' => Monster::class,
                'choice_label' => 'id',
                'multiple' => true,
            ])
        ;
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Spell::class,
        ]);
    }
}
