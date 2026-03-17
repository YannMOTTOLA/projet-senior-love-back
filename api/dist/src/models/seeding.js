import axios from "axios";
import { prisma } from "./index.js";
import { hash } from "argon2";
import { Gender, Relation_type } from "@prisma/client";
/* ======================================================
   UTILS
====================================================== */
function normalizeCityId(code) {
    if (/^\d+$/.test(code))
        return Number(code);
    if (code.startsWith("2A"))
        return 20000 + Number(code.slice(2));
    if (code.startsWith("2B"))
        return 21000 + Number(code.slice(2));
    return null;
}
function normalizeDepartmentId(code) {
    if (code === "2A")
        return 201;
    if (code === "2B")
        return 202;
    const n = Number(code);
    return Number.isNaN(n) ? null : n;
}
function stableHash(str) {
    return str.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}
function stablePick(arr, seed) {
    return arr[stableHash(seed) % arr.length];
}
function stablePicks(arr, count, seed) {
    const result = [];
    let h = stableHash(seed);
    while (result.length < count) {
        const item = arr[h % arr.length];
        if (!result.includes(item))
            result.push(item);
        h++;
    }
    return result;
}
function profilePicture(seed) {
    return `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/400`;
}
function birthDateFromAge(age) {
    const d = new Date();
    d.setFullYear(d.getFullYear() - age);
    d.setMonth(5);
    d.setDate(15);
    return d;
}
/* ======================================================
   SEED COMMUNES
====================================================== */
async function seedCities() {
    console.log("🌍 Seed des communes françaises...");
    const { data } = await axios.get("https://geo.api.gouv.fr/communes", {
        params: {
            fields: "nom,code,codesPostaux,centre,departement",
            format: "json",
        },
        timeout: 60000,
    });
    for (const c of data) {
        if (!c.code || !c.nom || !c.centre || !c.departement)
            continue;
        const cityId = normalizeCityId(c.code);
        const depId = normalizeDepartmentId(c.departement.code);
        if (!cityId || !depId)
            continue;
        await prisma.department.upsert({
            where: { id: depId },
            update: {},
            create: {
                id: depId,
                code: c.departement.code,
                name: c.departement.nom,
            },
        });
        await prisma.city.upsert({
            where: { id: cityId },
            update: {},
            create: {
                id: cityId,
                name: c.nom,
                postal_code: c.codesPostaux?.[0] ?? "",
                latitude: c.centre.coordinates[1],
                longitude: c.centre.coordinates[0],
                department_id: depId,
            },
        });
    }
    console.log("✅ Communes seedées");
}
/* ======================================================
   MAIN
====================================================== */
async function main() {
    await seedCities();
    /* ===== ROLES ===== */
    await prisma.role.createMany({
        data: [
            { id: "ROLE_ADMIN", name: "admin" },
            { id: "ROLE_MEMBER", name: "member" },
        ],
        skipDuplicates: true,
    });
    /* ===== INTERESTS ===== */
    const interestNames = [
        "Cuisine", "Randonnée", "Lecture", "Cinéma", "Voyage", "Photographie", "Yoga",
        "Jardinage", "Musique", "Peinture", "Bricolage", "Jeux de société", "Bien-être",
        "Marche", "Théâtre", "Danse", "Chant", "Écriture", "Histoire", "Généalogie",
        "Bénévolat", "Animaux", "Nature", "Méditation", "Pêche", "Cyclisme", "Natation",
        "Gym douce", "Pilates", "Tricot", "Couture", "Brocante", "Astronomie", "Œnologie",
        "Cuisine du monde", "Pâtisserie", "Scrabble", "Échecs", "Informatique",
        "Musées", "Conférences", "Podcasts", "Marche nordique", "Qi Gong", "Tai Chi"
    ];
    await prisma.interest.createMany({
        data: interestNames.map(name => ({ name })),
        skipDuplicates: true,
    });
    const interests = await prisma.interest.findMany();
    const cities = await prisma.city.findMany();
    /* ===== ADMIN ===== */
    const adminCity = stablePick(cities, "admin@example.com");
    const admin = await prisma.user.upsert({
        where: { email: "admin@example.com" },
        update: {},
        create: {
            name: "Administrateur",
            email: "admin@example.com",
            password: await hash("password"),
            role_id: "ROLE_ADMIN",
            city_id: adminCity.id,
            profile_picture: profilePicture("admin@example.com"),
            verified: true,
        },
    });
    await prisma.member.upsert({
        where: { user_id: admin.id },
        update: {},
        create: {
            user_id: admin.id,
            gender: Gender.homme,
            phone_number: "0600000000",
            date_of_birth: birthDateFromAge(60),
            relation_type: Relation_type.amicale,
            age_min: 50,
            age_max: 80,
        },
    });
    /* ===== USERS ===== */
    const firstNames = [
        "Jean", "Pierre", "Paul", "Marc", "Luc", "Alain", "Michel", "Jacques", "Bernard",
        "Claire", "Marie", "Sophie", "Isabelle", "Nathalie", "Catherine", "Monique"
    ];
    const lastNames = [
        "Martin", "Bernard", "Thomas", "Petit", "Robert", "Richard", "Durand",
        "Dubois", "Moreau", "Laurent", "Simon", "Lefèvre", "Roux"
    ];
    for (let i = 1; i <= 60; i++) {
        const email = `user${i}@example.com`;
        const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
        const city = stablePick(cities, email);
        const userInterests = stablePicks(interests, 3 + (i % 3), email);
        const age = 55 + (i % 25);
        const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                name,
                email,
                password: await hash("password"),
                role_id: "ROLE_MEMBER",
                city_id: city.id,
                profile_picture: profilePicture(email),
                bio: "J’aime partager des activités simples et rencontrer de nouvelles personnes.",
                verified: true,
                interests: {
                    connect: userInterests.map(i => ({ id: i.id })),
                },
            },
        });
        await prisma.member.upsert({
            where: { user_id: user.id },
            update: {},
            create: {
                user_id: user.id,
                gender: i % 2 === 0 ? Gender.homme : Gender.femme,
                phone_number: `06${(10000000 + i).toString().slice(0, 8)}`,
                date_of_birth: birthDateFromAge(age),
                relation_type: Relation_type.les_deux,
                age_min: 50,
                age_max: 85,
            },
        });
    }
    console.log("✅ Seed COMPLET terminé");
}
/* ======================================================
   RUN
====================================================== */
main()
    .catch((e) => {
    console.error("❌ Seed error", e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
