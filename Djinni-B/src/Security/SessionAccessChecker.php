<?php

namespace App\Security;

use App\Entity\GameSesion;
use App\Entity\User;
use App\Entity\UserGameSession;
use App\Repository\UserGameSessionRepository;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Centralised session-membership/DM checks.
 * Replaces ad-hoc UserGameSessionRepository::findOneBy calls scattered across controllers.
 */
class SessionAccessChecker
{
    public function __construct(private UserGameSessionRepository $ugsRepo) {}

    /**
     * Returns the UserGameSession row, or throws 403 if the user is not a member.
     * Throws 401 if no user is given.
     */
    public function assertMemberOfSession(?User $user, int|GameSesion|null $session): UserGameSession
    {
        if (!$user) {
            throw new AccessDeniedHttpException('Not authenticated.');
        }
        if (!$session) {
            throw new NotFoundHttpException('Session not found.');
        }
        $sessionId = $session instanceof GameSesion ? $session->getId() : (int)$session;
        $ugs = $this->ugsRepo->findOneBy(['user' => $user, 'gameSession' => $sessionId]);
        if (!$ugs) {
            throw new AccessDeniedHttpException('Not a member of this session.');
        }
        return $ugs;
    }

    /**
     * Asserts the user is the DM of the given session. Throws 403 otherwise.
     */
    public function assertDm(?User $user, int|GameSesion|null $session): UserGameSession
    {
        $ugs = $this->assertMemberOfSession($user, $session);
        if (!$ugs->isDm()) {
            throw new AccessDeniedHttpException('DM-only action.');
        }
        return $ugs;
    }

    /**
     * Non-throwing variant. Returns true if member, false otherwise.
     */
    public function isMember(?User $user, int|GameSesion|null $session): bool
    {
        if (!$user || !$session) return false;
        $sessionId = $session instanceof GameSesion ? $session->getId() : (int)$session;
        return (bool)$this->ugsRepo->findOneBy(['user' => $user, 'gameSession' => $sessionId]);
    }

    /**
     * Non-throwing variant. Returns true if DM, false otherwise.
     */
    public function isDm(?User $user, int|GameSesion|null $session): bool
    {
        if (!$user || !$session) return false;
        $sessionId = $session instanceof GameSesion ? $session->getId() : (int)$session;
        $ugs = $this->ugsRepo->findOneBy(['user' => $user, 'gameSession' => $sessionId]);
        return $ugs ? $ugs->isDm() : false;
    }
}
