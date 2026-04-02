import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const checkBotId = vi.fn();

vi.mock("botid/server", () => ({
  checkBotId
}));

describe("BotID helper", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("blocks unverified bots", async () => {
    checkBotId.mockResolvedValue({
      bypassed: false,
      isBot: true,
      isHuman: false,
      isVerifiedBot: false
    });

    const { verifyBotIdRequest } = await import("@/lib/botId");
    const response = await verifyBotIdRequest(new NextRequest("http://localhost/api/blog"));

    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toMatchObject({
      error: "Bot detected. Access denied."
    });
  });

  it("allows verified bots", async () => {
    checkBotId.mockResolvedValue({
      bypassed: false,
      isBot: true,
      isHuman: false,
      isVerifiedBot: true
    });

    const { verifyBotIdRequest } = await import("@/lib/botId");
    const response = await verifyBotIdRequest(new NextRequest("http://localhost/api/blog"));

    expect(response).toBeNull();
  });

  it("allows explicit service callers on routes that opt into that bypass", async () => {
    const { verifyBotIdRequest } = await import("@/lib/botId");
    const response = await verifyBotIdRequest(
      new NextRequest("http://localhost/api/blog/generate", {
        headers: {
          authorization: "Bearer cron-secret"
        }
      }),
      { allowAuthorizedServiceRequest: true }
    );

    expect(response).toBeNull();
    expect(checkBotId).not.toHaveBeenCalled();
  });
});
