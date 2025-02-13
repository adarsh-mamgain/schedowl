import { JWTPayload } from "jose";

export interface SessionPayload extends JWTPayload {
  sessionId: string;
  userId: string;
  memberId: string;
  organisationId: string;
}
