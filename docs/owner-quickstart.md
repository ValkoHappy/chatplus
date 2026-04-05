# CHATPLUS for Owner

This is the shortest non-technical entrypoint into the project.

Use it if you are:

- a project owner
- a partner
- a manager
- a content operator who does not want to read the full engineering docs first

## 1. What this project is

`CHATPLUS` is a public website for the `Chat Plus` product.

It has two parts:

- the public site that visitors see
- the CMS admin panel where content is edited

In this project the CMS is `Strapi`, and the public site is built with `Astro`.

Simple model:

- `site` = public pages
- `CMS` = admin panel for content

## 2. What is edited where

There are two content modes.

### Managed content

This is edited directly in `Strapi`.

Typical examples:

- home page
- pricing
- partnership
- docs/media/promo-like managed pages

If you want to change text on this kind of page, the normal place is the CMS admin panel.

### Generated content

This is not edited manually in Strapi as the main source.

It is generated from project seed files and then imported into Strapi.

Typical examples:

- channels
- industries
- integrations
- features
- solutions
- competitors

If you want to change this kind of content, the source usually lives in `cms/seed/*.json`.

## 3. What a normal update looks like

### If someone changed content in Strapi

The next step is to rebuild the public site.

In Docker/VPS flow that usually means:

```bash
./deploy/scripts/build-portal.sh
```

In local/demo flow that usually means:

```powershell
npm.cmd --prefix portal run build
```

### If someone changed generated seed files

The normal order is:

1. update `cms/seed/*.json`
2. run content import
3. rebuild the public site

In Docker/VPS flow:

```bash
./deploy/scripts/seed-content.sh
./deploy/scripts/build-portal.sh
```

## 4. What infrastructure exists now

There are two deploy contours.

### Demo contour

- local Strapi
- Astro build
- `pages-preview`
- GitHub Pages

This is useful for showcase/demo publishing.

### Production contour

- `postgres`
- `strapi`
- `nginx`
- one-off build/import containers
- `docker compose`

This is the repeatable server-ready contour.

## 5. What the server setup needs

Minimum recommended VPS:

- `2 vCPU`
- `4 GB RAM`
- `40-60 GB SSD`

What the project needs from the server side:

- Ubuntu `22.04` or `24.04`
- Docker / Docker Compose
- a main domain for the public site
- a `cms.` subdomain for Strapi
- SSH access for setup

## 6. What is already automated

The project already has:

- reproducible Docker-based deploy files
- build/import scripts
- backup/restore scripts
- CI checks for PRs
- documentation for local, demo, and production flow

This means the project no longer depends only on “someone remembers how it was set up”.

## 7. What still stays manual

At the current stage these things are still human-controlled:

- approving content changes
- visual QA
- deciding when to publish
- running rebuild/update commands in the current flow

That is normal for the current maturity level.

## 8. If you only need three files

Start here:

1. [DEPLOY.md](/e:/Проекты/НоваяГлава/CHATPLUS/DEPLOY.md)
2. [release-flow.md](/e:/Проекты/НоваяГлава/CHATPLUS/docs/release-flow.md)
3. [operator-guide.md](/e:/Проекты/НоваяГлава/CHATPLUS/docs/operator-guide.md)

## 9. Shortest possible summary

- the site is static for visitors
- content is managed through Strapi
- some content is edited in CMS, some comes from seed files
- after content changes, the site must be rebuilt
- the project now has a repeatable Docker-based production contour
