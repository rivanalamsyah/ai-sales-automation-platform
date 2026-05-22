import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BaileysSessionAdapter {
  constructor(private prisma: PrismaService) {}

  /**
   * Load Baileys session credentials for a given organization.
   */
  async loadSession(organizationId: string) {
    const session = await this.prisma.baileysSession.findUnique({
      where: { organizationId },
    });

    if (!session) {
      return null;
    }

    return {
      creds: JSON.parse(session.creds),
      keys: JSON.parse(session.keys),
    };
  }

  /**
   * Save or update Baileys session credentials for a given organization.
   */
  async saveSession(organizationId: string, creds: any, keys: any = {}) {
    const serializedCreds = JSON.stringify(creds);
    const serializedKeys = JSON.stringify(keys);

    return this.prisma.baileysSession.upsert({
      where: { organizationId },
      update: {
        creds: serializedCreds,
        keys: serializedKeys,
      },
      create: {
        organizationId,
        creds: serializedCreds,
        keys: serializedKeys,
      },
    });
  }

  /**
   * Clear session credentials (on disconnect).
   */
  async clearSession(organizationId: string) {
    return this.prisma.baileysSession.deleteMany({
      where: { organizationId },
    });
  }

  /**
   * Creates a custom Baileys authentication state provider compatible with Baileys authentication flow.
   * This can be passed directly to Baileys startSocket option.
   */
  async usePrismaAuthState(organizationId: string) {
    let creds: any = null;
    let keys: Record<string, any> = {};

    const session = await this.loadSession(organizationId);
    if (session) {
      creds = session.creds;
      keys = session.keys || {};
    } else {
      // Initialize fresh creds (in a real Baileys setup, initCreds() from @whiskeysockets/baileys would be used here)
      creds = this.initFreshCreds();
      await this.saveSession(organizationId, creds, keys);
    }

    return {
      state: {
        creds,
        keys: {
          get: (type: string, ids: string[]) => {
            const data: Record<string, any> = {};
            for (const id of ids) {
              const key = `${type}:${id}`;
              data[id] = keys[key] || null;
            }
            return data;
          },
          set: async (data: any) => {
            for (const category in data) {
              for (const id in data[category]) {
                const value = data[category][id];
                const key = `${category}:${id}`;
                if (value) {
                  keys[key] = value;
                } else {
                  delete keys[key];
                }
              }
            }
            await this.saveSession(organizationId, creds, keys);
          },
        },
      },
      saveCreds: async () => {
        await this.saveSession(organizationId, creds, keys);
      },
    };
  }

  private initFreshCreds() {
    // Generate a skeleton structure compatible with Baileys standard creds
    return {
      noiseKey: {
        private: Buffer.from([]).toString('base64'),
        public: Buffer.from([]).toString('base64'),
      },
      pairingEphemeralKeyPair: {
        private: Buffer.from([]).toString('base64'),
        public: Buffer.from([]).toString('base64'),
      },
      signedIdentityKey: {
        private: Buffer.from([]).toString('base64'),
        public: Buffer.from([]).toString('base64'),
      },
      signedPreKey: {
        keyPair: {
          private: Buffer.from([]).toString('base64'),
          public: Buffer.from([]).toString('base64'),
        },
        signature: Buffer.from([]).toString('base64'),
        keyId: 1,
      },
      registrationId: Math.floor(Math.random() * 10000),
      advSecretKey: Buffer.from([]).toString('base64'),
      processedHistoryMessages: [],
      nextPreKeyId: 1,
      firstUnuploadedPreKeyId: 1,
      accountSettings: {
        unarchiveChats: false,
      },
      registered: false,
    };
  }
}
