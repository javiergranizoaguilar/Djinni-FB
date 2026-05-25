<?php

namespace App\Command;

use App\Entity\GameSesion;
use App\Entity\User;
use App\Entity\UserGameSession;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Carga datos de demostracion sin depender del bundle de fixtures de Doctrine.
 * Idempotente: si los usuarios demo ya existen, no hace nada.
 *
 * Usuarios creados:
 *   - dm@djinni.local      / DungeonMaster1!  (Game Master)
 *   - jugador@djinni.local / PartyMember1!    (jugador)
 *
 * Las contrasenas cumplen la politica minima de 12 caracteres definida
 * en ApiUserController.
 */
#[AsCommand(name: 'app:load-demo', description: 'Carga usuarios y partida de demo para el tribunal.')]
class LoadDemoCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $hasher,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $existing = $this->em->getRepository(User::class)->findOneBy(['email' => 'dm@djinni.local']);
        if ($existing !== null) {
            // Ensure demo DM always has ROLE_ADMIN (idempotent patch).
            if (!in_array('ROLE_ADMIN', $existing->getRoles(), true)) {
                $roles = array_values(array_filter($existing->getRoles(), fn ($r) => $r !== 'ROLE_USER'));
                $roles[] = 'ROLE_ADMIN';
                $existing->setRoles($roles);
                $this->em->flush();
                $output->writeln('[demo] ROLE_ADMIN añadido a dm_demo');
            } else {
                $output->writeln('[demo] datos ya cargados, nada que hacer');
            }
            return Command::SUCCESS;
        }

        $dm = (new User())
            ->setUsername('dm_demo')
            ->setEmail('dm@djinni.local')
            ->setDatetime(new \DateTimeImmutable())
            ->setRoles(['ROLE_ADMIN']);
        $dm->setPassword($this->hasher->hashPassword($dm, 'DungeonMaster1!'));

        $player = (new User())
            ->setUsername('jugador_demo')
            ->setEmail('jugador@djinni.local')
            ->setDatetime(new \DateTimeImmutable());
        $player->setPassword($this->hasher->hashPassword($player, 'PartyMember1!'));

        $game = (new GameSesion())
            ->setTitle('Partida de demostracion')
            ->setIsActive(true)
            ->setCreatedAt(new \DateTimeImmutable());

        $this->em->persist($dm);
        $this->em->persist($player);
        $this->em->persist($game);

        foreach ([[$dm, true], [$player, false]] as [$user, $isDm]) {
            $link = (new UserGameSession())
                ->setUser($user)
                ->setGameSession($game)
                ->setIsDm($isDm);
            $this->em->persist($link);
        }

        $this->em->flush();

        $output->writeln('[demo] usuarios y partida creados');
        return Command::SUCCESS;
    }
}
