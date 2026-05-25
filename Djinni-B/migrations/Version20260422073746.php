<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260422073746 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE roster_visibility (id INT AUTO_INCREMENT NOT NULL, roster_item_id INT NOT NULL, user_id INT NOT NULL, INDEX IDX_A8C1BD8D4883B1C (roster_item_id), INDEX IDX_A8C1BD8DA76ED395 (user_id), UNIQUE INDEX UNIQ_A8C1BD8D4883B1CA76ED395 (roster_item_id, user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE roster_visibility ADD CONSTRAINT FK_A8C1BD8D4883B1C FOREIGN KEY (roster_item_id) REFERENCES roster_item (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE roster_visibility ADD CONSTRAINT FK_A8C1BD8DA76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE roster_visibility DROP FOREIGN KEY FK_A8C1BD8D4883B1C');
        $this->addSql('ALTER TABLE roster_visibility DROP FOREIGN KEY FK_A8C1BD8DA76ED395');
        $this->addSql('DROP TABLE roster_visibility');
    }
}
