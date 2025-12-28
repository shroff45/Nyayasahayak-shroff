import React from 'react';

interface NyayaChitraProps {
    legalText: string;
    language?: string;
}

const NyayaChitra: React.FC<NyayaChitraProps> = ({ legalText }) => {
    return (
        <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-gray-500">
            <h4 className="font-bold mb-2">Nyaya Chitra Placeholder</h4>
            <p className="text-sm">Visual Justice Component</p>
            <div className="mt-2 text-xs text-left bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {legalText}
            </div>
        </div>
    );
};

export default NyayaChitra;
