<?php

/**
 * Returns the importmap for this application.
 *
 * - "path" is a path inside the asset mapper system. Use the
 *     "debug:asset-map" command to see the full list of paths.
 *
 * - "entrypoint" (JavaScript only) set to true for any module that will
 *     be used as an "entrypoint" (and passed to the importmap() Twig function).
 *
 * The "importmap:require" command can be used to add new entries to this file.
 */
return [
    'app' => [
        'path' => './assets/app.js',
        'entrypoint' => true,
    ],
    '@hotwired/stimulus' => [
        'version' => '3.2.2',
    ],
    '@symfony/stimulus-bundle' => [
        'path' => './vendor/symfony/stimulus-bundle/assets/dist/loader.js',
    ],
    '@hotwired/turbo' => [
        'version' => '7.3.0',
    ],
    'react' => [
        'version' => '18.3.1',
    ],
    'react-dom/client' => [
        'version' => '18.3.1',
    ],
    'react-dom' => [
        'version' => '19.2.3',
    ],
    'scheduler' => [
        'version' => '0.27.0',
    ],
    '@symfony/ux-react' => [
        'path' => './vendor/symfony/ux-react/assets/dist/loader.js',
    ],
    'konva' => [
        'version' => '10.2.0',
    ],
    'react-konva' => [
        'version' => '19.2.1',
    ],
    'konva/lib/Core.js' => [
        'version' => '10.0.12',
    ],
    'react-reconciler' => [
        'version' => '0.33.0',
    ],
    'react-reconciler/constants.js' => [
        'version' => '0.33.0',
    ],
    'konva/lib/Global.js' => [
        'version' => '10.0.12',
    ],
    'its-fine' => [
        'version' => '2.0.0',
    ],
];
