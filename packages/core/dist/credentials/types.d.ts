/**
 * @module credentials/types
 * W3C Verifiable Credential types for DDC credential storage.
 */
export interface VerifiableCredential {
    '@context': string[];
    type: string[];
    issuer: string;
    issuanceDate: string;
    credentialSubject: {
        id: string;
        [key: string]: unknown;
    };
    proof?: CredentialProof;
}
export interface CredentialProof {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
}
//# sourceMappingURL=types.d.ts.map