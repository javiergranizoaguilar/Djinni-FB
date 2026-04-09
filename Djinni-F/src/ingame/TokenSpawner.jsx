import React from 'react';

const TOKENS = [
    { color: 'red', label: 'Red', hex: '#FF0000' },
    { color: 'blue', label: 'Blue', hex: '#0000FF' },
    { color: 'green', label: 'Green', hex: '#00FF00' },
    { color: 'yellow', label: 'Yellow', hex: '#FFFF00' },
];

export default function TokenSpawner() {
    return (
        <div className="absolute top-20 left-4 bg-gray-800 p-4 rounded-md shadow-lg z-10 w-48 border border-gray-600">
            <h3 className="text-white text-lg font-bold mb-4 border-b border-gray-600 pb-2">Tokens</h3>
            <p className="text-gray-400 text-xs mb-3">Arrastra un token al tablero</p>
            <div className="flex flex-wrap gap-3">
                {TOKENS.map(({ color, label, hex }) => (
                    <div
                        key={color}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('tokenType', color)}
                        title={label}
                        className="w-12 h-12 cursor-grab rounded-full border-2 border-transparent hover:border-white"
                        style={{ backgroundColor: hex }}
                    />
                ))}
            </div>
        </div>
    );
}
