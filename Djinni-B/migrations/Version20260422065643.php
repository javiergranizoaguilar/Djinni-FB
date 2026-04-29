<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260422065643 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE roster_folder (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(100) NOT NULL, position INT NOT NULL, game_session_id INT NOT NULL, parent_id INT DEFAULT NULL, INDEX IDX_67040E128FE32B32 (game_session_id), INDEX IDX_67040E12727ACA70 (parent_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE roster_item (id INT AUTO_INCREMENT NOT NULL, kind VARCHAR(20) NOT NULL, entity_id INT DEFAULT NULL, name VARCHAR(255) NOT NULL, color VARCHAR(50) DEFAULT NULL, image_url VARCHAR(500) DEFAULT NULL, position INT NOT NULL, game_session_id INT NOT NULL, folder_id INT DEFAULT NULL, INDEX IDX_176908C98FE32B32 (game_session_id), INDEX IDX_176908C9162CB942 (folder_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE roster_folder ADD CONSTRAINT FK_67040E128FE32B32 FOREIGN KEY (game_session_id) REFERENCES game_sesion (id)');
        $this->addSql('ALTER TABLE roster_folder ADD CONSTRAINT FK_67040E12727ACA70 FOREIGN KEY (parent_id) REFERENCES roster_folder (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE roster_item ADD CONSTRAINT FK_176908C98FE32B32 FOREIGN KEY (game_session_id) REFERENCES game_sesion (id)');
        $this->addSql('ALTER TABLE roster_item ADD CONSTRAINT FK_176908C9162CB942 FOREIGN KEY (folder_id) REFERENCES roster_folder (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE roster_folder DROP FOREIGN KEY FK_67040E128FE32B32');
        $this->addSql('ALTER TABLE roster_folder DROP FOREIGN KEY FK_67040E12727ACA70');
        $this->addSql('ALTER TABLE roster_item DROP FOREIGN KEY FK_176908C98FE32B32');
        $this->addSql('ALTER TABLE roster_item DROP FOREIGN KEY FK_176908C9162CB942');
        $this->addSql('DROP TABLE roster_folder');
        $this->addSql('DROP TABLE roster_item');
    }
}
