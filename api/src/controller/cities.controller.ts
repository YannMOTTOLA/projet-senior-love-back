import type { Request, Response } from "express";
import axios from "axios";

export async function searchCities(req: Request, res: Response) {
    const q = String(req.query.q || "").trim();

    if (q.length < 2) {
        return res.json([]);
    }

    const { data } = await axios.get(
        "https://geo.api.gouv.fr/communes",
        {
            params: {
                nom: q,
                fields: "nom,code,codesPostaux,centre,departement",
                boost: "population",
                limit: 10,
            },
            timeout: 5000,
        }
    );

    const cities = data
        .filter(
            (c: any) =>
                c.centre &&
                c.centre.coordinates &&
                Array.isArray(c.codesPostaux) &&
                c.codesPostaux.length > 0
        )
        .map((c: any) => ({
            id: Number(c.code),
            name: c.nom,
            postal_code: c.codesPostaux[0],
            latitude: c.centre.coordinates[1],
            longitude: c.centre.coordinates[0],
            department_code: c.departement?.code ?? "",
            department_name: c.departement?.nom ?? "",
        }));

    res.json(cities);
}
