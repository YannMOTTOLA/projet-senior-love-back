import argon2 from "argon2";
import z from "zod";
import { passwordValidationSchema } from "./utils.js";
import { prisma } from "../models/index.js";
import { ConflictError } from "../lib/errors.js";
import { getShortId } from "../lib/utils.js";
import { visionClient } from "../services/vision.js";
export async function registerUser(req, res) {
    const registerUserBodySchema = z.object({
        name: z.string().min(1),
        gender: z.enum(["homme", "femme", "autre"]),
        email: z.email(),
        password: passwordValidationSchema,
        phone_number: z.string().min(5),
        date_of_birth: z.coerce.date(),
        city_id: z.number(),
        city_name: z.string(),
        postal_code: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        department_code: z.string(),
        department_name: z.string(),
        profile_picture: z.string().optional(),
        bio: z.string().optional(),
        interests: z.array(z.string().min(1)).min(1),
        age_min: z.number().min(60),
        age_max: z.number().max(110),
        relation_type: z.enum([
            "amicale_homme",
            "amoureuse_homme",
            "les_deux_homme",
            "amicale_femme",
            "amoureuse_femme",
            "les_deux_femme",
            "amicale",
            "amoureuse",
            "les_deux",
        ]),
        show_age: z.boolean().optional(),
    });
    const { name, gender, email, password, phone_number, date_of_birth, city_id, city_name, postal_code, latitude, longitude, department_code, department_name, profile_picture, bio, interests, age_min, age_max, relation_type, show_age, } = await registerUserBodySchema.parseAsync(req.body);
    const now = new Date();
    if (date_of_birth > now) {
        return res.status(422).json({
            error: "date_of_birth cannot be in the future",
        });
    }
    const city = await prisma.city.upsert({
        where: { id: city_id },
        update: {},
        create: {
            id: city_id,
            name: city_name,
            postal_code,
            latitude,
            longitude,
            department: {
                connectOrCreate: {
                    where: { code: department_code },
                    create: {
                        id: Number(department_code),
                        code: department_code,
                        name: department_name,
                    },
                },
            },
        },
    });
    const alreadyExistingUser = await prisma.user.findFirst({ where: { email } });
    if (alreadyExistingUser)
        throw new ConflictError("Email already taken");
    const role = await prisma.role.findFirst({ where: { name: "member" } });
    if (!role)
        throw new Error("Role 'member' not found in database");
    const hashedPassword = await argon2.hash(password);
    if (profile_picture) {
        const [result] = await visionClient.safeSearchDetection({
            image: { source: { imageUri: profile_picture } },
        });
        const safe = result.safeSearchAnnotation;
        if (!safe) {
            return res.status(400).json({ error: "Impossible d'analyser l'image" });
        }
        const adult = Number(safe.adult ?? 0);
        const violence = Number(safe.violence ?? 0);
        const racy = Number(safe.racy ?? 0);
        if (adult >= 4 || violence >= 4 || racy >= 4) {
            return res.status(400).json({ error: "Image interdite par SafeSearch" });
        }
    }
    const interestsFound = await prisma.interest.findMany({
        where: { name: { in: interests } },
    });
    if (interestsFound.length !== interests.length) {
        return res.status(400).json({
            error: "Un ou plusieurs intérêts n'existent pas dans la base.",
        });
    }
    const createdUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role_id: role.id,
            city_id: city.id,
            profile_picture: profile_picture || "/default-profile.png",
            bio,
        },
    });
    await prisma.member.create({
        data: {
            user_id: createdUser.id,
            gender,
            phone_number,
            date_of_birth: new Date(date_of_birth),
            relation_type,
            age_min,
            age_max,
            show_age: show_age ?? true,
        },
    });
    await prisma.user.update({
        where: { id: createdUser.id },
        data: {
            interests: {
                connect: interestsFound.map((i) => ({ id: i.id })),
            },
        },
    });
    res.status(201).json({
        id: createdUser.id,
        full_name: createdUser.name,
        gender,
        profile_picture,
        bio,
        phone_number,
        email: createdUser.email,
        city: city.name,
        postal_code: city.postal_code,
        role: "member",
        interests,
        relation_type,
        age_min,
        age_max,
        shortId: getShortId(createdUser.id),
    });
}
export async function getAllInterests(req, res) {
    const interests = await prisma.interest.findMany();
    res.status(201).json(interests);
}
export async function verifyIfMailAlreadyExist(req, res) {
    const mail = req.params.mail;
    const verifMail = await prisma.user.findUnique({
        where: { email: mail },
    });
    if (verifMail) {
        res.status(409).json({ message: "Email already taken" });
    }
    else {
        res.status(201).json({ message: "Ok" });
    }
}
