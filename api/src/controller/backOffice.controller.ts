import argon2 from "argon2";
import z from "zod";
import type { Request, Response } from "express";
import { prisma } from "../models/index.ts";
import { getShortId } from "../lib/utils.ts";

export async function getAllMembers(req: Request, res: Response) {
    const members = await prisma.user.findMany({
        where: {
            role: { name: "member" },
        },
        select: {
            id: true,
            name: true,
            email: true,
            role_id: true,
            city: {
                select: {
                    id: true,
                    name: true,
                    postal_code: true,
                },
            },
            profile_picture: true,
            verified: true,
            bio: true,
            active: true,
            deleted_at: true,
            created_at: true,
            updated_at: true,
            member: true,
            role: true,
        },
    });

    const membersWithShortId = members.map((member) => ({
        ...member,
        shortId: getShortId(member.id),
    }));

    res.status(200).json(membersWithShortId);
}

export async function getMemberById(req: Request, res: Response) {
    const id = req.params.id;

    const user = await prisma.user.findFirst({
        where: {
            id: { contains: id },
            role: { name: "member" },
        },
        select: {
            id: true,
            name: true,
            email: true,
            role_id: true,
            city: {
                select: {
                    id: true,
                    name: true,
                    postal_code: true,
                },
            },
            profile_picture: true,
            verified: true,
            bio: true,
            active: true,
            deleted_at: true,
            created_at: true,
            updated_at: true,
            member: true,
            role: true,
        },
    });

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
        ...user,
        shortId: getShortId(user.id),
    });
}

export async function getTenLatestMembers(req: Request, res: Response) {
    const members = await prisma.user.findMany({
        where: {
            role: { name: "member" },
        },
        orderBy: { created_at: "desc" },
        take: 10,
        select: {
            id: true,
            name: true,
            email: true,
            role_id: true,
            city: {
                select: {
                    id: true,
                    name: true,
                    postal_code: true,
                },
            },
            profile_picture: true,
            verified: true,
            bio: true,
            active: true,
            deleted_at: true,
            created_at: true,
            updated_at: true,
            member: true,
            role: true,
        },
    });

    const membersWithShortId = members.map((member) => ({
        ...member,
        shortId: getShortId(member.id),
    }));

    res.status(200).json(membersWithShortId);
}

export async function getNumberOfNewMemberLastWeek(req: Request, res: Response) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const count = await prisma.user.count({
        where: {
            role: { name: "member" },
            created_at: { gte: oneWeekAgo },
        },
    });

    res.status(200).json({ newMembersLastWeek: count });
}

export async function desactiveOneMemberfor48Hours(req: Request, res: Response) {
    const id = req.params.id;

    const user = await prisma.user.findFirst({
        where: {
            id: { contains: id },
            role: { name: "member" },
        },
    });

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    if (!user.active) {
        return res.status(400).json({ error: "User Already desactivate" });
    }

    const bannedUntil = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const deactivatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
            active: false,
            banned_until: bannedUntil,
        },
    });

    res.status(200).json({
        message: "User deactivated for 48 hours",
        ...deactivatedUser,
        shortId: getShortId(user.id),
    });
}

export async function desactiveOneMemberfor1Week(req: Request, res: Response) {
    const id = req.params.id;

    const user = await prisma.user.findFirst({
        where: {
            id: { contains: id },
            role: { name: "member" },
        },
    });

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    if (!user.active) {
        return res.status(400).json({ error: "User Already desactivate" });
    }

    const bannedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const deactivatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
            active: false,
            banned_until: bannedUntil,
        },
    });

    res.status(200).json({
        message: "User deactivated for one week",
        ...deactivatedUser,
        shortId: getShortId(user.id),
    });
}

export async function activateOneMember(req: Request, res: Response) {
    const id = req.params.id;

    const user = await prisma.user.findFirst({
        where: {
            id: { contains: id },
            role: { name: "member" },
        },
    });

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    if (user.active) {
        return res.status(400).json({ error: "User Already Active" });
    }

    const userActivate = await prisma.user.update({
        where: { id: user.id },
        data: {
            active: true,
            banned_until: null,
        },
    });

    res.status(200).json({
        ...userActivate,
        shortId: getShortId(user.id),
    });
}

export async function deleteUserByiD(req: Request, res: Response) {
    const id = req.params.id;

    const user = await prisma.user.findFirst({
        where: {
            id: { contains: id },
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

    if (user.refresh_token) {
        await prisma.refreshToken.delete({
            where: { user_id: user.id },
        });
    }

    const anonymizedPassword = await argon2.hash(`${user.id}`);

    const anonymizedUser = await prisma.user.update({
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
        }

    });

    if (user.member) {
        await prisma.member.update({
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


    return res.status(200).json({
        message: `Utilisateur "${originalName}" anonymisé et désactivé`,
        id: user.id,
        shortId: getShortId(user.id),
    });
}

export async function getAllDesactivatedMember(req: Request, res: Response) {
    const users = await prisma.user.findMany({
        where: {
            role: { name: "member" },
            active: false,
            banned_until: { not: null },
        },
        select: {
            id: true,
            name: true,
            email: true,
            role_id: true,
            city: {
                select: {
                    id: true,
                    name: true,
                    postal_code: true,
                },
            },
            profile_picture: true,
            verified: true,
            bio: true,
            active: true,
            banned_until: true,
            deleted_at: true,
            created_at: true,
            updated_at: true,
            member: true,
            role: true,
        },
    });

    const now = new Date();

    const usersWithRemainingTime = users.map((user) => {
        const remainingMs = user.banned_until
            ? user.banned_until.getTime() - now.getTime()
            : null;

        return {
            ...user,
            shortId: getShortId(user.id),
            remaining_time_ms: remainingMs,
            remaining_time_hours: remainingMs
                ? Math.ceil(remainingMs / (1000 * 60 * 60))
                : null,
        };
    });

    return res.status(200).json(usersWithRemainingTime);
}
