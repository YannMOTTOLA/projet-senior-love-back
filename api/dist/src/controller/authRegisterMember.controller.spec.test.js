import { beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert";
import { prisma } from "../../src/models/index.js";
import { httpRequester, generateFakeMember } from "../../test/index.js";
import { visionClient } from "../../src/services/vision.js";
async function createTestCity() {
    const department = await prisma.department.upsert({
        where: { id: 10 },
        update: {},
        create: {
            id: 10,
            code: "10",
            name: "Test Department"
        }
    });
    return prisma.city.upsert({
        where: { id: 1000 },
        update: {},
        create: {
            id: 1000,
            name: "Test City",
            postal_code: "10000",
            latitude: 48.5,
            longitude: 2.3,
            department_id: department.id
        }
    });
}
function generateFakeRegisterBody(overrides = {}) {
    const fake = generateFakeMember();
    return {
        name: fake.name,
        gender: fake.member.gender,
        email: fake.email,
        password: fake.password,
        phone_number: fake.member.phone_number,
        date_of_birth: fake.member.date_of_birth.toISOString().slice(0, 10),
        city_id: 1,
        city_name: "Paris",
        postal_code: "75000",
        latitude: 48.8566,
        longitude: 2.3522,
        department_code: "75",
        department_name: "Paris",
        bio: fake.bio,
        profile_picture: fake.profile_picture,
        interests: fake.interests.map(i => i.name),
        age_min: fake.member.age_min,
        age_max: fake.member.age_max,
        relation_type: fake.member.relation_type,
        ...overrides
    };
}
beforeEach(async () => {
    await prisma.role.create({
        data: { name: "member" }
    });
    await prisma.interest.createMany({
        data: [
            { name: "cinema" },
            { name: "sport" },
            { name: "voyage" }
        ],
        skipDuplicates: true
    });
});
describe("[POST] /api/auth/register", () => {
    it("should register the user in database", async () => {
        mock.method(visionClient, "safeSearchDetection", async () => [
            { safeSearchAnnotation: { adult: "UNLIKELY", violence: "UNLIKELY", racy: "UNLIKELY" } }
        ]);
        const BODY = await generateFakeRegisterBody();
        await httpRequester.post("/auth/register", BODY);
        const databaseUser = await prisma.user.findUniqueOrThrow({
            where: { email: BODY.email }
        });
        assert.equal(databaseUser.name, BODY.name);
        assert.equal(databaseUser.email, BODY.email);
        assert.equal(databaseUser.city_id, BODY.city_id);
    });
    it("should create the Member associated to the user", async () => {
        mock.method(visionClient, "safeSearchDetection", async () => [
            { safeSearchAnnotation: { adult: "UNLIKELY" } }
        ]);
        const BODY = await generateFakeRegisterBody();
        const res = await httpRequester.post("/auth/register", BODY);
        const member = await prisma.member.findFirst({
            where: { user_id: res.data.id }
        });
        assert.ok(member);
        assert.equal(member?.phone_number, BODY.phone_number);
    });
    it("should reject if email is already taken", async () => {
        const existing = generateFakeMember();
        const city = await createTestCity();
        await prisma.user.create({
            data: {
                id: existing.id,
                name: existing.name,
                email: existing.email,
                password: existing.password,
                city_id: city.id,
                role_id: (await prisma.role.findFirst({ where: { name: "member" } })).id,
                profile_picture: existing.profile_picture
            }
        });
        const BODY = await generateFakeRegisterBody({
            email: existing.email
        });
        const { status } = await httpRequester.post("/auth/register", BODY);
        assert.equal(status, 409);
    });
    it("should reject if an interest is unknown", async () => {
        const BODY = await generateFakeRegisterBody({
            interests: ["cinema", "unknown"]
        });
        const res = await httpRequester.post("/auth/register", BODY);
        assert.equal(res.status, 400);
    });
    it("should reject if Google Vision cannot analyze image", async () => {
        mock.method(visionClient, "safeSearchDetection", async () => [
            { safeSearchAnnotation: null }
        ]);
        const BODY = await generateFakeRegisterBody();
        const res = await httpRequester.post("/auth/register", BODY);
        assert.equal(res.status, 400);
    });
    it("should reject if SafeSearch flags the picture", async () => {
        mock.method(visionClient, "safeSearchDetection", async () => [
            { safeSearchAnnotation: { adult: 5 } }
        ]);
        const BODY = await generateFakeRegisterBody();
        const res = await httpRequester.post("/auth/register", BODY);
        assert.equal(res.status, 400);
    });
});
