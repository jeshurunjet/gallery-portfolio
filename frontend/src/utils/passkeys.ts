type JsonObject = Record<string, unknown>;

function decodeBase64Url(value: string): ArrayBuffer {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  return bytes.buffer;
}

function encodeBase64Url(value: ArrayBuffer): string {
  const bytes = new Uint8Array(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function parseOptions(json: string): JsonObject {
  const parsed = JSON.parse(json) as JsonObject;
  return (parsed.publicKey as JsonObject | undefined) ?? parsed;
}

export function registrationOptionsFromJson(json: string): PublicKeyCredentialCreationOptions {
  const options = parseOptions(json);
  const user = options.user as JsonObject;
  const excludeCredentials = options.excludeCredentials as JsonObject[] | undefined;
  return {
    ...(options as unknown as PublicKeyCredentialCreationOptions),
    challenge: decodeBase64Url(options.challenge as string),
    user: {
      ...(user as unknown as PublicKeyCredentialUserEntity),
      id: decodeBase64Url(user.id as string),
    },
    excludeCredentials: excludeCredentials?.map((credential) => ({
      ...(credential as unknown as PublicKeyCredentialDescriptor),
      id: decodeBase64Url(credential.id as string),
    })),
  };
}

export function authenticationOptionsFromJson(json: string): PublicKeyCredentialRequestOptions {
  const options = parseOptions(json);
  const allowCredentials = options.allowCredentials as JsonObject[] | undefined;
  return {
    ...(options as unknown as PublicKeyCredentialRequestOptions),
    challenge: decodeBase64Url(options.challenge as string),
    allowCredentials: allowCredentials?.map((credential) => ({
      ...(credential as unknown as PublicKeyCredentialDescriptor),
      id: decodeBase64Url(credential.id as string),
    })),
  };
}

export function credentialToJson(credential: PublicKeyCredential): string {
  const response = credential.response;
  const common = {
    id: credential.id,
    rawId: encodeBase64Url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment,
    clientExtensionResults: credential.getClientExtensionResults(),
  };

  if (response instanceof AuthenticatorAttestationResponse) {
    return JSON.stringify({
      ...common,
      response: {
        attestationObject: encodeBase64Url(response.attestationObject),
        clientDataJSON: encodeBase64Url(response.clientDataJSON),
        transports: response.getTransports?.() ?? [],
      },
    });
  }

  const assertion = response as AuthenticatorAssertionResponse;
  return JSON.stringify({
    ...common,
    response: {
      authenticatorData: encodeBase64Url(assertion.authenticatorData),
      clientDataJSON: encodeBase64Url(assertion.clientDataJSON),
      signature: encodeBase64Url(assertion.signature),
      userHandle: assertion.userHandle ? encodeBase64Url(assertion.userHandle) : null,
    },
  });
}

export function passkeysSupported(): boolean {
  return window.isSecureContext && "PublicKeyCredential" in window;
}
