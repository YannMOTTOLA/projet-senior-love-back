import { beforeEach, describe, it } from "node:test";
import assert from "node:assert";
import { prisma } from "../../src/models/index.js";
import { httpRequester, generateFakeOrganization } from "../../test/index.js";
let organizationRoleId;
let fakeSiretCounter = 10000000000000;
function generateFakeSiret() {
    fakeSiretCounter += 1;
    return fakeSiretCounter.toString();
}
async function createTestCity() {
    const department = await prisma.department.upsert({
        where: { id: 50 },
        update: {},
        create: {
            id: 50,
            code: "50",
            name: "Test Department"
        }
    });
    return prisma.city.upsert({
        where: { id: 5000 },
        update: {},
        create: {
            id: 5000,
            name: "Test City",
            postal_code: "50000",
            latitude: 48.0,
            longitude: -1.0,
            department_id: department.id
        }
    });
}
async function generateFakeOrganizationBody(overrides = {}) {
    const fake = generateFakeOrganization({ roleName: "organization" });
    const city = await createTestCity();
    return {
        name: fake.name,
        email: fake.email,
        password: fake.password,
        city_id: city.id,
        city_name: city.name,
        postal_code: city.postal_code,
        latitude: city.latitude,
        longitude: city.longitude,
        department_code: "50",
        department_name: "Test Department",
        creation_date: fake.created_at.toISOString().slice(0, 10),
        siret: generateFakeSiret(),
        logo_url: fake.profile_picture,
        ...overrides
    };
}
beforeEach(async () => {
    fakeSiretCounter = 10000000000000;
    const role = await prisma.role.create({ data: { name: "organization" } });
    organizationRoleId = role.id;
});
describe("[POST] /api/auth/register/organization", () => {
    it("should register the organization user with the associated organization entry", async () => {
        const BODY = await generateFakeOrganizationBody();
        const res = await httpRequester.post("/auth/register/organization", BODY);
        assert.equal(res.status, 201);
        assert.equal(res.data.role, "organization");
        assert.equal(res.data.siret, BODY.siret);
        assert.equal(res.data.verification_status, "pending");
        const databaseUser = await prisma.user.findUniqueOrThrow({
            where: { email: BODY.email }
        });
        assert.equal(databaseUser.name, BODY.name);
        assert.equal(databaseUser.role_id, organizationRoleId);
        assert.equal(databaseUser.profile_picture, BODY.logo_url);
        assert.equal(databaseUser.city_id, BODY.city_id);
        const organization = await prisma.organization.findFirst({
            where: { user_id: databaseUser.id }
        });
        assert.ok(organization);
        assert.equal(organization.siret, BODY.siret);
        assert.equal(organization.created_at.toISOString().slice(0, 10), BODY.creation_date);
    });
    it("should reject if email is already taken", async () => {
        const city = await createTestCity();
        const existingUser = generateFakeOrganization({ roleName: "organization" });
        await prisma.user.create({
            data: {
                id: existingUser.id,
                name: existingUser.name,
                email: existingUser.email,
                password: existingUser.password,
                role_id: organizationRoleId,
                city_id: city.id,
                profile_picture: existingUser.profile_picture
            }
        });
        const BODY = await generateFakeOrganizationBody({
            email: existingUser.email
        });
        const res = await httpRequester.post("/auth/register/organization", BODY);
        assert.equal(res.status, 409);
    });
    it("should reject if SIRET is already taken", async () => {
        const city = await createTestCity();
        const duplicateSiret = generateFakeSiret();
        const existingOrganizationOwner = generateFakeOrganization({
            roleName: "organization"
        });
        await prisma.user.create({
            data: {
                id: existingOrganizationOwner.id,
                name: existingOrganizationOwner.name,
                email: existingOrganizationOwner.email,
                password: existingOrganizationOwner.password,
                role_id: organizationRoleId,
                city_id: city.id,
                profile_picture: existingOrganizationOwner.profile_picture
            }
        });
        await prisma.organization.create({
            data: {
                user_id: existingOrganizationOwner.id,
                siret: duplicateSiret,
                created_at: new Date("2010-01-01")
            }
        });
        const BODY = await generateFakeOrganizationBody({
            siret: duplicateSiret
        });
        const res = await httpRequester.post("/auth/register/organization", BODY);
        assert.equal(res.status, 409);
    });
    it("should reject if creation date is in the future", async () => {
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10);
        const BODY = await generateFakeOrganizationBody({
            creation_date: futureDate
        });
        const res = await httpRequester.post("/auth/register/organization", BODY);
        assert.equal(res.status, 422);
    });
});
