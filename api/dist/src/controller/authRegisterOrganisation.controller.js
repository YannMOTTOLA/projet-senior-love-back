import axios from "axios";
import argon2 from "argon2";
import z from "zod";
import { passwordValidationSchema } from "./utils.js";
import { prisma } from "../models/index.js";
import { config } from "../../config.js";
import { ConflictError } from "../lib/errors.js";
const SIRENE_API_URL = "https://api.insee.fr/api-sirene/3.11/siret";
const SIRENE_API_TOKEN = config.sirene;
const SIRENE_DEFAULT_DATE = "2999-12-31";
const verifySiretParamsSchema = z.object({
    siret: z.string().regex(/^\d{14}$/),
});
export async function verifySiret(req, res) {
    const { siret } = await verifySiretParamsSchema.parseAsync(req.params);
    try {
        const { data } = await axios.get(`${SIRENE_API_URL}/${siret}`, {
            headers: {
                accept: "application/json",
                "X-INSEE-Api-Key-Integration": SIRENE_API_TOKEN,
            },
            params: { date: SIRENE_DEFAULT_DATE },
            timeout: 5000,
        });
        const etablissement = data?.etablissement;
        if (!etablissement) {
            return res.status(404).json({ valid: false, message: "SIRET not found" });
        }
        const uniteLegale = etablissement.unite_legale ?? {};
        const adresse = etablissement.adresse ?? {};
        const name = uniteLegale.denomination ??
            uniteLegale.denomination_usuelle1 ??
            uniteLegale.denomination_usuelle2 ??
            uniteLegale.nom_usage ??
            uniteLegale.nom_complet ??
            null;
        const address = [
            adresse.numero_voie,
            adresse.indice_repetition_voie,
            adresse.type_voie,
            adresse.libelle_voie,
        ]
            .filter((p) => typeof p === "string" && p.trim().length > 0)
            .join(" ")
            .trim();
        return res.status(200).json({
            valid: true,
            siret,
            name,
            address: address.length ? address : null,
            postal_code: adresse.code_postal ?? null,
            city: adresse.libelle_commune ?? null,
            activity_code: etablissement.activite_principale ?? null,
            registered_at: etablissement.date_creation ?? null,
            source: "sirene",
        });
    }
    catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return res.status(404).json({ valid: false, message: "SIRET not found" });
        }
        return res.status(502).json({
            valid: false,
            message: "Unable to verify SIRET at the moment",
        });
    }
}
export async function registerOrganisation(req, res) {
    const registerOrganisationBodySchema = z.object({
        name: z.string().min(1),
        email: z.email(),
        password: passwordValidationSchema,
        city_id: z.number(),
        city_name: z.string(),
        postal_code: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        department_code: z.string(),
        department_name: z.string(),
        creation_date: z.coerce.date(),
        siret: z.string().regex(/^\d{14}$/),
        logo_url: z.string().url().optional(),
    });
    const { name, email, password, city_id, city_name, postal_code, latitude, longitude, department_code, department_name, creation_date, siret, logo_url, } = await registerOrganisationBodySchema.parseAsync(req.body);
    const now = new Date();
    if (creation_date > now) {
        return res.status(422).json({
            error: "creation_date cannot be in the future",
        });
    }
    const alreadyExistingUser = await prisma.user.findFirst({ where: { email } });
    if (alreadyExistingUser)
        throw new ConflictError("Email already taken");
    const alreadyExistingOrganization = await prisma.organization.findFirst({
        where: { siret },
    });
    if (alreadyExistingOrganization) {
        throw new ConflictError("SIRET already taken");
    }
    const role = await prisma.role.findFirst({
        where: { name: "organization" },
    });
    if (!role)
        throw new Error("Role 'organization' not found in database");
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
    const hashedPassword = await argon2.hash(password);
    const normalizedCreationDate = new Date(creation_date);
    const createdUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role_id: role.id,
            city_id: city.id,
            profile_picture: logo_url ?? "/default-profile.png",
        },
    });
    await prisma.organization.create({
        data: {
            user_id: createdUser.id,
            siret,
            created_at: normalizedCreationDate,
        },
    });
    res.status(201).json({
        id: createdUser.id,
        full_name: createdUser.name,
        email: createdUser.email,
        city: city.name,
        postal_code: city.postal_code,
        role: "organization",
        siret,
        creation_date: normalizedCreationDate,
        verification_status: "pending",
    });
}
