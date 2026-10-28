# Engineering rules

- Inventory existing work and run relevant tests before changes. Preserve passing checks and explain any test changes.
- Never rename or remove an existing `data-testid` without approval. Add stable kebab-case IDs for new controls and values.
- Test routes, fake inboxes, resets, chaos, defect flags and seeded accounts belong only to development/test; production does not register them. Label public practice deployments “Test deployment”.
- Keep secrets out of the repository and browser bundles. Use ignored environment files and a documented `.env.example`; third-party secrets require a backend proxy.
- Use PostgreSQL consistently in development, CI and production.
- Isolate test users and data by worker. Never globally reset a parallel environment; global chaos needs an exclusive disposable environment.
- Weather-value assertions use fixtures. Tag separate live tests `@live` and keep them out of default deterministic runs.
- Use a dedicated branch for each milestone, descriptive commits and completion tags only after acceptance passes. Report blocked checks accurately.
- This project is non-commercial: no ads or payments. Show linked Weather data by Open-Meteo.com credits and respect upstream usage limits. Verify current terms before deployment.
- Label inputs, provide keyboard access and logical focus, and maintain WCAG AA contrast.
- Preserve the existing website stack, photographs, globe, test IDs, API contracts and stored compatibility names. New modules use TypeScript.
- Complete and verify each milestone before starting another; get explicit approval before moving to the next one. Android work remains deferred until the website is complete and explicitly approved.
