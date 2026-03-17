import type { RoleName } from "@prisma/client";

declare global {
    namespace Express {
        interface Request {
            userId?: string;
            userRole?: RoleName;
        }
    }
}

export { };
