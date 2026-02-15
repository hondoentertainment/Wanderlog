---
description: How to deploy the application to Vercel production
---
1. Ensure all changes are committed to git.
```bash
git add .
git commit -m "chore: prepare for deployment"
```
2. Push changes to the remote repository.
```bash
git push origin <current-branch>
```
3. Run the Vercel deployment command.
// turbo
```bash
npx vercel --prod --yes
```
4. Verify the deployment URL.
