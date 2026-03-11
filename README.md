# Demos

A shared repository for creating quick demos that are automatically deployed to S3.

## How It Works

Each branch is deployed to its own folder on S3. To create a demo:

1. Clone this repository.
2. Create a new branch for your demo (e.g. `git checkout -b my-demo-name`).
3. Add your HTML, CSS, and JavaScript files.
4. Push your branch.

Your demo will be automatically deployed to:
```
https://models-resources.concord.org/demos/branch/<your-branch-name>/
```

The entry point is `index.html` at the root of your branch.

## Deploying a Subfolder Instead of the Whole Repo

If your demo has a build step or you only want to deploy a specific folder, you can
modify the workflow in `.github/workflows/ci.yml` on your branch:

- Change `build` from `"true"` to your build command (e.g. `npm run build`).
- Change `folderToDeploy` from `"."` to the output folder (e.g. `dist`).

For example, if you have a Vite project:
```yaml
      - uses: actions/setup-node@v4
      # add this step before the s3-deploy-action step
      - name: Install Dependencies
        run: npm ci
      # then update the s3-deploy-action inputs:
      - uses: concord-consortium/s3-deploy-action@v1
        with:
          build: npm run build
          folderToDeploy: dist
          # ... keep other inputs the same
```
