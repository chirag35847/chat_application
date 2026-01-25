import crypto from 'crypto';

export const generateRSAKeyPair = () => {
    return crypto.generateKeyPairSync("rsa", {
        modulusLength: 4096,
        publicKeyEncoding: {
            type: "pkcs1",
            format: "pem",
        },
        privateKeyEncoding: {
            type: "pkcs1",
            format: "pem",
        },
    });
};

export const encryptText = (text, privateKey) => {
    const buffer = Buffer.from(text, 'utf8');
    return crypto.privateEncrypt(privateKey, buffer).toString('base64');
};

export const decryptText = (encryptedText, publicKey) => {
    return crypto.publicDecrypt(publicKey, Buffer.from(encryptedText, 'base64')).toString('utf8');
};
