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

### Building

To create a production version of your app:

```bash
pnpm build
```

You can preview the production build with `pnpm preview`.

### Cloudflare Pages

The site is deployed through Cloudflare Workers/Pages using SvelteKit and Cloudflare Build System
v3. Configure the deployment-specific versions in the Cloudflare Pages project settings instead of
adding local version pins to this repository:

- Set `NODE_VERSION` to the Node.js version required by the Cloudflare deployment.
- Set `PNPM_VERSION` to the pnpm version required by the Cloudflare deployment.
- Use `pnpm run build` as the build command.
- Keep `pnpm-lock.yaml` committed so the deployment installs the tested dependency tree.

The Cloudflare project settings are intentionally separate from the Unix developer toolchain.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
