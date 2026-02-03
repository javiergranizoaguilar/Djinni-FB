<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260203101738 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE ability (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, description LONGTEXT NOT NULL, source_tipe VARCHAR(255) NOT NULL, is_active TINYINT NOT NULL, has_limited_uses TINYINT NOT NULL, max_uses INT DEFAULT NULL, current_uses INT DEFAULT NULL, recharge_type VARCHAR(255) NOT NULL, character_id_id INT DEFAULT NULL, INDEX IDX_35CFEE3C81877935 (character_id_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE attack (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, damage_dice JSON DEFAULT NULL, damage_type JSON DEFAULT NULL, range_ VARCHAR(255) NOT NULL, is_saving_throw TINYINT NOT NULL, description LONGTEXT NOT NULL, attack_modifier VARCHAR(255) DEFAULT NULL, saving_throw_tipe VARCHAR(255) DEFAULT NULL, character_attack_id INT DEFAULT NULL, INDEX IDX_47C02D3B7261F562 (character_attack_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE character_sheet (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, spellcasting_abillity VARCHAR(255) DEFAULT NULL, token_image VARCHAR(255) DEFAULT NULL, portrait_image VARCHAR(255) DEFAULT NULL, caster_level DOUBLE PRECISION NOT NULL, stats JSON NOT NULL, bonuses JSON DEFAULT NULL, apareance LONGTEXT DEFAULT NULL, backstory LONGTEXT DEFAULT NULL, personality_traits LONGTEXT DEFAULT NULL, ideals LONGTEXT DEFAULT NULL, bonds LONGTEXT DEFAULT NULL, flaws LONGTEXT DEFAULT NULL, exaustion INT DEFAULT NULL, currency JSON NOT NULL, custom_counters JSON DEFAULT NULL, modifiers JSON DEFAULT NULL, gamesesion_id INT DEFAULT NULL, INDEX IDX_79FF76809948178D (gamesesion_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE game_sesion (id INT AUTO_INCREMENT NOT NULL, title VARCHAR(255) NOT NULL, is_active TINYINT NOT NULL, created_at DATETIME NOT NULL, gm_id INT NOT NULL, INDEX IDX_66704FD3BD7C6FBC (gm_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE game_sesion_user (game_sesion_id INT NOT NULL, user_id INT NOT NULL, INDEX IDX_BAC24FC1CE6A6CC9 (game_sesion_id), INDEX IDX_BAC24FC1A76ED395 (user_id), PRIMARY KEY (game_sesion_id, user_id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE inventory (id INT AUTO_INCREMENT NOT NULL, quantity DOUBLE PRECISION NOT NULL, is_equipped TINYINT NOT NULL, seet_id INT DEFAULT NULL, items_id INT DEFAULT NULL, INDEX IDX_B12D4A36345A58F5 (seet_id), INDEX IDX_B12D4A366BB0AE84 (items_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE item (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, weight DOUBLE PRECISION DEFAULT NULL, metadata JSON DEFAULT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE monster (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, source_book VARCHAR(255) DEFAULT NULL, size VARCHAR(255) NOT NULL, page_number INT DEFAULT NULL, type VARCHAR(255) NOT NULL, alignment VARCHAR(255) DEFAULT NULL, armor_class INT NOT NULL, ac_description VARCHAR(255) DEFAULT NULL, hit_points_average INT DEFAULT NULL, hp_formula VARCHAR(255) DEFAULT NULL, speed JSON DEFAULT NULL, str INT DEFAULT NULL, dex INT DEFAULT NULL, con INT DEFAULT NULL, int_stat INT DEFAULT NULL, wis INT DEFAULT NULL, cha INT DEFAULT NULL, saving_throws JSON DEFAULT NULL, skills JSON DEFAULT NULL, passive_perception INT DEFAULT NULL, challenge_rating INT DEFAULT NULL, senses LONGTEXT DEFAULT NULL, languages LONGTEXT DEFAULT NULL, traits JSON DEFAULT NULL, spellcasting JSON DEFAULT NULL, actions JSON DEFAULT NULL, bonus_actions JSON DEFAULT NULL, reactions JSON DEFAULT NULL, legendary_resistances_count INT DEFAULT NULL, legendary_actions_count INT DEFAULT NULL, legendary_actions JSON DEFAULT NULL, mythic_actions JSON DEFAULT NULL, lair_actions JSON DEFAULT NULL, regional_effects JSON DEFAULT NULL, enviroment JSON DEFAULT NULL, treasure JSON DEFAULT NULL, tags JSON DEFAULT NULL, vtt_metadata JSON DEFAULT NULL, creador_id INT NOT NULL, exist_id INT DEFAULT NULL, INDEX IDX_245EC6F462F40C3D (creador_id), INDEX IDX_245EC6F4CE7A009E (exist_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE monster_user (id INT AUTO_INCREMENT NOT NULL, editable TINYINT NOT NULL, visible TINYINT NOT NULL, user_id INT DEFAULT NULL, monster_id INT DEFAULT NULL, INDEX IDX_A9EE0309A76ED395 (user_id), INDEX IDX_A9EE0309C5FF1223 (monster_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE proficency (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, type VARCHAR(255) NOT NULL, value_modifier INT NOT NULL, character_id_id INT DEFAULT NULL, INDEX IDX_F2EA8E9D81877935 (character_id_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE scene (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, grid_width INT NOT NULL, grid_height INT NOT NULL, background VARCHAR(255) DEFAULT NULL, data_json JSON DEFAULT NULL, session_id_id INT DEFAULT NULL, INDEX IDX_D979EFDAA4392681 (session_id_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE spell (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, level INT NOT NULL, school VARCHAR(255) DEFAULT NULL, description LONGTEXT DEFAULT NULL, is_prepared TINYINT NOT NULL, has_limited_uses TINYINT NOT NULL, max_charges INT DEFAULT NULL, current_charges INT DEFAULT NULL, casting_time VARCHAR(255) DEFAULT NULL, spell_range VARCHAR(255) DEFAULT NULL, components LONGTEXT DEFAULT NULL, duration VARCHAR(255) DEFAULT NULL, higer_level_description LONGTEXT DEFAULT NULL, recharge_type VARCHAR(255) DEFAULT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE spell_character_sheet (spell_id INT NOT NULL, character_sheet_id INT NOT NULL, INDEX IDX_7D43252F479EC90D (spell_id), INDEX IDX_7D43252FD313EF34 (character_sheet_id), PRIMARY KEY (spell_id, character_sheet_id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE spell_monster (spell_id INT NOT NULL, monster_id INT NOT NULL, INDEX IDX_493B83E8479EC90D (spell_id), INDEX IDX_493B83E8C5FF1223 (monster_id), PRIMARY KEY (spell_id, monster_id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE user (id INT AUTO_INCREMENT NOT NULL, username VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL, avatar_url VARCHAR(255) DEFAULT NULL, datetime DATETIME NOT NULL, roles JSON NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE messenger_messages (id BIGINT AUTO_INCREMENT NOT NULL, body LONGTEXT NOT NULL, headers LONGTEXT NOT NULL, queue_name VARCHAR(190) NOT NULL, created_at DATETIME NOT NULL, available_at DATETIME NOT NULL, delivered_at DATETIME DEFAULT NULL, INDEX IDX_75EA56E0FB7336F0E3BD61CE16BA31DBBF396750 (queue_name, available_at, delivered_at, id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE ability ADD CONSTRAINT FK_35CFEE3C81877935 FOREIGN KEY (character_id_id) REFERENCES character_sheet (id)');
        $this->addSql('ALTER TABLE attack ADD CONSTRAINT FK_47C02D3B7261F562 FOREIGN KEY (character_attack_id) REFERENCES character_sheet (id)');
        $this->addSql('ALTER TABLE character_sheet ADD CONSTRAINT FK_79FF76809948178D FOREIGN KEY (gamesesion_id) REFERENCES game_sesion (id)');
        $this->addSql('ALTER TABLE game_sesion ADD CONSTRAINT FK_66704FD3BD7C6FBC FOREIGN KEY (gm_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE game_sesion_user ADD CONSTRAINT FK_BAC24FC1CE6A6CC9 FOREIGN KEY (game_sesion_id) REFERENCES game_sesion (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE game_sesion_user ADD CONSTRAINT FK_BAC24FC1A76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE inventory ADD CONSTRAINT FK_B12D4A36345A58F5 FOREIGN KEY (seet_id) REFERENCES character_sheet (id)');
        $this->addSql('ALTER TABLE inventory ADD CONSTRAINT FK_B12D4A366BB0AE84 FOREIGN KEY (items_id) REFERENCES item (id)');
        $this->addSql('ALTER TABLE monster ADD CONSTRAINT FK_245EC6F462F40C3D FOREIGN KEY (creador_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE monster ADD CONSTRAINT FK_245EC6F4CE7A009E FOREIGN KEY (exist_id) REFERENCES game_sesion (id)');
        $this->addSql('ALTER TABLE monster_user ADD CONSTRAINT FK_A9EE0309A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE monster_user ADD CONSTRAINT FK_A9EE0309C5FF1223 FOREIGN KEY (monster_id) REFERENCES monster (id)');
        $this->addSql('ALTER TABLE proficency ADD CONSTRAINT FK_F2EA8E9D81877935 FOREIGN KEY (character_id_id) REFERENCES character_sheet (id)');
        $this->addSql('ALTER TABLE scene ADD CONSTRAINT FK_D979EFDAA4392681 FOREIGN KEY (session_id_id) REFERENCES game_sesion (id)');
        $this->addSql('ALTER TABLE spell_character_sheet ADD CONSTRAINT FK_7D43252F479EC90D FOREIGN KEY (spell_id) REFERENCES spell (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE spell_character_sheet ADD CONSTRAINT FK_7D43252FD313EF34 FOREIGN KEY (character_sheet_id) REFERENCES character_sheet (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE spell_monster ADD CONSTRAINT FK_493B83E8479EC90D FOREIGN KEY (spell_id) REFERENCES spell (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE spell_monster ADD CONSTRAINT FK_493B83E8C5FF1223 FOREIGN KEY (monster_id) REFERENCES monster (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE character_sheet_user ADD CONSTRAINT FK_6F611FD29D86650F FOREIGN KEY (user_id_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE character_sheet_user ADD CONSTRAINT FK_6F611FD2CED6C500 FOREIGN KEY (charactersheet_id_id) REFERENCES character_sheet (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE ability DROP FOREIGN KEY FK_35CFEE3C81877935');
        $this->addSql('ALTER TABLE attack DROP FOREIGN KEY FK_47C02D3B7261F562');
        $this->addSql('ALTER TABLE character_sheet DROP FOREIGN KEY FK_79FF76809948178D');
        $this->addSql('ALTER TABLE game_sesion DROP FOREIGN KEY FK_66704FD3BD7C6FBC');
        $this->addSql('ALTER TABLE game_sesion_user DROP FOREIGN KEY FK_BAC24FC1CE6A6CC9');
        $this->addSql('ALTER TABLE game_sesion_user DROP FOREIGN KEY FK_BAC24FC1A76ED395');
        $this->addSql('ALTER TABLE inventory DROP FOREIGN KEY FK_B12D4A36345A58F5');
        $this->addSql('ALTER TABLE inventory DROP FOREIGN KEY FK_B12D4A366BB0AE84');
        $this->addSql('ALTER TABLE monster DROP FOREIGN KEY FK_245EC6F462F40C3D');
        $this->addSql('ALTER TABLE monster DROP FOREIGN KEY FK_245EC6F4CE7A009E');
        $this->addSql('ALTER TABLE monster_user DROP FOREIGN KEY FK_A9EE0309A76ED395');
        $this->addSql('ALTER TABLE monster_user DROP FOREIGN KEY FK_A9EE0309C5FF1223');
        $this->addSql('ALTER TABLE proficency DROP FOREIGN KEY FK_F2EA8E9D81877935');
        $this->addSql('ALTER TABLE scene DROP FOREIGN KEY FK_D979EFDAA4392681');
        $this->addSql('ALTER TABLE spell_character_sheet DROP FOREIGN KEY FK_7D43252F479EC90D');
        $this->addSql('ALTER TABLE spell_character_sheet DROP FOREIGN KEY FK_7D43252FD313EF34');
        $this->addSql('ALTER TABLE spell_monster DROP FOREIGN KEY FK_493B83E8479EC90D');
        $this->addSql('ALTER TABLE spell_monster DROP FOREIGN KEY FK_493B83E8C5FF1223');
        $this->addSql('DROP TABLE ability');
        $this->addSql('DROP TABLE attack');
        $this->addSql('DROP TABLE character_sheet');
        $this->addSql('DROP TABLE game_sesion');
        $this->addSql('DROP TABLE game_sesion_user');
        $this->addSql('DROP TABLE inventory');
        $this->addSql('DROP TABLE item');
        $this->addSql('DROP TABLE monster');
        $this->addSql('DROP TABLE monster_user');
        $this->addSql('DROP TABLE proficency');
        $this->addSql('DROP TABLE scene');
        $this->addSql('DROP TABLE spell');
        $this->addSql('DROP TABLE spell_character_sheet');
        $this->addSql('DROP TABLE spell_monster');
        $this->addSql('DROP TABLE user');
        $this->addSql('DROP TABLE messenger_messages');
        $this->addSql('ALTER TABLE character_sheet_user DROP FOREIGN KEY FK_6F611FD29D86650F');
        $this->addSql('ALTER TABLE character_sheet_user DROP FOREIGN KEY FK_6F611FD2CED6C500');
    }
}
