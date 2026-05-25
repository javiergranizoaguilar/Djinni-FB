<?php

namespace App\Security\Voter;

use App\Entity\GameMessage;
use App\Entity\User;
use App\Security\SessionAccessChecker;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * VIEW for any session member; DELETE only for DM or the original sender (future-proofing
 * for moderation; no controller currently exposes message delete, but the voter is ready).
 */
class GameMessageVoter extends Voter
{
    public const VIEW = 'GAME_MESSAGE_VIEW';
    public const DELETE = 'GAME_MESSAGE_DELETE';

    public function __construct(private SessionAccessChecker $access) {}

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::DELETE], true)
            && $subject instanceof GameMessage;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?\Symfony\Component\Security\Core\Authorization\Voter\Vote $vote = null): bool
    {
        /** @var GameMessage $subject */
        $user = $token->getUser();
        if (!$user instanceof User) return false;

        $session = $subject->getGameSesion();
        if (!$session) return false;

        $isDm = $this->access->isDm($user, $session);
        $isMember = $isDm || $this->access->isMember($user, $session);

        return match ($attribute) {
            self::VIEW => $isMember,
            self::DELETE => $isDm || $subject->getSender()?->getId() === $user->getId(),
            default => false,
        };
    }
}
