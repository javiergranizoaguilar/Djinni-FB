<?php

namespace App\Command;

use Doctrine\DBAL\Connection;
use Lcobucci\JWT\Encoding\JoseEncoder;
use Lcobucci\JWT\Signer\Key\InMemory;
use Lcobucci\JWT\Signer\Rsa\Sha256;
use Lcobucci\JWT\Token\Parser;
use Lcobucci\JWT\Validation\Constraint\SignedWith;
use Lcobucci\JWT\Validation\Validator;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Workerman\Connection\TcpConnection;
use Workerman\Worker;

#[AsCommand(name: 'app:chat-server', description: 'Start the WebSocket chat server on port 8081')]
class ChatServerCommand extends Command
{
    /** @var array<int, \SplObjectStorage<TcpConnection, array>> rooms[gameId] → connections */
    private array $rooms = [];

    /** @var \WeakMap<TcpConnection, array{userId: int, userName: string, gameId: int}> */
    private \WeakMap $meta;

    public function __construct(
        private readonly Connection $connection,
        #[Autowire('%kernel.project_dir%')] private readonly string $projectDir,
    ) {
        parent::__construct();
        $this->meta = new \WeakMap();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $publicKeyPath = $this->projectDir . '/config/jwt/public.pem';
        $parser    = new Parser(new JoseEncoder());
        $signer    = new Sha256();
        $pubKey    = InMemory::file($publicKeyPath);
        $validator = new Validator();
        $constraint = new SignedWith($signer, $pubKey);

        $worker = new Worker('websocket://0.0.0.0:8081');
        $worker->count = 1;
        $worker->name  = 'djinni-chat';

        $conn = $this->connection;

        $worker->onMessage = function (TcpConnection $tcpConn, $data) use (
            $parser, $validator, $constraint, $conn, $output
        ): void {
            $payload = json_decode($data, true);
            if (!is_array($payload) || !isset($payload['type'])) {
                return;
            }

            // ── AUTH handshake ──────────────────────────────────────────────
            if ($payload['type'] === 'auth') {
                $jwtString = $payload['token'] ?? '';
                $gameId    = (int) ($payload['gameId'] ?? 0);

                try {
                    $token = $parser->parse($jwtString);
                    $validator->assert($token, $constraint);
                    $email = $token->claims()->get('email');
                } catch (\Throwable) {
                    $tcpConn->send(json_encode(['type' => 'error', 'msg' => 'Unauthorized']));
                    $tcpConn->close();
                    return;
                }

                $row = $conn->fetchAssociative(
                    'SELECT id, username, email FROM `user` WHERE email = ?',
                    [$email]
                );

                if (!$row) {
                    $tcpConn->close();
                    return;
                }

                $userName = $row['username'] ?? $row['email'];
                $this->meta[$tcpConn] = ['userId' => (int) $row['id'], 'userName' => $userName, 'gameId' => $gameId];

                if (!isset($this->rooms[$gameId])) {
                    $this->rooms[$gameId] = new \SplObjectStorage();
                }
                $this->rooms[$gameId]->attach($tcpConn);

                $output->writeln(sprintf('[chat] %s joined room %d', $userName, $gameId));
                return;
            }

            // ── TOKEN MOVE broadcast (Option C: client pushes after PUT; server routes, no echo to sender) ──
            if ($payload['type'] === 'token_move') {
                if (!isset($this->meta[$tcpConn])) {
                    return;
                }
                $m       = $this->meta[$tcpConn];
                $tokenId = (int)($payload['tokenId'] ?? 0);
                $sceneId = (int)($payload['sceneId'] ?? 0);
                if (!$tokenId || !$sceneId) {
                    return;
                }
                $broadcast = json_encode([
                    'type'    => 'token_move',
                    'tokenId' => $tokenId,
                    'x'       => isset($payload['x']) && $payload['x'] !== null ? (float)$payload['x'] : null,
                    'y'       => isset($payload['y']) && $payload['y'] !== null ? (float)$payload['y'] : null,
                    'col'     => (int)($payload['col'] ?? 0),
                    'row'     => (int)($payload['row'] ?? 0),
                    'sceneId' => $sceneId,
                ]);
                $room = $this->rooms[$m['gameId']] ?? null;
                if ($room) {
                    foreach ($room as $peer) {
                        if ($peer === $tcpConn) {
                            continue; // no echo to sender — moving user's token must not jump
                        }
                        $peer->send($broadcast);
                    }
                }
                return;
            }

            // ── SCENE TOKEN events (Option B) ───────────────────────────────
            if (in_array($payload['type'], ['scene_token_created', 'scene_token_updated'], true)) {
                if (!isset($this->meta[$tcpConn])) {
                    return;
                }
                $m       = $this->meta[$tcpConn];
                $token   = $payload['token'] ?? null;
                $sceneId = isset($payload['sceneId']) ? (int) $payload['sceneId'] : 0;
                if (!$token || !$sceneId) {
                    return;
                }
                $broadcast = json_encode([
                    'type'    => $payload['type'],
                    'token'   => $token,
                    'sceneId' => $sceneId,
                    'actorId' => $m['userId'],
                ]);
                $room = $this->rooms[$m['gameId']] ?? null;
                if ($room) {
                    foreach ($room as $peer) {
                        $peer->send($broadcast);
                    }
                }
                return;
            }

            if ($payload['type'] === 'scene_token_deleted') {
                if (!isset($this->meta[$tcpConn])) {
                    return;
                }
                $m       = $this->meta[$tcpConn];
                $tokenId = isset($payload['tokenId']) ? (int) $payload['tokenId'] : 0;
                $sceneId = isset($payload['sceneId']) ? (int) $payload['sceneId'] : 0;
                if (!$tokenId || !$sceneId) {
                    return;
                }
                $broadcast = json_encode([
                    'type'    => 'scene_token_deleted',
                    'tokenId' => $tokenId,
                    'sceneId' => $sceneId,
                    'actorId' => $m['userId'],
                ]);
                $room = $this->rooms[$m['gameId']] ?? null;
                if ($room) {
                    foreach ($room as $peer) {
                        $peer->send($broadcast);
                    }
                }
                return;
            }

            // ── SCENE IMAGE move/resize broadcast ──────────────────────────
            if ($payload['type'] === 'scene_image_moved') {
                if (!isset($this->meta[$tcpConn])) {
                    return;
                }
                $m       = $this->meta[$tcpConn];
                $imageId = isset($payload['imageId']) ? (int) $payload['imageId'] : 0;
                $sceneId = isset($payload['sceneId']) ? (int) $payload['sceneId'] : 0;
                if (!$imageId || !$sceneId) {
                    return;
                }
                $broadcast = json_encode([
                    'type'    => 'scene_image_moved',
                    'imageId' => $imageId,
                    'sceneId' => $sceneId,
                    'x'       => isset($payload['x']) ? (float) $payload['x'] : null,
                    'y'       => isset($payload['y']) ? (float) $payload['y'] : null,
                ]);
                $room = $this->rooms[$m['gameId']] ?? null;
                if ($room) {
                    foreach ($room as $peer) {
                        if ($peer === $tcpConn) {
                            continue;
                        }
                        $peer->send($broadcast);
                    }
                }
                return;
            }

            if ($payload['type'] === 'scene_image_resized') {
                if (!isset($this->meta[$tcpConn])) {
                    return;
                }
                $m       = $this->meta[$tcpConn];
                $imageId = isset($payload['imageId']) ? (int) $payload['imageId'] : 0;
                $sceneId = isset($payload['sceneId']) ? (int) $payload['sceneId'] : 0;
                if (!$imageId || !$sceneId) {
                    return;
                }
                $broadcast = json_encode([
                    'type'    => 'scene_image_resized',
                    'imageId' => $imageId,
                    'sceneId' => $sceneId,
                    'x'       => isset($payload['x'])      ? (float) $payload['x']      : null,
                    'y'       => isset($payload['y'])      ? (float) $payload['y']      : null,
                    'width'   => isset($payload['width'])  ? (float) $payload['width']  : null,
                    'height'  => isset($payload['height']) ? (float) $payload['height'] : null,
                ]);
                $room = $this->rooms[$m['gameId']] ?? null;
                if ($room) {
                    foreach ($room as $peer) {
                        if ($peer === $tcpConn) {
                            continue;
                        }
                        $peer->send($broadcast);
                    }
                }
                return;
            }

            // ── CHAT message ────────────────────────────────────────────────
            if ($payload['type'] === 'message') {
                if (!isset($this->meta[$tcpConn])) {
                    return; // not authenticated yet
                }

                $m       = $this->meta[$tcpConn];
                $content = trim($payload['content'] ?? '');
                if ($content === '') {
                    return;
                }

                $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

                try {
                    $conn->executeStatement(
                        'INSERT INTO game_message (game_sesion_id, sender_id, content, created_at) VALUES (?, ?, ?, ?)',
                        [$m['gameId'], $m['userId'], $content, $now]
                    );
                } catch (\Throwable $e) {
                    $output->writeln('[chat] DB error: ' . $e->getMessage());
                    // Reconnect attempt
                    try { $conn->close(); $conn->connect(); } catch (\Throwable) {}
                    return;
                }

                $broadcast = json_encode([
                    'type'       => 'message',
                    'senderId'   => $m['userId'],
                    'senderName' => $m['userName'],
                    'content'    => $content,
                    'createdAt'  => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
                ]);

                $room = $this->rooms[$m['gameId']] ?? null;
                if ($room) {
                    foreach ($room as $peer) {
                        $peer->send($broadcast);
                    }
                }
            }
        };

        $worker->onClose = function (TcpConnection $tcpConn) use ($output): void {
            if (!isset($this->meta[$tcpConn])) {
                return;
            }
            $m = $this->meta[$tcpConn];
            $room = $this->rooms[$m['gameId']] ?? null;
            if ($room) {
                $room->detach($tcpConn);
                if ($room->count() === 0) {
                    unset($this->rooms[$m['gameId']]);
                }
            }
            unset($this->meta[$tcpConn]);
            $output->writeln(sprintf('[chat] %s left room %d', $m['userName'], $m['gameId']));
        };

        global $argv;
        $argv = ['workerman', 'start'];

        Worker::runAll();

        return Command::SUCCESS;
    }
}
