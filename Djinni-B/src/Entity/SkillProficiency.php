<?php

namespace App\Entity;

enum SkillProficiency: string
{
    case proficiency = 'proficiency';
    case expertise = 'expertise';

    public static function assertNullable(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (self::tryFrom($value) === null) {
            throw new \InvalidArgumentException(sprintf('Invalid skill proficiency "%s"', $value));
        }
        return $value;
    }
}
