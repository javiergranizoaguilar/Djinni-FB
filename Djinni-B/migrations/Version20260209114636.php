<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260209114636 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE game_sesion DROP FOREIGN KEY `FK_66704FD3BD7C6FBC`');
        $this->addSql('DROP INDEX IDX_66704FD3BD7C6FBC ON game_sesion');
        $this->addSql('ALTER TABLE game_sesion ADD is_gm TINYINT NOT NULL, DROP gm_id');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE game_sesion ADD gm_id INT NOT NULL, DROP is_gm');
        $this->addSql('ALTER TABLE game_sesion ADD CONSTRAINT `FK_66704FD3BD7C6FBC` FOREIGN KEY (gm_id) REFERENCES user (id)');
        $this->addSql('CREATE INDEX IDX_66704FD3BD7C6FBC ON game_sesion (gm_id)');
    }
}
