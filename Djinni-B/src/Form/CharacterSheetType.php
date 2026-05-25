<?php

namespace App\Form;

use App\Entity\CharacterSheet;
use App\Entity\GameSesion;
use App\Entity\Spell;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class CharacterSheetType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('name')
            ->add('spellcasting_abillity')
            ->add('token_image')
            ->add('portrait_image')
            ->add('caster_level')
            ->add('stats')
            ->add('bonuses')
            ->add('apareance')
            ->add('backstory')
            ->add('personality_traits')
            ->add('ideals')
            ->add('bonds')
            ->add('flaws')
            ->add('exaustion')
            ->add('currency')
            ->add('custom_counters')
            ->add('modifiers')
            ->add('spells', EntityType::class, [
                'class' => Spell::class,
                'choice_label' => 'id',
                'multiple' => true,
            ])
            ->add('gamesesion', EntityType::class, [
                'class' => GameSesion::class,
                'choice_label' => 'id',
            ])
        ;
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => CharacterSheet::class,
        ]);
    }
}
