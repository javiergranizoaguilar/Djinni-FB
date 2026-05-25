<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260429085602 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE scene_token ADD controlled_by_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE scene_token ADD CONSTRAINT FK_5841C349DBB1782C FOREIGN KEY (controlled_by_id) REFERENCES user (id)');
        $this->addSql('CREATE INDEX IDX_5841C349DBB1782C ON scene_token (controlled_by_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE scene_token DROP FOREIGN KEY FK_5841C349DBB1782C');
        $this->addSql('DROP INDEX IDX_5841C349DBB1782C ON scene_token');
        $this->addSql('ALTER TABLE scene_token DROP controlled_by_id');
    }
}
