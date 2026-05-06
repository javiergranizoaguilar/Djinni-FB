<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260505062902 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE game_message (id INT AUTO_INCREMENT NOT NULL, content LONGTEXT NOT NULL, created_at DATETIME NOT NULL, game_sesion_id INT NOT NULL, sender_id INT NOT NULL, INDEX IDX_237F4F50CE6A6CC9 (game_sesion_id), INDEX IDX_237F4F50F624B39D (sender_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE game_message ADD CONSTRAINT FK_237F4F50CE6A6CC9 FOREIGN KEY (game_sesion_id) REFERENCES game_sesion (id)');
        $this->addSql('ALTER TABLE game_message ADD CONSTRAINT FK_237F4F50F624B39D FOREIGN KEY (sender_id) REFERENCES user (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE game_message DROP FOREIGN KEY FK_237F4F50CE6A6CC9');
        $this->addSql('ALTER TABLE game_message DROP FOREIGN KEY FK_237F4F50F624B39D');
        $this->addSql('DROP TABLE game_message');
    }
}
