import type { Request, Response } from "express";
import { prisma } from "../models/index.ts";
import { Event_visibility, Status } from "@prisma/client";
import z from "zod";
import { ConflictError, BadRequestError } from "../lib/errors.ts";
import { getShortId } from "../lib/utils.ts";


interface IEvent {
    user_id: string;
    title: string;
    description: string;
    address: string;
    city_id: number;
    city_name: string;
    postal_code: string;
    latitude: number;
    longitude: number;
    department_code: string;
    department_name: string;
    start_datetime: Date;
    end_datetime: Date;
    visibility: Event_visibility;
    max_participants: number;
    illustration_url?: string;
    status: Status;
    interests: string[];
    created_at: Date;

}
// En front pour le schéma zod : 
/**
 * const createEventSchema = z.object({
    title: z.string().min(1, "Le titre ne peut pas être vide"),
    description: z.string().min(1, "La description ne peut pas être vide"),
    adress: z.string().min(1, "L'adresse ne peut pas être vide"),
    city_id: z.number(),
    city_name: z.string().min(1),
    postal_code: z.string().min(1),
    latitude: z.number(),
    longitude: z.number(),
    department_code: z.string().min(1),
    department_name: z.string().min(1),
    start_datetime: z.string().datetime(), // Reçu en string, converti en Date
    end_datetime: z.string().datetime(),
    visibility: z.enum(["public", "private"]),
    max_participants: z.number().int().min(1, "Le nombre de participants doit être au moins 1"),
    illustration_url: z.string().url().optional(),
    interest_ids: z.array(z.number()).min(1, "Au moins un intérêt doit être sélectionné"),
  });
 * 
 */

export async function createEvent(req: Request, res: Response) {
    const createEventschema = z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        address: z.string().min(1),
        city_id: z.number(),
        city_name: z.string(),
        postal_code: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        department_code: z.string(),
        department_name: z.string(),
        start_datetime: z.coerce.date(),
        end_datetime: z.coerce.date(),
        visibility: z.enum(["public", "private"]),
        max_participants: z.number().min(1),
        illustration_url: z.string().min(1).optional(),
        interests: z.array(z.string().min(1)).min(1),
    });

    const {
        title,
        description,
        address,
        city_id,
        city_name,
        postal_code,
        latitude,
        longitude,
        department_code,
        department_name,
        start_datetime,
        end_datetime,
        visibility,
        max_participants,
        illustration_url,
        interests,
    } = await createEventschema.parseAsync(req.body);

    //Récupérer le user_id depuis le JWT
    const userId = req.userId;
    if (!userId) {
        throw new BadRequestError("Vous devez être connecté pour créer un évènement");
    }

    const now = new Date();

    if (start_datetime < now) {
        return res.status(422).json({
            error: "la date et l'heure de commencement doit dépassé la date du jour",
        });
    }
    if (end_datetime < start_datetime) {
        return res.status(422).json({
            error: "la date et/ou l'heure de fin doit dépasser la date du début de l'évènement"
        })
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

    const interestsFound = await prisma.interest.findMany({
        where: { name: { in: interests } },
    });

    const createdEvent = await prisma.event.create({
        data: {
            user_id: userId,
            title,
            description,
            address,
            city_id: city.id,
            start_datetime,
            end_datetime,
            visibility,
            max_participants,
            illustration_url,
            status: "disponible", // Status défini à "disponible" par défaut
            interests: { connect: interestsFound.map((i) => ({ id: i.id })) }
        },
        include: {
            city: true,
            interests: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profile_picture: true,
                },
            },
        },
    });

    res.status(201).json({
        messages: "Votre évènement à bien été créé", createdEvent, shortId: getShortId(createdEvent.id)
        // title,
        // description,
        // address,
        // illustration_url,
        // city: city.name,
        // postal_code: city.postal_code,
        // interests,
        // start_datetime,
        // end_datetime,
        // shortId: getShortId(createdEvent.id),
    })

}