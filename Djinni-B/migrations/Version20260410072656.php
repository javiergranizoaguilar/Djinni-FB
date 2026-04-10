<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260410072656 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE scene_image (id INT AUTO_INCREMENT NOT NULL, image_url VARCHAR(500) NOT NULL, x DOUBLE PRECISION NOT NULL, y DOUBLE PRECISION NOT NULL, width DOUBLE PRECISION NOT NULL, height DOUBLE PRECISION NOT NULL, layer VARCHAR(50) NOT NULL, scene_id INT NOT NULL, INDEX IDX_C24B662D166053B4 (scene_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE scene_image ADD CONSTRAINT FK_C24B662D166053B4 FOREIGN KEY (scene_id) REFERENCES scene (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE scene_image DROP FOREIGN KEY FK_C24B662D166053B4');
        $this->addSql('DROP TABLE scene_image');
    }
}
