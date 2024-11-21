import { Command } from "commander";
import { JSDOM } from "jsdom";
import { Kysely } from "kysely";
import { Database as SQLite } from "bun:sqlite";
import { BunSqliteDialect } from "kysely-bun-sqlite";
import type { DB } from "kysely-codegen";
const DOMAIN = "https://www.yellow-pages.ph";

const program = new Command();

const db = new Kysely<DB>({
    dialect: new BunSqliteDialect({
        database: new SQLite(process.env.DATABASE_URL!),
    }),
});

program.version("0.0.1");

program.command("list")
    .description(
        "list all of the business in a given category and save it to the database",
    )
    .argument("<category>", "business category that will be search on")
    .option("--start <number>", "start page to be search with", "1")
    .option("-e, --end <number>", "end page to be search with", "10")
    .action(async (category, options: { start: string; end: string }) => {
        const startPage = Number(options.start);
        const endPage = Number(options.end);
        for (let i = startPage; i <= endPage; i++) {
            const url = `${DOMAIN}/category/${category}/page-${i}`;
            console.log(`Retrieving ${url}`);
            try {
                const dom = await retrieveHTML(url);
                const businessLink = dom.window.document.body.querySelectorAll(
                    ".search-tradename > .yp-click",
                ) as NodeListOf<HTMLAnchorElement>;
                console.log(`Found ${businessLink.length} business`);
                for (const link of businessLink) {
                    console.log(`Business link: ${link.href}`);
                    console.log(`Business name: ${link.innerHTML}`);
                    try {
                        await db.insertInto("business").values({
                            name: link.attributes.getNamedItem("data-permalink")
                                ?.value || "",
                            url: `${DOMAIN}${link.href}`,
                            category,
                        }).execute();
                        console.log(
                            `Inserted ${
                                link.attributes.getNamedItem("data-permalink")
                                    ?.value
                            }`,
                        );
                    } catch (e) {
                        continue;
                    }
                }
                await new Promise((resolve) => setTimeout(resolve, 5000));
            } catch (e) {
            }
        }
    });

program.command("retrieve")
    .description(
        "retrieve all of the business information in a given category and save it to the database",
    )
    .argument("<category>", "business category that will be search on")
    .action(async (category) => {
        const businesses = await db
            .selectFrom("business")
            .select(["business.url", "business.id", "business.name"])
            .where("category", "=", category)
            .execute();
        if (!businesses) {
            console.log(`No businesses found for this category: ${category}`);
            return;
        }
        console.log(`Found ${businesses.length} businesses`);
        for (const business of businesses) {
            const html = await retrieveHTML(business.url);
            const businessEmails = html.window.document.body.querySelectorAll(
                '.biz-link[data-section="email"]',
            ) as NodeListOf<HTMLAnchorElement>;

            const businessAddresses = html.window.document.body
                .querySelectorAll(
                    '.biz-link[data-section="address"]',
                ) as NodeListOf<HTMLAnchorElement>;

            const businessWebsites = html.window.document.body.querySelectorAll(
                '.biz-link[data-section="website"]',
            ) as NodeListOf<HTMLAnchorElement>;

            const businessSocials = html.window.document.body.querySelectorAll(
                '.biz-link[data-section="social"]',
            ) as NodeListOf<HTMLAnchorElement>;

            await db.transaction().execute(async (trx) => {
                let query = trx.insertInto("business_info");
                const maxLen = Math.max(
                    businessAddresses.length,
                    businessEmails.length,
                    businessWebsites.length,
                    businessSocials.length,
                );
                for (let i = 0; i < maxLen; i++) {
                    console.log(
                        `Inserting ${business.name} business info`,
                    );
                    await query.values({
                        email: businessEmails[i]?.innerHTML,
                        address: businessAddresses[i]?.innerHTML,
                        website: businessWebsites[i]?.href,
                        social: businessSocials[i]?.href,
                        business_id: business.id as number,
                    }).execute();
                }
            });

            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    });

async function retrieveHTML(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to retrieve ${url}`);
    }
    const body = await response.text();
    return new JSDOM(body);
}

async function main() {
    program.parse(process.argv);
}

main();
