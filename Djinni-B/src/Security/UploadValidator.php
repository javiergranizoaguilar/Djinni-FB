<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Centralised upload validation: enforces image MIME whitelist and size cap.
 * Used by every controller that accepts user-uploaded image files.
 */
class UploadValidator
{
    public const ALLOWED_IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    public const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

    /**
     * Validates an uploaded image. Throws 400 if invalid.
     */
    public function assertImage(?UploadedFile $file, int $maxBytes = self::MAX_IMAGE_SIZE_BYTES): void
    {
        if (!$file) {
            throw new BadRequestHttpException('No image provided.');
        }
        if (!$file->isValid()) {
            throw new BadRequestHttpException('Uploaded file is invalid: ' . $file->getErrorMessage());
        }
        if ($file->getSize() > $maxBytes) {
            throw new BadRequestHttpException(sprintf('Image too large (max %d bytes).', $maxBytes));
        }
        // Use getMimeType() which sniffs file content, not the client-supplied header.
        $mime = $file->getMimeType();
        if (!in_array($mime, self::ALLOWED_IMAGE_MIME, true)) {
            throw new BadRequestHttpException('Unsupported image type: ' . ($mime ?? 'unknown'));
        }
    }

    /**
     * Returns true if the resolved absolute path is inside the given base directory.
     * Defends against ../-based path traversal when deleting user-controlled file paths.
     */
    public function pathIsWithin(string $absolutePath, string $baseDir): bool
    {
        $real = realpath($absolutePath);
        $base = realpath($baseDir);
        if ($real === false || $base === false) return false;
        return str_starts_with($real, rtrim($base, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR);
    }
}
