import argon2 from "argon2";
import z from "zod";
import { prisma } from "../models/index.js";
import { getShortId } from "../lib/utils.js";
import { ConflictError } from "../lib/errors.js";
// schéma de validation pour l'acceptation ou le refus d'une demande de conversation
const updateConversationStatusSchema = z.object({
    status: z.enum(["accepted", "rejected"]),
});
export async function sendRequestById(req, res) {
    // shortId du profil ciblé (utilisé côté front)
    const shortId = req.params.shortId;
    // id complet de l'utilisateur connecté (extrait du token)
    const currentUserId = req.userId;
    // récupération sécurisée du contenu du message (GET sans body possible)
    const content = typeof req.body === "object" && req.body !== null
        ? req.body.content
        : undefined;
    // recherche de l'utilisateur cible à partir du shortId
    const targetUser = await prisma.user.findFirst({
        where: {
            id: { endsWith: shortId },
            active: true,
        },
    });
    if (!targetUser) {
        return res.status(404).json({ message: "Profil introuvable" });
    }
    // sécurité: empêcher l'utilisateur de s'envoyer une demande à lui-même
    if (targetUser.id === currentUserId) {
        return res.status(400).json({ message: "Action impossible" });
    }
    // vérification: empêcher la création de plusieurs conversations entre les mêmes utilisateurs
    const existingConversation = await prisma.conversation.findFirst({
        where: {
            OR: [
                {
                    sender_id: currentUserId,
                    receiver_id: targetUser.id,
                },
                {
                    sender_id: targetUser.id,
                    receiver_id: currentUserId,
                },
            ],
        },
    });
    if (existingConversation) {
        return res
            .status(409)
            .json({ message: "Une conversation existe déjà" });
    }
    // création de la conversation avec un premier message (statut pending)
    const conversation = await prisma.conversation.create({
        data: {
            sender_id: currentUserId,
            receiver_id: targetUser.id,
            status: "pending",
            messages: {
                create: {
                    sender_id: currentUserId,
                    content: content || "Bonjour 👋",
                },
            },
        },
        include: {
            messages: true,
        },
    });
    // retour au front avec confirmation de l'envoi
    return res.status(201).json({
        message: "Demande envoyée",
        conversationId: conversation.id,
    });
}
export async function updateConversationStatus(req, res) {
    // shortId de la conversation
    const shortId = req.params.shortId;
    // id de l'utilisateur connecté
    const currentUserId = req.userId;
    // validation du body (accepted ou rejected uniquement)
    const parsed = updateConversationStatusSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Body invalide" });
    }
    const { status } = parsed.data;
    // récupération de la conversation via le shortId
    const conversation = await prisma.conversation.findFirst({
        where: {
            id: { endsWith: shortId },
        },
    });
    if (!conversation) {
        return res.status(404).json({ message: "Conversation introuvable" });
    }
    // sécurité: seul le receiver peut accepter ou refuser la demande
    if (conversation.receiver_id !== currentUserId) {
        return res.status(403).json({ message: "Non autorisé" });
    }
    // logique métier: on ne peut changer le statut que si la conversation est encore en attente
    if (conversation.status !== "pending") {
        return res.status(409).json({
            message: `Impossible: statut déjà "${conversation.status}"`,
        });
    }
    // mise à jour du statut de la conversation
    const updated = await prisma.conversation.update({
        where: { id: conversation.id },
        data: { status },
    });
    // retour au front avec le nouveau statut
    return res.json({
        message: status === "accepted" ? "Demande acceptée" : "Demande refusée",
        conversation: {
            shortId: getShortId(updated.id),
            status: updated.status,
        },
    });
}
export async function getWaitingRequests(req, res) {
    // id de l'utilisateur connecté
    const userId = req.userId;
    // récupération des demandes en attente reçues par l'utilisateur
    const requests = await prisma.conversation.findMany({
        where: {
            receiver_id: userId,
            status: "pending",
        },
        include: {
            sender: {
                select: {
                    id: true,
                    name: true,
                    profile_picture: true,
                },
            },
            messages: {
                orderBy: { sent_at: "asc" },
                take: 1,
            },
        },
    });
    // transformation de la réponse pour exposer uniquement les données utiles au front
    res.json(requests.map((conv) => ({
        shortId: getShortId(conv.id),
        sender: conv.sender,
        message: conv.messages[0] ?? null,
    })));
}
export async function getConversations(req, res) {
    // id de l'utilisateur connecté
    const userId = req.userId;
    // récupération des conversations acceptées de l'utilisateur
    const conversations = await prisma.conversation.findMany({
        where: {
            status: "accepted",
            OR: [
                { sender_id: userId },
                { receiver_id: userId },
            ],
        },
        include: {
            sender: { select: { id: true, name: true, profile_picture: true } },
            receiver: { select: { id: true, name: true, profile_picture: true } },
            messages: {
                orderBy: { sent_at: "desc" },
                take: 1,
            },
        },
        orderBy: { updated_at: "desc" },
    });
    // formatage de la réponse pour affichage de la liste des conversations
    res.json(conversations.map((conv) => ({
        shortId: getShortId(conv.id),
        sender: conv.sender,
        receiver: conv.receiver,
        lastMessage: conv.messages[0] ?? null,
        updated_at: conv.updated_at,
    })));
}
export async function getConversationMessages(req, res) {
    // id de l'utilisateur connecté
    const userId = req.userId;
    // shortId de la conversation
    const shortId = req.params.shortId;
    // vérification de l'accès à la conversation
    const conversation = await prisma.conversation.findFirst({
        where: {
            id: { endsWith: shortId },
            OR: [
                { sender_id: userId },
                { receiver_id: userId },
            ],
        },
    });
    if (!conversation) {
        return res.status(403).json({ message: "Accès interdit" });
    }
    // récupération de tous les messages de la conversation
    const messages = await prisma.message.findMany({
        where: { conversation_id: conversation.id },
        orderBy: { sent_at: "asc" },
    });
    res.json(messages);
}
export async function sendMessage(req, res) {
    // id de l'utilisateur connecté
    const userId = req.userId;
    // shortId de la conversation
    const shortId = req.params.shortId;
    // contenu du message
    const { content } = req.body;
    // vérification que la conversation existe et est acceptée
    const conversation = await prisma.conversation.findFirst({
        where: {
            id: { endsWith: shortId },
            status: "accepted",
            OR: [
                { sender_id: userId },
                { receiver_id: userId },
            ],
        },
    });
    if (!conversation) {
        return res.status(403).json({ message: "Conversation non active" });
    }
    // création du message dans la conversation
    const message = await prisma.message.create({
        data: {
            conversation_id: conversation.id,
            sender_id: userId,
            content,
        },
    });
    res.status(201).json(message);
}
