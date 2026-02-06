/**
 * @module credentials/CredentialBuilder
 * Builds and signs W3C Verifiable Credentials.
 */
import { u8aToHex } from '@polkadot/util';
/** Wrap a Polkadot KeyringPair as a CredentialSigner */
export function fromPolkadotPair(pair) {
    return {
        sign: (msg) => pair.sign(msg),
        address: pair.address,
    };
}
/**
 * Build a signed Verifiable Credential.
 *
 * @param subjectId - Address/DID of the credential subject
 * @param claims - Key-value claims about the subject
 * @param signer - Signer that will sign the credential
 * @returns A complete VerifiableCredential with proof
 */
export function create(subjectId, claims, signer) {
    const now = new Date().toISOString();
    // Build the credential without proof
    const credential = {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://www.w3.org/2018/credentials/examples/v1',
        ],
        type: ['VerifiableCredential'],
        issuer: signer.address,
        issuanceDate: now,
        credentialSubject: {
            id: subjectId,
            ...claims,
        },
    };
    // Canonical payload to sign (deterministic JSON)
    const payload = canonicalise(credential);
    const payloadBytes = new TextEncoder().encode(payload);
    const signatureBytes = signer.sign(payloadBytes);
    const proof = {
        type: 'Ed25519Signature2020',
        created: now,
        verificationMethod: signer.address,
        proofPurpose: 'assertionMethod',
        proofValue: u8aToHex(signatureBytes),
    };
    return { ...credential, proof };
}
/**
 * Produce a deterministic JSON string of a credential (excluding proof).
 * Uses recursive key sorting for canonical representation.
 */
export function canonicalise(credential) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { proof: _proof, ...rest } = credential;
    return JSON.stringify(sortDeep(rest));
}
/** Recursively sort object keys for deterministic serialisation */
function sortDeep(value) {
    if (Array.isArray(value)) {
        return value.map(sortDeep);
    }
    if (value !== null && typeof value === 'object') {
        const sorted = {};
        for (const key of Object.keys(value).sort()) {
            sorted[key] = sortDeep(value[key]);
        }
        return sorted;
    }
    return value;
}
//# sourceMappingURL=CredentialBuilder.js.map