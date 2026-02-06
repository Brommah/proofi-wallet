export interface EmailSender {
    sendOtp(email: string, code: string): Promise<void>;
}
export declare class SmtpEmailSender implements EmailSender {
    private transporter;
    private from;
    constructor();
    sendOtp(email: string, code: string): Promise<void>;
}
export declare class GogEmailSender implements EmailSender {
    private from;
    constructor(from: string);
    sendOtp(email: string, code: string): Promise<void>;
}
export declare class ConsoleEmailSender implements EmailSender {
    sendOtp(email: string, code: string): Promise<void>;
}
/** Factory — picks sender based on config */
export declare function createEmailSender(): EmailSender;
//# sourceMappingURL=email.d.ts.map