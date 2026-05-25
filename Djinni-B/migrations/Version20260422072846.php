<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260422072846 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE roster_item ADD is_public TINYINT NOT NULL, ADD created_by_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE roster_item ADD CONSTRAINT FK_176908C9B03A8386 FOREIGN KEY (created_by_id) REFERENCES user (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_176908C9B03A8386 ON roster_item (created_by_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE roster_item DROP FOREIGN KEY FK_176908C9B03A8386');
        $this->addSql('DROP INDEX IDX_176908C9B03A8386 ON roster_item');
        $this->addSql('ALTER TABLE roster_item DROP is_public, DROP created_by_id');
    }
}
