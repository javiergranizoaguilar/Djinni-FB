<?php

namespace App\Security\Voter;

use App\Entity\RosterItem;
use App\Entity\User;
use App\Repository\RosterVisibilityRepository;
use App\Security\SessionAccessChecker;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 *  - VIEW: DM, the item's creator, the assigned controller, or a user with a RosterVisibility grant.
 *  - EDIT / DELETE: DM only.
 */
class RosterItemVoter extends Voter
{
    public const VIEW = 'ROSTER_ITEM_VIEW';
    public const EDIT = 'ROSTER_ITEM_EDIT';
    public const DELETE = 'ROSTER_ITEM_DELETE';

    public function __construct(
        private SessionAccessChecker $access,
        private RosterVisibilityRepository $visRepo,
    ) {}

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::DELETE], true)
            && $subject instanceof RosterItem;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?\Symfony\Component\Security\Core\Authorization\Voter\Vote $vote = null): bool
    {
        /** @var RosterItem $subject */
        $user = $token->getUser();
        if (!$user instanceof User) return false;

        $session = $subject->getGameSession();
        if (!$session) return false;

        $isDm = $this->access->isDm($user, $session);

        return match ($attribute) {
            self::EDIT, self::DELETE => $isDm,
            self::VIEW => $isDm
                || $subject->getCreatedBy()?->getId() === $user->getId()
                || $subject->getControlledByUser()?->getId() === $user->getId()
                || (bool)$this->visRepo->findOneBy(['rosterItem' => $subject, 'user' => $user]),
            default => false,
        };
    }
}
