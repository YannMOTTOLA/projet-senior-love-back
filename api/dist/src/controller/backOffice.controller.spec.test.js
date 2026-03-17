import { beforeEach, describe, it } from "node:test";
import assert from "node:assert";
import { prisma } from "../../src/models/index.js";
import { adminRequester, httpRequester, generateFakeMember } from "../../test/index.js";
/**
 * Helpers
 */
async function insertMemberInDb(overrides = {}) {
    const fake = generateFakeMember(overrides);
    const role = await prisma.role.findFirstOrThrow({
        where: { name: "member" }
    });
    await prisma.department.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            code: "75",
            name: "Paris"
        }
    });
    const city = await prisma.city.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            name: "Paris",
            postal_code: "75000",
            latitude: 48.8566,
            longitude: 2.3522,
            department_id: 1
        }
    });
    const user = await prisma.user.create({
        data: {
            id: fake.id,
            name: fake.name,
            email: fake.email,
            password: fake.password,
            city_id: city.id,
            profile_picture: fake.profile_picture,
            role_id: role.id,
            verified: true,
            active: fake.active ?? true,
            banned_until: fake.banned_until ?? null,
            created_at: fake.created_at ?? new Date()
        }
    });
    await prisma.member.create({
        data: {
            user_id: user.id,
            gender: fake.member.gender,
            phone_number: fake.member.phone_number,
            date_of_birth: fake.member.date_of_birth,
            relation_type: fake.member.relation_type,
            age_min: fake.member.age_min,
            age_max: fake.member.age_max
        }
    });
    return user;
}
/**
 * Setup DB
 */
beforeEach(async () => {
    await prisma.role.createMany({
        data: [
            { name: "member" },
            { name: "moderator" },
            { name: "admin" }
        ],
        skipDuplicates: true
    });
});
describe("[BACK OFFICE] Members controller", () => {
    it("should reject access without token", async () => {
        const res = await httpRequester.get("/backOffice/members");
        assert.equal(res.status, 401);
    });
    it("should return all members", async () => {
        await insertMemberInDb();
        await insertMemberInDb();
        const res = await adminRequester.get("/backOffice/members");
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 2);
        assert.ok(res.data[0].shortId);
    });
    it("should return one member by id", async () => {
        const user = await insertMemberInDb();
        const res = await adminRequester.get(`/backOffice/members/${user.id}`);
        assert.equal(res.status, 200);
        assert.equal(res.data.id, user.id);
        assert.ok(res.data.shortId);
    });
    it("should return 404 if member not found", async () => {
        const res = await adminRequester.get("/backOffice/members/unknown-id");
        assert.equal(res.status, 404);
    });
    it("should return at most 10 latest members", async () => {
        for (let i = 0; i < 12; i++) {
            await insertMemberInDb({
                created_at: new Date(Date.now() - i * 1000)
            });
        }
        const res = await adminRequester.get("/backOffice/members/latest");
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 10);
    });
    it("should return number of new members from last week", async () => {
        await insertMemberInDb({
            created_at: new Date()
        });
        await insertMemberInDb({
            created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
        });
        const res = await adminRequester.get("/backOffice/members/stats/new-last-week");
        assert.equal(res.status, 200);
        assert.equal(res.data.newMembersLastWeek, 1);
    });
    it("should deactivate a member for 48h", async () => {
        const user = await insertMemberInDb();
        const res = await adminRequester.patch(`/backOffice/members/${user.id}/deactivate-48h`);
        assert.equal(res.status, 200);
        const updated = await prisma.user.findUniqueOrThrow({
            where: { id: user.id }
        });
        assert.equal(updated.active, false);
        assert.ok(updated.banned_until);
    });
    it("should reject deactivate if already inactive", async () => {
        const user = await insertMemberInDb({
            active: false,
            banned_until: new Date()
        });
        const res = await adminRequester.patch(`/backOffice/members/${user.id}/deactivate-48h`);
        assert.equal(res.status, 400);
    });
    it("should deactivate a member for 1 week", async () => {
        const user = await insertMemberInDb();
        const res = await adminRequester.patch(`/backOffice/members/${user.id}/deactivate-1week`);
        assert.equal(res.status, 200);
    });
    it("should activate a deactivated member", async () => {
        const user = await insertMemberInDb({
            active: false,
            banned_until: new Date()
        });
        const res = await adminRequester.patch(`/backOffice/members/${user.id}/activate`);
        assert.equal(res.status, 200);
        const updated = await prisma.user.findUniqueOrThrow({
            where: { id: user.id }
        });
        assert.equal(updated.active, true);
        assert.equal(updated.banned_until, null);
    });
    it("should reject activate if already active", async () => {
        const user = await insertMemberInDb();
        const res = await adminRequester.patch(`/backOffice/members/${user.id}/activate`);
        assert.equal(res.status, 400);
    });
    it("should anonymize and deactivate a user", async () => {
        const user = await insertMemberInDb();
        const res = await adminRequester.patch(`/backOffice/members/${user.id}/delete`);
        assert.equal(res.status, 200);
        const deleted = await prisma.user.findUniqueOrThrow({
            where: { id: user.id }
        });
        assert.equal(deleted.active, false);
        assert.ok(deleted.deleted_at);
        assert.ok(deleted.email.startsWith("deleted+"));
    });
    it("should return all deactivated members with remaining time", async () => {
        await insertMemberInDb({
            active: false,
            banned_until: new Date(Date.now() + 60 * 60 * 1000)
        });
        const res = await adminRequester.get("/backOffice/members/desactivated");
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.ok(res.data[0].remaining_time_ms);
        assert.ok(res.data[0].remaining_time_hours);
    });
});
