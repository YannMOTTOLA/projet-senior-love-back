import type { Request, Response } from "express";
import z from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../models/index.ts";
import { getShortId } from "../lib/utils.ts";
import { distanceKm } from "./utils.ts";
import argon2 from "argon2";

/* ===============================
   TYPES
================================ */

type UserWithRelations = Prisma.UserGetPayload<{
    include: {
        city: true;
        member: true;
        interests: true;
    };
}>;

/* ===============================
   GET USER ALIKE
================================ */

export async function getUserAlike(req: Request, res: Response) {
    const shortId = req.params.id;

    const currentUser = (await prisma.user.findFirst({
        where: {
            id: { endsWith: shortId },
            active: true,
        },
        include: {
            city: true,
            member: true,
            interests: true,
        },
    })) as UserWithRelations | null;

    if (!currentUser || !currentUser.member || !currentUser.city) {
        return res.status(404).json({ error: "User not found or incomplete profile" });
    }

    const currentMember = currentUser.member;
    const now = new Date();

    const ageMinQuery = req.query.ageMin ? Number(req.query.ageMin) : undefined;
    const ageMaxQuery = req.query.ageMax ? Number(req.query.ageMax) : undefined;

    const cityIdQueryRaw = req.query.city_id ? Number(req.query.city_id) : undefined;
    const cityIdQuery = Number.isFinite(cityIdQueryRaw) ? cityIdQueryRaw : undefined;

    const interestsQuery = req.query.interests
        ? String(req.query.interests).split(",").map((i) => i.trim()).filter(Boolean)
        : [];

    const effectiveAgeMin = ageMinQuery ?? currentMember.age_min;
    const effectiveAgeMax = ageMaxQuery ?? currentMember.age_max;

    const oldestDob = new Date(now);
    oldestDob.setFullYear(now.getFullYear() - effectiveAgeMax);

    const youngestDob = new Date(now);
    youngestDob.setFullYear(now.getFullYear() - effectiveAgeMin);

    const filterCity = cityIdQuery
        ? await prisma.city.findUnique({ where: { id: cityIdQuery } })
        : null;

    if (cityIdQuery && !filterCity) {
        return res.status(400).json({ error: "city_id not found", city_id: cityIdQuery });
    }

    const referenceCity = filterCity ?? currentUser.city;

    const users = (await prisma.user.findMany({
        where: {
            id: { not: currentUser.id },
            active: true,
            member: {
                is: {
                    date_of_birth: {
                        gte: oldestDob,
                        lte: youngestDob,
                    },
                },
            },
        },
        include: {
            city: true,
            member: true,
            interests: true,
        },
    })) as UserWithRelations[];

    const targetInterestNames =
        interestsQuery.length > 0
            ? interestsQuery
            : currentUser.interests.map((i) => i.name);

    const scoredUsers = users
        .map((u) => {
            if (!u.city || !u.member) return null;

            const distance = distanceKm(
                referenceCity.latitude,
                referenceCity.longitude,
                u.city.latitude,
                u.city.longitude
            );

            const distanceScore = Math.max(0, 2000 - distance * 3);

            let commonInterests = 0;
            for (const interest of u.interests) {
                if (targetInterestNames.includes(interest.name)) {
                    commonInterests++;
                }
            }
            const interestScore = commonInterests * 20;

            const relationScore =
                u.member.relation_type === currentMember.relation_type ? 30 : 0;

            const totalScore = distanceScore + interestScore + relationScore;

            const dob = new Date(u.member.date_of_birth);
            let age = now.getFullYear() - dob.getFullYear();
            const m = now.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;

            return {
                id: u.id,
                shortId: getShortId(u.id),
                name: u.name,
                city: u.city,
                profile_picture: u.profile_picture,
                bio: u.bio,
                verified: u.verified,
                interests: u.interests,
                member: {
                    ...u.member,
                    age: u.member.show_age ? age : null,
                },
                distance_km: Number(distance.toFixed(1)),
                score: Math.round(totalScore),
                commonInterests,
            };
        })
        .filter((u): u is NonNullable<typeof u> => u !== null);

    if (cityIdQuery) {
        scoredUsers.sort((a, b) => {
            const d = a.distance_km - b.distance_km;
            if (d !== 0) return d;
            return b.score - a.score;
        });
    } else {
        scoredUsers.sort((a, b) => b.score - a.score);
    }

    return res.status(200).json(scoredUsers.slice(0, 9));
}

/* ===============================
   PROFILE
================================ */

/*
  Enrichit les évènements avec des informations calculées
  à partir des participants :
  - nombre de participants actuels
  - places restantes
  - participation de l’utilisateur courant
  - normalisation de la ville
*/
async function enrichEvents(events: any[], currentUserId?: string) {
    return events.map((event) => {
        const current_participants = event.participants.length;

        return {
            ...event,
            city: event.city?.name ?? "",
            current_participants,
            available_spots: event.max_participants - current_participants,
            is_participant: currentUserId
                ? event.participants.some(
                    (u: any) => u.id === currentUserId
                )
                : false,
        };
    });
}

export async function getMyProfile(req: Request, res: Response) {
    const userId = req.userId!;

    const user = await prisma.user.findFirst({
        where: { id: userId, active: true },
        include: {
            city: true,
            member: true,
            interests: true,
            event: {
                include: {
                    city: true,
                    participants: {
                        select: { id: true },
                    },
                },
            },
            participants: {
                include: {
                    city: true,
                    participants: {
                        select: { id: true },
                    },
                },
            },
        },
    });

    if (!user) {
        return res.status(404).json({ message: "Profil introuvable" });
    }

    const allEvents = [...user.event, ...user.participants];
    const uniqueEvents = Array.from(new Map(allEvents.map((e) => [e.id, e])).values());

    const events = await enrichEvents(uniqueEvents, userId);

    res.json({
        shortId: getShortId(user.id),
        name: user.name,
        city: user.city,
        profile_picture: user.profile_picture,
        bio: user.bio,
        verified: user.verified,
        interests: user.interests,
        isOwner: true,
        events,
    });
}


export async function getProfileByShortId(req: Request, res: Response) {
    const shortId = req.params.shortId;
    const currentUserId = req.userId!;

    const user = await prisma.user.findFirst({
        where: {
            id: { endsWith: shortId },
            active: true,
        },
        include: {
            city: true,
            member: true,
            interests: true,
            event: {
                include: {
                    city: true,
                    participants: {
                        select: { id: true },
                    },
                },
            },
            participants: {
                include: {
                    city: true,
                    participants: {
                        select: { id: true },
                    },
                },
            },
        },
    });

    if (!user) {
        return res.status(404).json({ message: "Profil introuvable" });
    }

    const isOwner = user.id === currentUserId;

    const rawEvents = isOwner
        ? [...user.event, ...user.participants]
        : user.event;

    const uniqueEvents = Array.from(
        new Map(rawEvents.map((e) => [e.id, e])).values()
    );

    const events = await enrichEvents(uniqueEvents, currentUserId);

    res.json({
        shortId,
        name: user.name,
        city: user.city,
        profile_picture: user.profile_picture,
        bio: user.bio,
        verified: user.verified,
        interests: user.interests,
        isOwner,
        events,
    });
}


/* ===============================
   UPDATE / DELETE
================================ */

export async function updateProfile(req: Request, res: Response) {
    const userId = req.userId!;

    const schema = z.object({
        bio: z.string().optional(),
        city_id: z.number().optional(),
        profile_picture: z.string().optional(),
    });

    const data = schema.parse(req.body);

    await prisma.user.update({
        where: { id: userId },
        data,
    });

    res.json({ success: true });
}

export async function deleteProfile(req: Request, res: Response) {
    const userId = req.userId!;

    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            active: true,
            role: { name: "member" },
        },
        include: {
            member: true,
            refresh_token: true,
        },
    });

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    const originalName = user.name;

    await prisma.$transaction(async (tx) => {
        await tx.refreshToken.deleteMany({
            where: { user_id: user.id },
        });

        const anonymizedPassword = await argon2.hash(`${user.id}`);

        await tx.user.update({
            where: { id: user.id },
            data: {
                name: "Membre supprimé",
                email: `deleted+${user.id}@deleted.local`,
                password: anonymizedPassword,
                profile_picture: "/deleted-profile.png",
                bio: null,
                active: false,
                deleted_at: new Date(),
                banned_until: null,
                interests: { set: [] },
            },
        });

        if (user.member) {
            await tx.member.update({
                where: { user_id: user.id },
                data: {
                    phone_number: `deleted_${user.id}`,
                    relation_type: "amicale",
                    age_min: 0,
                    age_max: 0,
                    show_age: false,
                    visibility: "offline",
                },
            });
        }
    });

    return res.status(200).json({
        message: `Utilisateur "${originalName}" anonymisé et désactivé`,
        id: user.id,
        shortId: getShortId(user.id),
    });
}
