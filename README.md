# My personal website for super important stuff

## Development Info

SvelteKit app created using sv create.
Installed addons:

- Typescript
- Prettier
- Eslint
- Tailwindcss (typography, forms)

Uses pnpm package manager.

The repository does not pin a local Node.js or pnpm version. Use Unix-native tools in the
development environment and keep the deployment-specific versions in Cloudflare Pages settings.
Node.js 22.12 or newer is required by the current Vite and Wrangler versions.

### Local development

Install a current Node.js release and pnpm inside the Unix environment, rather than using a
Windows installation exposed through `/mnt/c` in WSL. For example, with `nvm`:

```bash
nvm install --lts
nvm use --lts
npm install --global pnpm@latest
pnpm install
```

To update dependencies to their latest versions within the declared ranges, use:

```bash
pnpm update
```

To request newer major versions as well, use `pnpm update --latest` and run the validation
commands before committing the resulting lockfile.

### Updating

Update using:

- pnpm update
- pnpm outdated
- pnpx sv migrate
- pnpm update --interactive --latest
- pnpm install
- pnpm dev

### Developing

start a development server:

```bash
pnpm dev

# or start the server and open the app in a new browser tab
pnpm dev -- --open
```

The private book-club route has a local-only preview entry point. Apply the D1 migrations once, run
the dev server, and open `/bookclub/login`; the development page includes an `OPEN LOCAL PREVIEW`
link that creates a local admin session without contacting Turnstile. This route is unavailable in
production builds.

```bash
pnpm exec wrangler d1 migrations apply ramis-bookclub --local
pnpm dev
```

The main site's editable copy lives in `src/content`. Markdown bodies hold the prose, while short
frontmatter blocks provide titles, summaries, dates, and draft status used automatically by the
site's layouts and indexes.

The deliberately retro `/silly` section also contains a fictional biography at
`/silly/who-is-ramis-bhatty`. It is a regular public page, linked from the silly homepage and served
with the same visible HTML to visitors and crawlers. Its copy and metadata live in
`src/content/pages/who-is-ramis-bhatty.md`; the route component only supplies the retro presentation.

### Building

To create a production version of your app:

```bash
pnpm build
```

You can preview the production build with `pnpm preview`.

Run the book-club test suite against an isolated local D1 database with:

```bash
pnpm test
```

Run the browser-level book-club smoke tests with:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

For faster iteration, the browser suites can be run separately:

```bash
pnpm test:e2e:public
pnpm test:e2e:bookclub
```

The public suite starts the local app without touching D1. It checks public routes, metadata,
navigation hierarchy, responsive overflow, draft pages, runtime errors, and accessibility. The
book-club suite additionally applies local D1 migrations, creates temporary test sessions, and
removes its test members when it finishes. It never uses production credentials or the remote D1
database. On Debian or Ubuntu, install Chromium's system dependencies once with `pnpm exec playwright
install-deps chromium` if the browser cannot launch.
Run `pnpm test:e2e` separately from `pnpm test` because both test commands use local worker/database
resources and can contend when started at the same time.

When book-club schema changes are added, apply any pending append-only migrations to the remote D1
database before deploying the corresponding application code:

```bash
pnpm dlx wrangler d1 migrations apply ramis-bookclub --remote
```

### Cloudflare Pages

The site is deployed through Cloudflare Workers/Pages using SvelteKit and Cloudflare Build System
v3. Configure the deployment-specific versions in the Cloudflare Pages project settings instead of
adding local version pins to this repository:

- Set `NODE_VERSION` to Node.js 22.12 or newer. Node.js 24 is suitable for the current dependencies.
- Set `PNPM_VERSION` to the pnpm version required by the Cloudflare deployment.
- Use `pnpm run build` as the build command.
- Keep `pnpm-lock.yaml` committed so the deployment installs the tested dependency tree.

The Cloudflare project settings are intentionally separate from the Unix developer toolchain.
The repository is already configured with `@sveltejs/adapter-cloudflare`; no additional deployment
adapter is required.
