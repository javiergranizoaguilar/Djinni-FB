<?php

namespace App\Form;

use App\Entity\GameSesion;
use App\Entity\Monster;
use App\Entity\Spell;
use App\Entity\User;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class MonsterType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('name')
            ->add('source_book')
            ->add('size')
            ->add('page_number')
            ->add('type')
            ->add('alignment')
            ->add('armor_class')
            ->add('ac_description')
            ->add('hit_points_average')
            ->add('hp_formula')
            ->add('speed')
            ->add('str')
            ->add('dex')
            ->add('con')
            ->add('int_stat')
            ->add('wis')
            ->add('cha')
            ->add('saving_throws')
            ->add('skills')
            ->add('passive_perception')
            ->add('challenge_rating')
            ->add('senses')
            ->add('languages')
            ->add('traits')
            ->add('spellcasting')
            ->add('actions')
            ->add('bonus_actions')
            ->add('reactions')
            ->add('legendary_resistances_count')
            ->add('legendary_actions_count')
            ->add('legendary_actions')
            ->add('mythic_actions')
            ->add('lair_actions')
            ->add('regional_effects')
            ->add('enviroment')
            ->add('treasure')
            ->add('tags')
            ->add('vtt_metadata')
            ->add('creador', EntityType::class, [
                'class' => User::class,
                'choice_label' => 'id',
            ])
            ->add('exist', EntityType::class, [
                'class' => GameSesion::class,
                'choice_label' => 'id',
            ])
            ->add('spells', EntityType::class, [
                'class' => Spell::class,
                'choice_label' => 'id',
                'multiple' => true,
            ])
        ;
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Monster::class,
        ]);
    }
}
