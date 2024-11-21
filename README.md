# yellow-page-scraper-ts

To install dependencies:

```bash
bun install
```

Note:
you need to have .env file in the root directory with the following content:

```bash
DATABASE_URL=db.sqlite # this will use bun:sqlite
```

run migrations:

```bash
bun migrate:latest
```

To run:

```bash
bun scrape
```

See instructions by running:

```bash
bun scrape help
```


