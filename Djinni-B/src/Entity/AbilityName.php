<?php

namespace App\Entity;

enum AbilityName: string
{
    case nada = 'nada';
    case fuerza = 'fuerza';
    case destreza = 'destreza';
    case constitucion = 'constitucion';
    case inteligencia = 'inteligencia';
    case sabiduria = 'sabiduria';
    case carisma = 'carisma';

    public static function assertNullable(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (self::tryFrom($value) === null) {
            throw new \InvalidArgumentException(sprintf('Invalid ability name "%s"', $value));
        }
        return $value;
    }
}
