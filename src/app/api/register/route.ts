import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import prisma from "@/src/lib/prisma";
import { generateUniqueSlug } from "@/src/lib/common";
import { RegisterSchema } from "@/src/schema";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, organisationName } =
      RegisterSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and organization in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      // Generate unique slug
      let slug = generateUniqueSlug(organisationName);
      let slugExists = await tx.organisation.findUnique({
        where: { slug },
      });

      // If slug exists, append random string
      while (slugExists) {
        slug = `${generateUniqueSlug(organisationName)}-${Math.random()
          .toString(36)
          .substring(2, 8)}`;
        slugExists = await tx.organisation.findUnique({
          where: { slug },
        });
      }

      // Create organization
      const organization = await tx.organisation.create({
        data: {
          name: organisationName,
          slug,
          ownerId: user.id,
        },
      });

      // Create organization role for the owner
      await tx.organisationRole.create({
        data: {
          userId: user.id,
          organisationId: organization.id,
          role: Role.OWNER,
        },
      });

      return { user, organization };
    });

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
        },
        organization: {
          id: result.organization.id,
          name: result.organization.name,
          slug: result.organization.slug,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
