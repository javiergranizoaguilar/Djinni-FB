<?php

namespace App\Security\Voter;

use App\Entity\SceneToken;
use App\Entity\User;
use App\Security\SessionAccessChecker;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * Authorizes operations against a SceneToken.
 *
 * - VIEW: any session member (GM layer is filtered out at controller serialization).
 * - EDIT_POSITION: DM, the token owner, or the explicitly assigned controller.
 * - DELETE: DM or the token owner.
 */
class SceneTokenVoter extends Voter
{
    public const VIEW = 'SCENE_TOKEN_VIEW';
    public const EDIT_POSITION = 'SCENE_TOKEN_EDIT_POSITION';
    public const DELETE = 'SCENE_TOKEN_DELETE';

    public function __construct(private SessionAccessChecker $access) {}

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT_POSITION, self::DELETE], true)
            && $subject instanceof SceneToken;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?\Symfony\Component\Security\Core\Authorization\Voter\Vote $vote = null): bool
    {
        /** @var SceneToken $subject */
        $user = $token->getUser();
        if (!$user instanceof User) return false;

        $session = $subject->getScene()?->getSessionId();
        if (!$session) return false;

        $isDm     = $this->access->isDm($user, $session);
        $isMember = $isDm || $this->access->isMember($user, $session);

        return match ($attribute) {
            self::VIEW          => $isMember,
            self::DELETE        => $isDm || $subject->getOwner()?->getId() === $user->getId(),
            self::EDIT_POSITION => $isDm
                || $subject->getOwner()?->getId() === $user->getId()
                || $subject->getControlledBy()?->getId() === $user->getId(),
            default => false,
        };
    }
}
