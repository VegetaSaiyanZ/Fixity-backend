import path from "path";
import dotenv from "dotenv";

type NodeEnv = "development" | "test" | "production";

type EnvVars = {
  readonly NODE_ENV: NodeEnv;
  readonly PORT: number;
  readonly DATABASE_URL: string;
  readonly JWT_SECRET: string;
  readonly JWT_EXPIRES_IN: number;
  readonly JWT_REFRESH_EXPIRES_IN: number;
  readonly GEMINI_API_KEY: string;
};

export class EnvHandler implements EnvVars {
  private static _instance: EnvHandler;

  readonly NODE_ENV: NodeEnv;
  readonly PORT: number;
  readonly DATABASE_URL: string;
  readonly JWT_SECRET: string;
  readonly JWT_EXPIRES_IN: number;
  readonly JWT_REFRESH_EXPIRES_IN: number;
  readonly GEMINI_API_KEY: string;

  private constructor() {
    dotenv.config();

    this.NODE_ENV = this.asRequiredString("NODE_ENV");

    console.log(`Loaded environment variables for NODE_ENV=${this.NODE_ENV}`);

    this.PORT = this.asInt("PORT", 3000);
    this.DATABASE_URL = this.asRequiredString("DATABASE_URL");
    this.JWT_SECRET = this.asRequiredString("JWT_SECRET");
    if (this.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters long");
    }
    this.JWT_EXPIRES_IN = this.asInt("JWT_EXPIRES_IN", 3600);
    this.JWT_REFRESH_EXPIRES_IN = this.asInt("JWT_REFRESH_EXPIRES_IN", 86400);
    this.GEMINI_API_KEY = this.asRequiredString("GEMINI_API_KEY");
  }

  public static get instance(): EnvHandler {
    if (!EnvHandler._instance) {
      EnvHandler._instance = new EnvHandler();
    }
    return EnvHandler._instance;
  }

  private asRequiredString<T extends string>(name: string): T {
    const value = process.env[name];
    if (!value) {
      throw new Error(
        `Missing environment variable: ${name} in ${this.NODE_ENV} file`,
      );
    }
    return value as T;
  }

  private asInt(name: string, placeholder: number): number {
    const valueAsString = process.env[name];
    if (!valueAsString) {
      return placeholder;
    }
    const value = parseInt(valueAsString);
    if (isNaN(value)) {
      throw new Error(`Invalid integer for ${name}: ${valueAsString}`);
    }
    return value;
  }
}
