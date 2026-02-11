<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260211121446 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE user_game_session (id INT AUTO_INCREMENT NOT NULL, is_dm TINYINT NOT NULL, user_id INT NOT NULL, game_session_id INT NOT NULL, INDEX IDX_C54AD6F9A76ED395 (user_id), INDEX IDX_C54AD6F98FE32B32 (game_session_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE user_game_session ADD CONSTRAINT FK_C54AD6F9A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE user_game_session ADD CONSTRAINT FK_C54AD6F98FE32B32 FOREIGN KEY (game_session_id) REFERENCES game_sesion (id)');
        $this->addSql('ALTER TABLE game_sesion_user DROP FOREIGN KEY `FK_BAC24FC1A76ED395`');
        $this->addSql('ALTER TABLE game_sesion_user DROP FOREIGN KEY `FK_BAC24FC1CE6A6CC9`');
        $this->addSql('DROP TABLE game_sesion_user');
        $this->addSql('ALTER TABLE game_sesion DROP is_gm');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE game_sesion_user (game_sesion_id INT NOT NULL, user_id INT NOT NULL, INDEX IDX_BAC24FC1A76ED395 (user_id), INDEX IDX_BAC24FC1CE6A6CC9 (game_sesion_id), PRIMARY KEY (game_sesion_id, user_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_general_ci` ENGINE = InnoDB COMMENT = \'\' ');
        $this->addSql('ALTER TABLE game_sesion_user ADD CONSTRAINT `FK_BAC24FC1A76ED395` FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE game_sesion_user ADD CONSTRAINT `FK_BAC24FC1CE6A6CC9` FOREIGN KEY (game_sesion_id) REFERENCES game_sesion (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE user_game_session DROP FOREIGN KEY FK_C54AD6F9A76ED395');
        $this->addSql('ALTER TABLE user_game_session DROP FOREIGN KEY FK_C54AD6F98FE32B32');
        $this->addSql('DROP TABLE user_game_session');
        $this->addSql('ALTER TABLE game_sesion ADD is_gm TINYINT NOT NULL');
    }
}
