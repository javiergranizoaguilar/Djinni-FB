<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260520122209 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE character_sheet ADD sav_con TINYINT DEFAULT NULL, ADD sav_con_mod INT DEFAULT NULL, ADD armor_class INT DEFAULT NULL, ADD ac_mode VARCHAR(10) DEFAULT NULL, ADD ac_config JSON DEFAULT NULL, ADD hit_dice JSON DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE character_sheet DROP sav_con, DROP sav_con_mod, DROP armor_class, DROP ac_mode, DROP ac_config, DROP hit_dice');
    }
}
