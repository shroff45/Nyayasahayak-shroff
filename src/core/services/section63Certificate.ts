/**
 * section63Certificate.ts — the BSA s.63(4) certificate as a document.
 *
 * `Section63CertificateGenerator` collects Part A field by field but had no way to render it: the
 * "Download Part A (PDF)" button in the wizard had no handler and there is no PDF library in this
 * tree. Rather than pretend, this module emits the certificate as plain text — which is what a
 * police station can actually print, diff and re-verify — and nothing else.
 *
 * Two decisions worth knowing before you change this file:
 *
 * 1. Part B is issued as a BLANK for the forensic expert, pre-filled only with what the expert will
 *    verify against (the exhibit id and the digest held in the ledger). The officer completing Part
 *    A cannot attest to the expert's findings; a generator that printed a filled Part B would be
 *    fabricating the second half of a statutory certificate.
 * 2. Every value is written from the explicit field, never from `JSON.stringify(partA)`. The
 *    Schedule asks for named particulars, so the renderer names them, and a test can assert that a
 *    particular survived the trip.
 *
 * Imports here carry `.ts` on purpose: `npm test` runs this file through
 * `node --experimental-strip-types` without a bundler, and extensionless specifiers do not resolve
 * there. Do not "tidy" them.
 */
import type { Section63PartA } from '../../types/evidence.types.ts';

/**
 * The printed `Generated:` line is the Part A signing time unless the caller overrides it. That is
 * deliberate: the page hashes this document to put its digest in the ledger, and the officer
 * downloads it a minute later. A `new Date()` in here would make those two renderings differ by a
 * second and the published digest would match nothing.
 */
export interface Section63DocumentMeta {
    /** Exhibit this certificate belongs to; printed so the two cannot drift apart silently. */
    evidenceId: string;
    fileName?: string;
    fileSize?: number;
    caseId?: string;
    /**
     * One or two lines naming where this certificate sits in the tamper-evident journal, e.g.
     * "record #7 of 9, anchored at #8 (Merkle root 9f2c…)". Produced by the caller, because the
     * certificate itself has no business knowing about the ledger.
     */
    ledgerLines?: string[];
    generatedAt?: Date;
}

const YES_NO = (value: boolean): string => (value ? 'Yes' : 'No');

const field = (label: string, value: unknown, fallback = '— not provided —'): string => {
    const text = typeof value === 'string' ? value.trim() : value === 0 ? '0' : value;
    return `${label.padEnd(38)}: ${text === undefined || text === null || text === '' ? fallback : String(text)}`;
};

/** The Schedule's Part A items, in the order the form asks for them. */
export function formatPartA(partA: Section63PartA, meta: Section63DocumentMeta): string {
    const device = partA.deviceMetadata ?? ({} as Section63PartA['deviceMetadata']);
    const operational = partA.operationalCertification;
    const lines: string[] = [
        'PART A — CERTIFICATE BY THE PERSON HAVING LAWFUL CONTROL OF THE DEVICE',
        '(first part of the certificate under sub-section (4) of section 63,',
        'Bharatiya Sakshya Adhiniyam, 2023, read with the Schedule thereto)',
        '',
        field('Exhibit / evidence identifier', meta.evidenceId),
        field('Case reference', meta.caseId),
        field('Document certified', meta.fileName),
        typeof meta.fileSize === 'number' && meta.fileSize > 0
            ? field('Size of the document (bytes)', meta.fileSize)
            : field('Size of the document (bytes)', undefined),
        '',
        '1. Particulars of the person producing the record (the deponent)',
        field('        Name', partA.deponentName),
        field('        Designation', partA.designation),
        field('        Badge / ID number', partA.badgeNumber),
        field('        Identification hash', partA.aadhaarHash),
        '',
        '2. Particulars of the device from which the record was produced',
        field('        Source / type of device', partA.deviceSource),
        field('        Make', device.make),
        field('        Model', device.model),
        field('        Serial number', device.serialNumber),
        field('        Unique identifier (IMEI / MAC / account)', device.uniqueId),
        field('        Operating system version', device.osVersion),
        field('        Colour', device.color),
        '',
        '3. Operational certification (section 63(2))',
        field('        Device was operating properly throughout', YES_NO(operational.isDeviceWorkingProperly)),
        operational.isDeviceWorkingProperly
            ? field('        Details of any malfunction', 'Not applicable — device declared in order')
            : field('        Details of any malfunction', operational.malfunctionDetails),
        field('        Period of lawful control', operational.periodOfControl),
        field(
            '        Deponent held lawful control of the device',
            YES_NO(operational.controlAffirmation)
        ),
        '',
        '4. Hash of the electronic record (integrity of the output)',
        field('        Algorithm', partA.hashAlgorithm),
        field('        Hash value', partA.hashValue ? partA.hashValue.toUpperCase() : undefined),
        field('        Certificate signed (device clock)', partA.signatureTimestamp.toISOString()),
        field('        Digital signature reference', partA.digitalSignature),
    ];
    return lines.join('\n');
}

/**
 * Part B, issued blank. Only the fields the expert must be told about in advance are filled: what
 * to hash, and which exhibit the certificate covers.
 */
export function formatPartB(partA: Section63PartA, meta: Section63DocumentMeta): string {
    return [
        'PART B — CERTIFICATE BY THE EXPERT (to be completed by the Forensic Science Laboratory)',
        '(second part of the certificate under sub-section (4) of section 63, read with the Schedule)',
        '',
        'Issued to the expert together with the electronic record identified below. The officer',
        'producing the record does not attest to any of the following; they are for the expert.',
        '',
        field('Exhibit / evidence identifier', meta.evidenceId),
        field('Document submitted', meta.fileName),
        field('Hash to be verified against', partA.hashValue ? partA.hashValue.toUpperCase() : undefined),
        field('Algorithm used by the producing officer', partA.hashAlgorithm),
        '',
        field('        Name of the expert', undefined),
        field('        Designation', undefined),
        field('        Organisation / laboratory', undefined),
        field('        Method of verification applied', undefined),
        field('        Whether the hashes match', undefined),
        field('        Date and time of verification', undefined),
        field('        Remarks', undefined),
        field('        Signature / registration number', undefined),
    ].join('\n');
}

/**
 * The whole certificate: Part A, an empty Part B for the expert, the ledger coordinates, and the
 * limits of what this document proves. The last block is not boilerplate to be deleted — a
 * section 63(4) certificate establishes integrity of an output, not who seized it, and the
 * document should not imply otherwise.
 */
export function formatSection63Certificate(
    partA: Section63PartA,
    meta: Section63DocumentMeta
): string {
    const generatedAt = (meta.generatedAt ?? partA.signatureTimestamp).toISOString();
    return [
        'BNS / BSA 2023 — CERTIFICATE UNDER SECTION 63(4)',
        '=================================================',
        `Generated: ${generatedAt}`,
        '',
        formatPartA(partA, meta),
        '',
        formatPartB(partA, meta),
        '',
        'LEDGER COORDINATES',
        '-------------------------------------------------',
        ...(meta.ledgerLines?.length ? meta.ledgerLines.map((line) => `  ${line}`) : ['  Not recorded in a ledger.']),
        '',
        'WHAT THIS DOCUMENT ESTABLISHES',
        '  That the electronic record named above produced the hash stated in Part A when it was',
        '  computed on the device described, at the stated time, by the stated person, and (where',
        '  ledger coordinates are given) that those particulars were written to a tamper-evident',
        '  journal whose contents can be re-checked offline against a signed Merkle anchor.',
        '',
        'WHAT IT DOES NOT ESTABLISH',
        '  That a court will admit the record; that the deponent is who they claim to be beyond the',
        '  key this browser holds; or that the exhibit was never out of the deponent\'s hands between',
        '  the events recorded in the custody chain. Part B is outstanding until the expert signs it.',
        '',
        'Fields follow the Schedule to the Bharatiya Sakshya Adhiniyam, 2023 as this project reads',
        'it. Check the wording against the Gazette text before filing.',
    ].join('\n');
}

/** Browser-only: hand a string to the operating system as a file. */
export function downloadTextFile(fileName: string, text: string): void {
    if (typeof document === 'undefined') return;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
}

export const section63FileName = (evidenceId: string, extension = 'txt'): string =>
    `BSA63_${evidenceId.replace(/[^A-Za-z0-9._-]/g, '_')}.${extension}`;
