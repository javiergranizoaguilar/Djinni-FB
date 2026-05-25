<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260519163636 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE attack ADD attack_bonus INT DEFAULT NULL, ADD saving_throw_type_dc VARCHAR(255) DEFAULT NULL, ADD is_proficient TINYINT DEFAULT 0 NOT NULL, ADD damage_dice_2 VARCHAR(255) DEFAULT NULL, ADD damage_type_2 VARCHAR(255) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE attack DROP attack_bonus, DROP saving_throw_type_dc, DROP is_proficient, DROP damage_dice_2, DROP damage_type_2');
    }
}
