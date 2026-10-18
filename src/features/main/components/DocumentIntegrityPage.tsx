/**
 * The routed page for the document integrity check.
 *
 * This file used to be `QuantumFingerprinting.tsx`. It was not a renamed label: the screen asked the
 * language model to "generate a unique quantum cryptographic hash" for a document and rendered the
 * answer as a fingerprint, with `integrityStatus` drawn from a two-value enum whose happy case read
 * "Verified & Secure". Nothing hashed the document. The real check now lives in
 * `shared/components/DocumentIntegrityCheck.tsx` and its verdict wording in `shared/utils/integrityLookup.ts`;
 * this file only supplies the animation wrapper and the translation function, exactly as the other
 * routed pages do.
 */

import AnimatedPageWrapper from './common/AnimatedPageWrapper';
import DocumentIntegrityCheck from '../../../shared/components/DocumentIntegrityCheck';

interface DocumentIntegrityPageProps {
    t: (key: string) => string;
    onActivity?: (details: string) => void;
}

const DocumentIntegrityPage: React.FC<DocumentIntegrityPageProps> = ({ t, onActivity }) => (
    <AnimatedPageWrapper>
        <DocumentIntegrityCheck t={t} onActivity={onActivity} />
    </AnimatedPageWrapper>
);

export default DocumentIntegrityPage;
