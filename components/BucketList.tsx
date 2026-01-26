import React, { useState } from 'react';
import { Button } from './Button';

interface BucketListProps {
    items: string[];
    onAdd: (item: string) => void;
    onRemove: (item: string) => void;
}

export const BucketList: React.FC<BucketListProps> = ({ items, onAdd, onRemove }) => {
    const [newItem, setNewItem] = useState('');

    const handleAdd = () => {
        if (newItem.trim() && !items.includes(newItem.trim())) {
            onAdd(newItem.trim());
            setNewItem('');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-[#2c3440] pb-2">
                <h2 className="text-sm font-black text-[#9ab] uppercase tracking-widest">Bucket List</h2>
                <span className="text-[10px] font-black text-[#567] uppercase">{items.length} destinations</span>
            </div>

            {/* Add new item */}
            <div className="flex gap-3">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="Add a dream destination..."
                    className="flex-1 bg-[#2c3440] px-4 py-3 rounded-sm text-sm font-medium text-white placeholder-[#567] outline-none focus:ring-2 focus:ring-[#00e054]/50"
                />
                <Button variant="primary" onClick={handleAdd} disabled={!newItem.trim()}>
                    <i className="fas fa-plus"></i> Add
                </Button>
            </div>

            {/* Bucket list items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.length > 0 ? items.map((item, index) => (
                    <div
                        key={index}
                        className="bg-[#1b2228] p-4 rounded border border-[#2c3440] hover:border-[#00e054]/30 transition-all group relative"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <i className="fas fa-map-marker-alt text-[#ff8000]"></i>
                                <span className="text-white font-bold">{item}</span>
                            </div>
                            <button
                                onClick={() => onRemove(item)}
                                className="text-[#567] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                title="Remove from bucket list"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-16 text-center border border-dashed border-[#2c3440] rounded">
                        <i className="fas fa-globe-americas text-[#2c3440] text-4xl mb-4"></i>
                        <p className="text-[#567] text-sm font-bold uppercase tracking-widest">No destinations yet</p>
                        <p className="text-[#456] text-xs mt-2">Add your dream travel destinations above!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
