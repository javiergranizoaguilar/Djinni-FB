<?php

namespace App\Security\Voter;

use App\Entity\Scene;
use App\Entity\User;
use App\Security\SessionAccessChecker;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * Scene-level access.
 *  - VIEW: any session member.
 *  - EDIT / DELETE: DM only (scene config, fog, walls, deletion).
 */
class SceneVoter extends Voter
{
    public const VIEW = 'SCENE_VIEW';
    public const EDIT = 'SCENE_EDIT';
    public const DELETE = 'SCENE_DELETE';

    public function __construct(private SessionAccessChecker $access) {}

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::DELETE], true)
            && $subject instanceof Scene;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?\Symfony\Component\Security\Core\Authorization\Voter\Vote $vote = null): bool
    {
        /** @var Scene $subject */
        $user = $token->getUser();
        if (!$user instanceof User) return false;

        $session = $subject->getSessionId();
        if (!$session) return false;

        $isDm = $this->access->isDm($user, $session);
        $isMember = $isDm || $this->access->isMember($user, $session);

        return match ($attribute) {
            self::VIEW => $isMember,
            self::EDIT, self::DELETE => $isDm,
            default => false,
        };
    }
}
