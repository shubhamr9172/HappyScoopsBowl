import React, { useState } from 'react';
import { X } from 'lucide-react';
import { PRICING_CONFIG } from '../data/menu';

const UpsellModal = ({ isOpen, onClose, onAddUpsell, onSkip }) => {
    const [selectedUpsells, setSelectedUpsells] = useState([]);

    if (!isOpen) return null;

    const handleToggleUpsell = (upsell) => {
        setSelectedUpsells(prev => {
            const exists = prev.find(item => item.id === upsell.id);
            if (exists) {
                return prev.filter(item => item.id !== upsell.id);
            } else {
                return [...prev, { ...upsell, quantity: 1 }];
            }
        });
    };

    const handleConfirm = () => {
        if (selectedUpsells.length > 0) {
            selectedUpsells.forEach(upsell => onAddUpsell(upsell));
        }
        onClose();
    };

    const handleSkip = () => {
        onSkip();
        onClose();
    };

    const totalUpsellPrice = selectedUpsells.reduce((sum, item) => sum + item.price, 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold">Make it Dreamy! ✨</h2>
                            <p className="text-sm opacity-90 mt-1">Add premium toppings to elevate your bowl</p>
                        </div>
                        <button
                            onClick={handleSkip}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Upsell Options */}
                <div className="p-6 space-y-4">
                    {PRICING_CONFIG.upsells.map(upsell => {
                        const isSelected = selectedUpsells.find(item => item.id === upsell.id);

                        return (
                            <div
                                key={upsell.id}
                                onClick={() => handleToggleUpsell(upsell)}
                                className={`
                                    border-2 rounded-xl p-4 cursor-pointer transition-all duration-200
                                    ${isSelected
                                        ? 'border-purple-600 bg-purple-50 shadow-md'
                                        : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                                    }
                                `}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3 flex-1">
                                        <span className="text-3xl">{upsell.icon}</span>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800 text-lg">
                                                {upsell.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {upsell.description}
                                            </p>
                                            {upsell.margin === 'premium' && (
                                                <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                                                    Premium
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="ml-4 text-right">
                                        <div className="font-bold text-lg text-purple-600">
                                            +₹{upsell.price}
                                        </div>
                                        {isSelected && (
                                            <div className="mt-1 text-green-600 text-sm font-semibold">
                                                ✓ Added
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl border-t">
                    {selectedUpsells.length > 0 && (
                        <div className="mb-4 p-3 bg-purple-100 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-medium">
                                    {selectedUpsells.length} item{selectedUpsells.length > 1 ? 's' : ''} selected
                                </span>
                                <span className="text-purple-700 font-bold text-lg">
                                    +₹{totalUpsellPrice}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleSkip}
                            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition"
                        >
                            No Thanks
                        </button>
                        <button
                            onClick={handleConfirm}
                            className={`
                                flex-1 px-6 py-3 rounded-xl font-semibold transition
                                ${selectedUpsells.length > 0
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                                    : 'bg-purple-600 text-white hover:bg-purple-700'
                                }
                            `}
                        >
                            {selectedUpsells.length > 0 ? 'Add to Order' : 'Continue'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpsellModal;
