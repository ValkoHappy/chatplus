export default {
  register() {},

  async bootstrap({ strapi }: { strapi: any }) {
    const tracked = ['channel', 'industry', 'integration', 'solution', 'feature'];

    strapi.db.lifecycles.subscribe({
      afterCreate: (event: any) => triggerDeploy(event),
      afterUpdate: (event: any) => triggerDeploy(event),
    });

    async function triggerDeploy(event: any) {
      if (!tracked.includes(event.model?.singularName)) return;

      const token = process.env.GITHUB_ACTIONS_TOKEN;
      if (!token) return;

      try {
        await fetch('https://api.github.com/repos/ValkoHappy/chatplus/dispatches', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ event_type: 'strapi-content-update' })
        });
        console.log(`[Deploy] Rebuild triggered → ${event.model.singularName}`);
      } catch (e: any) {
        console.error('[Deploy] Failed:', e.message);
      }
    }
  },
};
