// Nos fonctions utilitaires pour les tests
import axios from "axios";
import { generateAccessToken } from "../src/lib/tokens.js";
import { randomUUID } from "crypto";
let fakeUserId = 0;
const TEST_CITY_ID = 1;
export function generateFakeMember(options) {
    fakeUserId++;
    const { roleName = "member", interests = ["cinema", "sport"], member: memberOverrides = {}, ...userOverrides } = options ?? {};
    const fakeRole = {
        id: randomUUID(),
        name: roleName,
    };
    const fakeInterests = interests.map((name) => ({
        id: randomUUID(),
        name,
        created_at: new Date(),
        updated_at: new Date(),
        users: [],
        events: [],
    }));
    const fakeUser = {
        id: randomUUID(),
        role_id: fakeRole.id,
        name: "Jean Test",
        email: `user${fakeUserId}@test.com`,
        password: "Password123!",
        city_id: TEST_CITY_ID,
        profile_picture: "https://picsum.photos/200",
        bio: "Bio de test réaliste",
        verified: true,
        active: true,
        banned_until: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        ...userOverrides,
    };
    const fakeMember = {
        id: randomUUID(),
        user_id: fakeUser.id,
        gender: "homme",
        phone_number: `06${fakeUserId.toString().padStart(8, "0")}`,
        date_of_birth: new Date("1970-01-01"),
        show_age: true,
        visibility: "online",
        relation_type: "amicale",
        age_min: 60,
        age_max: 90,
        created_at: new Date(),
        updated_at: new Date(),
        ...memberOverrides,
    };
    return {
        ...fakeUser,
        role: fakeRole,
        member: fakeMember,
        interests: fakeInterests,
    };
}
export function generateFakeOrganization(options) {
    fakeUserId++;
    const { roleName = "organization", interests = ["cinema", "sport"], organization: organizationOverrides = {}, ...userOverrides } = options ?? {};
    const fakeRole = {
        id: randomUUID(),
        name: roleName,
    };
    const fakeInterests = interests.map((name) => ({
        id: randomUUID(),
        name,
        created_at: new Date(),
        updated_at: new Date(),
        users: [],
        events: [],
    }));
    const fakeUser = {
        id: randomUUID(),
        role_id: fakeRole.id,
        name: "Association Test",
        email: `orga${fakeUserId}@test.com`,
        password: "Password123!",
        city_id: TEST_CITY_ID,
        profile_picture: "https://picsum.photos/200",
        bio: "Description de l’association",
        verified: true,
        active: true,
        banned_until: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        ...userOverrides,
    };
    const fakeOrganization = {
        id: randomUUID(),
        user_id: fakeUser.id,
        siret: "99999999900000",
        created_at: new Date(),
        updated_at: new Date(),
        ...organizationOverrides,
    };
    return {
        ...fakeUser,
        role: fakeRole,
        organization: fakeOrganization,
        interests: fakeInterests,
    };
}
export const httpRequester = axios.create({
    baseURL: `http://localhost:${process.env.PORT}/api`,
    validateStatus: () => true,
});
export const adminRequester = buildAuthedRequester(generateFakeMember({ roleName: "admin" }));
export function buildAuthedRequester(user) {
    const jwt = generateAccessToken(user);
    return axios.create({
        baseURL: `http://localhost:${process.env.PORT}/api`,
        headers: { Authorization: `Bearer ${jwt}` },
        validateStatus: () => true,
    });
}
