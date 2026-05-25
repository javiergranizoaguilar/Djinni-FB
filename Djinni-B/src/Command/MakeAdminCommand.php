<?php

namespace App\Command;

use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:make-admin',
    description: 'Concede o revoca ROLE_ADMIN a un usuario por email.'
)]
class MakeAdminCommand extends Command
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly EntityManagerInterface $em,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('email', InputArgument::REQUIRED, 'Email del usuario')
            ->addOption('revoke', null, InputOption::VALUE_NONE, 'Quitar ROLE_ADMIN en lugar de añadirlo');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $email = (string) $input->getArgument('email');
        $revoke = (bool) $input->getOption('revoke');

        $user = $this->users->findOneBy(['email' => $email]);
        if (!$user) {
            $io->error(sprintf('No existe usuario con email "%s".', $email));
            return Command::FAILURE;
        }

        $roles = array_values(array_filter($user->getRoles(), fn ($r) => $r !== 'ROLE_USER'));

        if ($revoke) {
            $roles = array_values(array_filter($roles, fn ($r) => $r !== 'ROLE_ADMIN'));
            $user->setRoles($roles);
            $this->em->flush();
            $io->success(sprintf('ROLE_ADMIN revocado a %s.', $email));
            return Command::SUCCESS;
        }

        if (in_array('ROLE_ADMIN', $roles, true)) {
            $io->note(sprintf('%s ya es ROLE_ADMIN.', $email));
            return Command::SUCCESS;
        }

        $roles[] = 'ROLE_ADMIN';
        $user->setRoles($roles);
        $this->em->flush();
        $io->success(sprintf('ROLE_ADMIN concedido a %s. Debe re-loggearse para refrescar el JWT.', $email));
        return Command::SUCCESS;
    }
}
