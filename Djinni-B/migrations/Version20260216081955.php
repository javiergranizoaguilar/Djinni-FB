<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260216081955 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE character_sheet ADD sav_str TINYINT DEFAULT NULL, ADD sav_str_mod INT DEFAULT NULL, ADD sav_dex TINYINT DEFAULT NULL, ADD sav_dex_mod INT DEFAULT NULL, ADD sav_int TINYINT DEFAULT NULL, ADD sav_int_mod INT DEFAULT NULL, ADD sav_wis TINYINT DEFAULT NULL, ADD sav_wis_mod INT DEFAULT NULL, ADD sav_cha TINYINT DEFAULT NULL, ADD sav_cha_mod INT DEFAULT NULL, ADD acrobatics VARCHAR(255) DEFAULT NULL, ADD acrobatics_mod INT DEFAULT NULL, ADD animal_handling VARCHAR(255) DEFAULT NULL, ADD animal_handling_mod INT DEFAULT NULL, ADD arcana VARCHAR(255) DEFAULT NULL, ADD arcana_mod INT DEFAULT NULL, ADD athletics VARCHAR(255) DEFAULT NULL, ADD athletics_mod INT DEFAULT NULL, ADD deception VARCHAR(255) DEFAULT NULL, ADD deception_mod INT DEFAULT NULL, ADD history VARCHAR(255) DEFAULT NULL, ADD history_mod INT DEFAULT NULL, ADD insight VARCHAR(255) DEFAULT NULL, ADD insight_mod INT DEFAULT NULL, ADD intimidation VARCHAR(255) DEFAULT NULL, ADD intimidation_mod INT DEFAULT NULL, ADD investigation VARCHAR(255) DEFAULT NULL, ADD investigation_mod INT DEFAULT NULL, ADD medicine VARCHAR(255) DEFAULT NULL, ADD medicine_mod INT DEFAULT NULL, ADD nature VARCHAR(255) DEFAULT NULL, ADD nature_mod INT DEFAULT NULL, ADD perception VARCHAR(255) DEFAULT NULL, ADD perception_mod INT DEFAULT NULL, ADD performance VARCHAR(255) DEFAULT NULL, ADD performance_mod INT DEFAULT NULL, ADD persuasion VARCHAR(255) DEFAULT NULL, ADD persuasion_mod INT DEFAULT NULL, ADD religion VARCHAR(255) DEFAULT NULL, ADD religion_mod INT DEFAULT NULL, ADD sleight_of_hand VARCHAR(255) DEFAULT NULL, ADD sleight_of_hand_mod INT DEFAULT NULL, ADD stealth VARCHAR(255) DEFAULT NULL, ADD stealth_mod INT DEFAULT NULL, ADD survival VARCHAR(255) DEFAULT NULL, ADD survival_mod INT DEFAULT NULL, DROP bonuses');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE character_sheet ADD bonuses JSON DEFAULT NULL, DROP sav_str, DROP sav_str_mod, DROP sav_dex, DROP sav_dex_mod, DROP sav_int, DROP sav_int_mod, DROP sav_wis, DROP sav_wis_mod, DROP sav_cha, DROP sav_cha_mod, DROP acrobatics, DROP acrobatics_mod, DROP animal_handling, DROP animal_handling_mod, DROP arcana, DROP arcana_mod, DROP athletics, DROP athletics_mod, DROP deception, DROP deception_mod, DROP history, DROP history_mod, DROP insight, DROP insight_mod, DROP intimidation, DROP intimidation_mod, DROP investigation, DROP investigation_mod, DROP medicine, DROP medicine_mod, DROP nature, DROP nature_mod, DROP perception, DROP perception_mod, DROP performance, DROP performance_mod, DROP persuasion, DROP persuasion_mod, DROP religion, DROP religion_mod, DROP sleight_of_hand, DROP sleight_of_hand_mod, DROP stealth, DROP stealth_mod, DROP survival, DROP survival_mod');
    }
}
