<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260409105124 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE scene_token (id INT AUTO_INCREMENT NOT NULL, col INT NOT NULL, row INT NOT NULL, layer VARCHAR(50) NOT NULL, color VARCHAR(50) DEFAULT NULL, scene_id INT NOT NULL, token_id INT DEFAULT NULL, INDEX IDX_5841C349166053B4 (scene_id), INDEX IDX_5841C34941DEE7B9 (token_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE token (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, image_url VARCHAR(255) DEFAULT NULL, character_sheet_id INT DEFAULT NULL, INDEX IDX_5F37A13BD313EF34 (character_sheet_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE scene_token ADD CONSTRAINT FK_5841C349166053B4 FOREIGN KEY (scene_id) REFERENCES scene (id)');
        $this->addSql('ALTER TABLE scene_token ADD CONSTRAINT FK_5841C34941DEE7B9 FOREIGN KEY (token_id) REFERENCES token (id)');
        $this->addSql('ALTER TABLE token ADD CONSTRAINT FK_5F37A13BD313EF34 FOREIGN KEY (character_sheet_id) REFERENCES character_sheet (id)');
        $this->addSql('ALTER TABLE scene DROP data_json');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE scene_token DROP FOREIGN KEY FK_5841C349166053B4');
        $this->addSql('ALTER TABLE scene_token DROP FOREIGN KEY FK_5841C34941DEE7B9');
        $this->addSql('ALTER TABLE token DROP FOREIGN KEY FK_5F37A13BD313EF34');
        $this->addSql('DROP TABLE scene_token');
        $this->addSql('DROP TABLE token');
        $this->addSql('ALTER TABLE scene ADD data_json JSON DEFAULT NULL');
    }
}
