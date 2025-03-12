import { JWTPayload } from "jose";

export interface SessionPayload extends JWTPayload {
  sessionId: string;
  userId: string;
  memberId: string;
  organisationId: string;
}

export interface InvitePayload extends JWTPayload {
  email: string;
  organisationId: string;
}
