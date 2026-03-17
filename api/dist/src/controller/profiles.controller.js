import z from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../models/index.js";
import { getShortId } from "../lib/utils.js";
import { distanceKm } from "./utils.js";
/* ===============================
   GET USER ALIKE
================================ */
export async function getUserAlike(req, res) {
    // CURRENT USER
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
    }));
    if (!currentUser || !currentUser.member || !currentUser.city) {
        return res.status(404).json({ error: "User not found or incomplete profile" });
    }
    const currentMember = currentUser.member;
    const now = new Date();
    // QUERY FILTERS
    const ageMinQuery = req.query.ageMin ? Number(req.query.ageMin) : undefined;
    const ageMaxQuery = req.query.ageMax ? Number(req.query.ageMax) : undefined;
    const cityIdQueryRaw = req.query.city_id ? Number(req.query.city_id) : undefined;
    const cityIdQuery = Number.isFinite(cityIdQueryRaw) ? cityIdQueryRaw : undefined;
    const interestsQuery = req.query.interests
        ? String(req.query.interests).split(",").map((i) => i.trim()).filter(Boolean)
        : [];
    const effectiveAgeMin = ageMinQuery ?? currentMember.age_min;
    const effectiveAgeMax = ageMaxQuery ?? currentMember.age_max;
    // AGE BOUNDS
    const oldestDob = new Date(now);
    oldestDob.setFullYear(now.getFullYear() - effectiveAgeMax);
    const youngestDob = new Date(now);
    youngestDob.setFullYear(now.getFullYear() - effectiveAgeMin);
    // REFERENCE CITY
    const filterCity = cityIdQuery
        ? await prisma.city.findUnique({ where: { id: cityIdQuery } })
        : null;
    // Si on a un city_id mais qu'il n'existe pas en DB => erreur claire (au lieu de fallback silencieux)
    if (cityIdQuery && !filterCity) {
        return res.status(400).json({ error: "city_id not found", city_id: cityIdQuery });
    }
    const referenceCity = filterCity ?? currentUser.city;
    // USERS CANDIDATES
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
    }));
    /*
       INTÉRÊTS DE RÉFÉRENCE POUR LE SCORE
       - si l'utilisateur a choisi des intérêts dans l'URL: on score dessus
       - sinon on score sur les intérêts du user courant
    */
    const targetInterestNames = interestsQuery.length > 0
        ? interestsQuery
        : currentUser.interests.map((i) => i.name);
    // SCORING + DISTANCE
    const scoredUsers = users
        .map((u) => {
        if (!u.city || !u.member)
            return null;
        const distance = distanceKm(referenceCity.latitude, referenceCity.longitude, u.city.latitude, u.city.longitude);
        // SCORE DISTANCE: sert à départager quand pas de filtre ville
        // Quand city_id est présent, on triera d'abord par distance (plus sûr).
        const distanceScore = Math.max(0, 2000 - distance * 3);
        // SCORE INTÉRÊTS (cohérent: name vs name)
        let commonInterests = 0;
        for (const interest of u.interests) {
            if (targetInterestNames.includes(interest.name)) {
                commonInterests++;
            }
        }
        const interestScore = commonInterests * 20;
        // SCORE RELATION
        const relationScore = u.member.relation_type === currentMember.relation_type ? 30 : 0;
        const totalScore = distanceScore + interestScore + relationScore;
        // calcul âge
        const dob = new Date(u.member.date_of_birth);
        let age = now.getFullYear() - dob.getFullYear();
        const m = now.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate()))
            age--;
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
        .filter((u) => u !== null);
    /*
       SORT & LIMIT
       - si city_id est présent: PLUS PROCHE D'ABORD (exactement ce que tu veux)
       - sinon: score global
    */
    if (cityIdQuery) {
        scoredUsers.sort((a, b) => {
            const d = a.distance_km - b.distance_km;
            if (d !== 0)
                return d;
            return b.score - a.score;
        });
    }
    else {
        scoredUsers.sort((a, b) => b.score - a.score);
    }
    return res.status(200).json(scoredUsers.slice(0, 5));
}
// GET MY PROFILE
export async function getMyProfile(req, res) {
    const userId = req.userId;
    const user = await prisma.user.findFirst({
        where: { id: userId, active: true },
        include: {
            city: true,
            member: true,
            interests: true,
            event: true,
        },
    });
    if (!user) {
        return res.status(404).json({ message: "Profil introuvable" });
    }
    res.json({
        shortId: getShortId(user.id),
        name: user.name,
        city: user.city,
        profile_picture: user.profile_picture,
        bio: user.bio,
        verified: user.verified,
        interests: user.interests,
        isOwner: true,
        events: user.event,
    });
}
// GET PROFILE BY SHORT ID
export async function getProfileByShortId(req, res) {
    const shortId = req.params.shortId;
    const currentUserId = req.userId;
    const user = await prisma.user.findFirst({
        where: {
            id: { endsWith: shortId },
            active: true,
        },
        include: {
            city: true,
            member: true,
            interests: true,
            event: true,
        },
    });
    if (!user) {
        return res.status(404).json({ message: "Profil introuvable" });
    }
    res.json({
        shortId,
        name: user.name,
        city: user.city,
        profile_picture: user.profile_picture,
        bio: user.bio,
        verified: user.verified,
        interests: user.interests,
        isOwner: user.id === currentUserId,
        events: user.event,
    });
}
// UPDATE PROFILE
export async function updateProfile(req, res) {
    const userId = req.userId;
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
