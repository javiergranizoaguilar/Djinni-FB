<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260429090224 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE roster_item ADD controlled_by_user_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE roster_item ADD CONSTRAINT FK_176908C97D817D09 FOREIGN KEY (controlled_by_user_id) REFERENCES user (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_176908C97D817D09 ON roster_item (controlled_by_user_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE roster_item DROP FOREIGN KEY FK_176908C97D817D09');
        $this->addSql('DROP INDEX IDX_176908C97D817D09 ON roster_item');
        $this->addSql('ALTER TABLE roster_item DROP controlled_by_user_id');
    }
}
