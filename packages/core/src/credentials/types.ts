/**
 * @module credentials/types
 * W3C Verifiable Credential types for DDC credential storage.
 */

export interface VerifiableCredential {
  '@context': string[];
  type: string[];
  issuer: string; // wallet address of issuer
  issuanceDate: string; // ISO 8601
  credentialSubject: {
    id: string; // wallet address of subject
    [key: string]: unknown;
  };
  proof?: CredentialProof;
}

export interface CredentialProof {
  type: string; // 'Ed25519Signature2020'
  created: string;
  verificationMethod: string; // issuer address
  proofPurpose: string; // 'assertionMethod'
  proofValue: string; // hex signature
}
