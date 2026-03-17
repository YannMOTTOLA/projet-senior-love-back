import type { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import z from "zod";
import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
} from "../lib/errors.ts";
import { prisma } from "../models/index.ts";

const optionalNonEmptyString = z
    .preprocess(
        (value) => (Array.isArray(value) ? value[0] : value),
        z.string().trim().min(1)
    )
    .optional();

const optionalDate = z
    .preprocess((value) => {
        const raw = Array.isArray(value) ? value[0] : value;
        if (typeof raw !== "string") return undefined;
        if (raw.trim() === "") return undefined;
        return new Date(raw);
    }, z.date())
    .optional();

const listEventsQuerySchema = z.object({
    city: optionalNonEmptyString,
    q: optionalNonEmptyString,
    startFrom: optionalDate,
    startTo: optionalDate,
    status: z.enum(["disponible", "complet", "clos"]).optional(),
    visibility: z.enum(["public", "private"]).optional(),
    scope: z.enum(["mine", "all", "recommended"]).optional(),
});

function normalizeStringArray(value: unknown): string[] {
    if (typeof value === "string") {
        return value
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
    }

    if (Array.isArray(value)) {
        return value
            .flatMap((entry) => (typeof entry === "string" ? entry.split(",") : []))
            .map((x) => x.trim())
            .filter(Boolean);
    }

    return [];
}

function buildVisibilityWhere(
    userId: string,
    requestedVisibility?: "public" | "private"
): Prisma.EventWhereInput {
    if (requestedVisibility === "public") {
        return { visibility: "public" };
    }

    if (requestedVisibility === "private") {
        return {
            visibility: "private",
            OR: [{ user_id: userId }, { participants: { some: { id: userId } } }],
        };
    }

    return {
        OR: [
            { visibility: "public" },
            {
                visibility: "private",
                OR: [{ user_id: userId }, { participants: { some: { id: userId } } }],
            },
        ],
    };
}

const eventListSelect = {
    id: true,
    title: true,
    description: true,
    city: {
        select: {
            id: true,
            name: true,
            postal_code: true,
        }
    },
    start_datetime: true,
    end_datetime: true,
    illustration_url: true,
    max_participants: true,
    _count: { select: { participants: true } },
} satisfies Prisma.EventSelect;

function toEventListItem(event: {
    id: string;
    title: string;
    description: string;
    city: { id: number; name: string; postal_code: string },
    start_datetime: Date;
    end_datetime: Date;
    illustration_url: string | null;
    max_participants: number;
    _count: { participants: number };
    participants?: Array<{ id: string }>;
}) {
    const current_participants = event._count.participants;
    const available_spots = Math.max(0, event.max_participants - current_participants);

    return {
        id: event.id,
        title: event.title,
        description: event.description,
        city: event.city.name,
        start_datetime: event.start_datetime,
        end_datetime: event.end_datetime,
        illustration_url: event.illustration_url,
        max_participants: event.max_participants,
        current_participants,
        available_spots,
        is_participant: Boolean(event.participants?.length),
    };
}

export async function listEvents(req: Request, res: Response) {
    const userId = req.userId;
    if (!userId) {
        throw new UnauthorizedError("Missing userId");
    }

    const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, city: { select: { name: true } }, interests: { select: { id: true } } },
    });

    if (!currentUser) {
        throw new NotFoundError("User not found");
    }

    const query = await listEventsQuerySchema.parseAsync(req.query);

    const rawInterests = req.query.interests;
    const interestsParamProvided = rawInterests !== undefined;
    const interestIdsFromQuery = normalizeStringArray(rawInterests);

    const scope = query.scope ?? "all";

    const isFiltering =
        interestsParamProvided ||
        query.city !== undefined ||
        query.q !== undefined ||
        query.startFrom !== undefined ||
        query.startTo !== undefined ||
        query.status !== undefined ||
        query.visibility !== undefined;

    const requestedInterestIds = interestsParamProvided ? interestIdsFromQuery : undefined;
    const currentUserInterestIds = currentUser.interests.map((i) => i.id);
    const cityFilter = isFiltering ? query.city : currentUser.city?.name;

    const buildWhere = (options: {
        city?: { name: string } | string;
        interestIds?: string[];
    }): Prisma.EventWhereInput => {
        const andConditions: Prisma.EventWhereInput[] = [
            { deleted_at: null },
            buildVisibilityWhere(userId, query.visibility),
        ];

        if (scope === "mine") {
            andConditions.push({ user_id: userId });
        }

        if (options.city) {
            andConditions.push({
                city: {
                    name: { contains: typeof options.city === 'string' ? options.city : options.city.name, mode: "insensitive" }
                }
            });
        }

        if (query.q) {
            andConditions.push({
                OR: [
                    { title: { contains: query.q, mode: "insensitive" } },
                    { description: { contains: query.q, mode: "insensitive" } },
                ],
            });
        }

        if (query.status) {
            andConditions.push({ status: query.status });
        }

        if (query.startFrom || query.startTo) {
            andConditions.push({
                start_datetime: {
                    ...(query.startFrom ? { gte: query.startFrom } : {}),
                    ...(query.startTo ? { lte: query.startTo } : {}),
                },
            });
        }

        if (options.interestIds?.length) {
            andConditions.push({
                interests: { some: { id: { in: options.interestIds } } },
            });
        }

        return { AND: andConditions };
    };

    const fetchEvents = async (where: Prisma.EventWhereInput) => {
        const events = await prisma.event.findMany({
            where,
            orderBy: { start_datetime: "asc" },
            select: {
                ...eventListSelect,
                participants: { where: { id: userId }, select: { id: true } },
            },
        });
        return events.map(toEventListItem);
    };

    if (scope === "all") {
        const events = await fetchEvents(
            buildWhere({ city: query.city, interestIds: requestedInterestIds })
        );
        return res.status(200).json(events);
    }

    if (scope === "mine") {
        const events = await fetchEvents(
            buildWhere({ city: query.city, interestIds: requestedInterestIds })
        );
        return res.status(200).json(events);
    }

    // scope=recommended (par défaut) => si aucun filtre, on personnalise via ville + intérêts, puis fallback
    if (!isFiltering) {
        const firstPass = await fetchEvents(
            buildWhere({ city: currentUser.city, interestIds: currentUserInterestIds })
        );
        if (firstPass.length > 0) {
            return res.status(200).json(firstPass);
        }

        if (currentUser.city) {
            const noCity = await fetchEvents(buildWhere({ interestIds: currentUserInterestIds }));
            if (noCity.length > 0) {
                return res.status(200).json(noCity);
            }
        }

        if (currentUserInterestIds.length > 0) {
            const noCityNoInterests = await fetchEvents(buildWhere({}));
            return res.status(200).json(noCityNoInterests);
        }

        return res.status(200).json([]);
    }

    // scope=recommended avec filtres explicites (ou scope=mine) => on applique seulement les filtres fournis
    const events = await fetchEvents(buildWhere({ city: cityFilter, interestIds: requestedInterestIds }));
    return res.status(200).json(events);
}

const createEventBodySchema = z
    .object({
        title: z.string().trim().min(1),
        description: z.string().trim().min(1),
        address: z.string().trim().min(1),
        postal_code: z.string().trim().min(1),
        city_id: z.coerce.number().int(),
        start_datetime: z.coerce.date(),
        end_datetime: z.coerce.date(),
        max_participants: z.coerce.number().int().min(1),
        illustration_url: z
            .preprocess(
                (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
                z.string().url()
            )
            .optional(),
        visibility: z.enum(["public", "private"]).optional(),
        status: z.enum(["disponible", "complet", "clos"]).optional(),
        interestIds: z.array(z.string().trim().min(1)).optional(),
    })
    .refine((data) => data.start_datetime < data.end_datetime, {
        message: "end_datetime must be after start_datetime",
        path: ["end_datetime"],
    });

export async function createEvent(req: Request, res: Response) {
    const userId = req.userId;
    if (!userId) {
        throw new UnauthorizedError("Missing userId");
    }

    const data = await createEventBodySchema.parseAsync(req.body);

    const interestIds = Array.from(new Set(data.interestIds ?? []));
    const interestsFound = interestIds.length
        ? await prisma.interest.findMany({
            where: { id: { in: interestIds } },
            select: { id: true },
        })
        : [];

    if (interestIds.length && interestsFound.length !== interestIds.length) {
        throw new BadRequestError("One or more interestIds are unknown");
    }

    const created = await prisma.event.create({
        data: {
            user_id: userId,
            title: data.title,
            description: data.description,
            address: data.address,
            city_id: data.city_id,  // ✅ direct, pas de connect
            start_datetime: data.start_datetime,
            end_datetime: data.end_datetime,
            visibility: data.visibility ?? "public",
            max_participants: data.max_participants,
            illustration_url: data.illustration_url,
            status: data.status ?? "disponible",
            ...(interestsFound.length
                ? { interests: { connect: interestsFound.map((i) => ({ id: i.id })) } }
                : {}),
        },
        select: {
            ...eventListSelect,
            participants: { where: { id: userId }, select: { id: true } },
        },
    });

    res.status(201).json(toEventListItem(created));
}

const eventIdParamsSchema = z.object({
    eventId: z.string().trim().min(1),
});

export async function joinEvent(req: Request, res: Response) {
    const userId = req.userId;
    if (!userId) {
        throw new UnauthorizedError("Missing userId");
    }

    const { eventId } = await eventIdParamsSchema.parseAsync(req.params);

    const event = await prisma.event.findFirst({
        where: { id: eventId, deleted_at: null },
        select: {
            ...eventListSelect,
            status: true,
            visibility: true,
            user_id: true,
            participants: { where: { id: userId }, select: { id: true } },
        },
    });

    if (!event) {
        throw new NotFoundError("Event not found");
    }

    if (event.status === "clos") {
        throw new BadRequestError("Event is closed");
    }

    if (event.participants.length) {
        return res.status(200).json(toEventListItem(event));
    }

    if (event.visibility === "private" && event.user_id !== userId) {
        throw new ForbiddenError("Event is private");
    }

    if (event._count.participants >= event.max_participants) {
        throw new ConflictError("Event is full");
    }

    const updated = await prisma.event.update({
        where: { id: eventId },
        data: { participants: { connect: { id: userId } } },
        select: {
            ...eventListSelect,
            participants: { where: { id: userId }, select: { id: true } },
        },
    });

    return res.status(200).json(toEventListItem(updated));
}

export async function leaveEvent(req: Request, res: Response) {
    const userId = req.userId;
    if (!userId) {
        throw new UnauthorizedError("Missing userId");
    }

    const { eventId } = await eventIdParamsSchema.parseAsync(req.params);

    const event = await prisma.event.findFirst({
        where: { id: eventId, deleted_at: null },
        select: {
            ...eventListSelect,
            participants: { where: { id: userId }, select: { id: true } },
        },
    });

    if (!event) {
        throw new NotFoundError("Event not found");
    }

    if (!event.participants.length) {
        return res.status(200).json(toEventListItem(event));
    }

    const updated = await prisma.event.update({
        where: { id: eventId },
        data: { participants: { disconnect: { id: userId } } },
        select: {
            ...eventListSelect,
            participants: { where: { id: userId }, select: { id: true } },
        },
    });

    return res.status(200).json(toEventListItem(updated));
}
