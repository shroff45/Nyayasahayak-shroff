import React from 'react';
import { VisualCard } from '../core/types';
import { Image, PlayCircle } from 'lucide-react';

interface VisualJusticeTriggerProps {
    draftText: string;
    onGenerate: (cards: VisualCard[]) => void;
}

const VisualJusticeTrigger: React.FC<VisualJusticeTriggerProps> = ({ draftText, onGenerate }) => {
    const handleGenerate = () => {
        // In a real app, this might call an API. 
        // Here we just trigger the parent to render NyayaChitra with the text.
        // We pass a dummy empty array to signal "start", 
        // but the actual generation happens in NyayaChitra via useEffect.
        // Wait, the parent expects cards to be passed back?
        // The prompt said: "VisualJusticeTrigger... Simple wrapper... onGenerateVisuals"
        // And NyayaChitra takes legalText.
        // So this button just needs to tell the parent "Show the Visual Justice section".
        // But the parent logic in JudgeDashboard is:
        // <VisualJusticeTrigger cards={visualCards} />
        // Wait, the prompt for JudgeDashboard said:
        // {visualCards.length > 0 && <VisualJusticeTrigger cards={visualCards} />}
        // But VisualJusticeTrigger needs to BE the button that generates them.
        // So it should be visible BEFORE cards exist?
        // Let's look at the prompt again.
        // "VisualJusticeTrigger... Props: cards: VisualCard[]... Button 'Generate Visual Summary'... {cards.length > 0 && <NyayaChitra ... />}"
        // Ah, the prompt implies the button is always there, and it renders NyayaChitra inside itself or triggers parent.
        // My JudgeDashboard implementation:
        // <VisualJusticeTrigger draftText={draftOrder} onGenerate={...} />
        // {visualCards.length > 0 && <NyayaChitra ... />}
        // This seems correct.

        // We'll just pass a dummy card to trigger the state in parent, 
        // or better, the parent should handle the generation logic or just set a flag.
        // But NyayaChitra generates cards from text internally.
        // So we just need to render NyayaChitra.
        // So onGenerate should just set some state in parent.
        // I'll pass a dummy array to satisfy the type if needed, or just void.
        // The parent `setVisualCards` expects `VisualCard[]`.
        // But NyayaChitra generates them.
        // Let's change the pattern slightly:
        // This button sets a flag "showVisuals".
        // But the prompt says "Generate Visual Summary" button.
        // I'll make it simple: onGenerate just sets a non-empty array to show the component.
        onGenerate([{ icon: 'dummy', heading: '', description: '', color: 'gray', audioText: '' }]);
    };

    return (
        <div className="visual-justice-panel bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Image className="text-pink-600" /> Visual Justice
            </h3>
            <p className="text-xs text-gray-600 mb-4">
                Generate citizen-friendly visual summary for WhatsApp sharing.
            </p>
            <button
                onClick={handleGenerate}
                disabled={!draftText}
                className="w-full py-2 bg-pink-600 text-white rounded font-bold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <PlayCircle size={16} /> Generate Visual Summary
            </button>
        </div>
    );
};

export default VisualJusticeTrigger;
