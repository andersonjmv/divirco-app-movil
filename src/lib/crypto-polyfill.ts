
import * as ExpoCrypto from "expo-crypto";
import { Platform } from "react-native";

if (Platform.OS !== "web") {
  const existing = globalThis.crypto;

  if (!existing?.subtle?.digest) {
    const digest = async (
      algorithm: AlgorithmIdentifier,
      data: BufferSource
    ): Promise<ArrayBuffer> => {
      const name =
        typeof algorithm === "string"
          ? algorithm
          : algorithm.name;

      if (name !== "SHA-256") {
        throw new Error(
          `Algoritmo no implementado: ${name}`
        );
      }

      return ExpoCrypto.digest(
        ExpoCrypto.CryptoDigestAlgorithm.SHA256,
        data
      );
    };

    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: {
        ...existing,
        getRandomValues: ExpoCrypto.getRandomValues,
        subtle: {
          ...existing?.subtle,
          digest,
        },
      },
    });
  }
}
