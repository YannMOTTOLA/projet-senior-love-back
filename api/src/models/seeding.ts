import axios from "axios";
import { prisma } from "./index.ts";
import { hash } from "argon2";
import {
  Gender,
  Relation_type,
  RoleName,
  Visibility,
} from "@prisma/client";

/* ======================================================
   UTILS (repris + compatibles)
====================================================== */

function normalizeCityId(code: string): number | null {
  if (/^\d+$/.test(code)) return Number(code);
  if (code.startsWith("2A")) return 20000 + Number(code.slice(2));
  if (code.startsWith("2B")) return 21000 + Number(code.slice(2));
  return null;
}

function normalizeDepartmentId(code: string): number | null {
  if (code === "2A") return 201;
  if (code === "2B") return 202;
  const n = Number(code);
  return Number.isNaN(n) ? null : n;
}

function stableHash(str: string): number {
  return str.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

function stablePick<T>(arr: T[], seed: string): T {
  return arr[stableHash(seed) % arr.length];
}

function stablePicks<T>(arr: T[], count: number, seed: string): T[] {
  const result: T[] = [];
  let h = stableHash(seed);
  while (result.length < count) {
    const item = arr[h % arr.length];
    if (!result.includes(item)) result.push(item);
    h++;
  }
  return result;
}

function profilePicture(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/400`;
}

function birthDateFromAge(age: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  d.setMonth(5);
  d.setDate(15);
  return d;
}

/* ======================================================
   SEED COMMUNES (TA VERSION QUI MARCHE)
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
    if (!c.code || !c.nom || !c.centre || !c.departement) continue;

    const cityId = normalizeCityId(c.code);
    const depId = normalizeDepartmentId(c.departement.code);
    if (!cityId || !depId) continue;

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
   ROLES (IDs fixes => pas de connect par name)
====================================================== */

async function seedRoles() {
  await prisma.role.createMany({
    data: [
      { id: "ROLE_ADMIN", name: RoleName.admin },
      { id: "ROLE_MEMBER", name: RoleName.member },
      { id: "ROLE_ORGANIZATION", name: RoleName.organization },
      { id: "ROLE_MODERATOR", name: RoleName.moderator },
    ],
    skipDuplicates: true,
  });
}

/* ======================================================
   INTERESTS
====================================================== */

async function seedInterests() {
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
    data: interestNames.map((name) => ({ name })),
    skipDuplicates: true,
  });
}

/* ======================================================
   USERS (400) répartis sur toute la France
   - upsert => seed rejouable
   - role_id => pas de connect par name
====================================================== */

async function seedUsers400() {
  console.log("👥 Seed 400 users répartis France...");

  const interests = await prisma.interest.findMany();
  const cities = await prisma.city.findMany();

  // Regroupe les villes par département pour répartir "proprement"
  const citiesByDept = new Map<number, typeof cities>();
  for (const city of cities) {
    const depId = city.department_id;
    if (!citiesByDept.has(depId)) citiesByDept.set(depId, []);
    citiesByDept.get(depId)!.push(city);
  }
  const departments = Array.from(citiesByDept.values());

  const firstNames = [
    "Jean", "Pierre", "Paul", "Marc", "Luc", "Alain", "Michel", "Jacques", "Bernard",
    "Claire", "Marie", "Sophie", "Isabelle", "Nathalie", "Catherine", "Monique"
  ];

  const lastNames = [
    "Martin", "Bernard", "Thomas", "Petit", "Robert", "Richard", "Durand",
    "Dubois", "Moreau", "Laurent", "Simon", "Lefèvre", "Roux"
  ];

  for (let i = 1; i <= 400; i++) {
    const email = `user${i}@example.com`;
    const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;

    // 1) choisir un département (rotation => couverture nationale)
    const deptCities = departments[i % departments.length];

    // 2) choisir une ville dans ce département de manière stable
    const city = stablePick(deptCities, email);

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
          connect: userInterests.map((it) => ({ id: it.id })),
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
        visibility: Visibility.online,
        relation_type: Relation_type.les_deux,
        age_min: 50,
        age_max: 85,
      },
    });
  }

  console.log("✅ 400 users créés");
}

/* ======================================================
   MAIN
====================================================== */

async function main() {
  await seedCities();
  await seedRoles();
  await seedInterests();
  await seedUsers400();

  console.log("🎉 Seed COMPLET terminé");
}

main()
  .catch((e) => {
    console.error("❌ Seed error", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
